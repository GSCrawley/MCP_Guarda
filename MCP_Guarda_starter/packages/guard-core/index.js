#!/usr/bin/env node
/**
 * MCP Guarda (PoC) - NDJSON proxy + policy + consent API
 * NOTE: For real MCP JSON-RPC over stdio, implement Content-Length framing.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import express from 'express';
import YAML from 'yaml';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import chokidar from 'chokidar';
import { nanoid } from 'nanoid';
import readline from 'readline';
import ApprovalCache from './src/approval_cache.js';
import { ContentLengthParser, writeFramed } from './src/adapters/content_length_adapter.js';

const argv = yargs(hideBin(process.argv))
  .usage('$0 --policy <file> [--protocol <type>] [--demo-traffic] --port 8787 -- <server-cmd> [args...]')
  .option('policy', { type: 'string', demandOption: true })
  .option('protocol', { type: 'string', default: 'auto', choices: ['ndjson', 'content-length', 'auto'], desc: 'Protocol type for MCP communication' })
  .option('port', { type: 'number', default: 8787 })
  .option('demo-traffic', { type: 'boolean', default: false, desc: 'Generate sample client requests internally for the demo' })
  .help().argv

const POL = loadPolicy(argv.policy)
watchPolicy(argv.policy)

const app = express()
app.use(express.json())

const approvals = new Map()   // id -> { status: 'pending'|'approved'|'denied', request }
const cache = new ApprovalCache({ ttlMs: 10 * 60 * 1000 }); // 10 minutes
const pendingQueue = new Map()// id -> resolve()

app.get('/', (req,res)=>{
  res.send(`
    <html><head><title>MCP Guarda</title>
      <style>body{font-family:sans-serif;padding:20px}
      .card{border:1px solid #ddd;padding:12px;border-radius:8px;margin:8px 0}</style>
    </head><body>
      <h1>MCP Guarda</h1>
      <p>Pending approvals: ${Array.from(approvals.values()).filter(a=>a.status==='pending').length}</p>
      ${Array.from(approvals.entries()).map(([id,a])=>`
        <div class="card">
          <div><b>${a.request.method}</b> — ${summarize(a.request)}</div>
          <form method="POST" action="/decide/${id}?approve=1"><button>Approve</button></form>
          <form method="POST" action="/decide/${id}?deny=1"><button>Deny</button></form>
        </div>
      `).join('')}
    </body></html>
  `)
})

app.post('/decide/:id', (req,res)=>{
  const id = req.params.id
  const approve = 'approve' in req.query
  const a = approvals.get(id)
  if (!a) return res.status(404).send('not found')
  a.status = approve ? 'approved' : 'denied'
  // Remember decision for 10 minutes using ApprovalCache
  const request = { method: a.request.method, target: extractTarget(a.request.params), args: a.request.params }
  cache.set(request, a.status === 'approved' ? 'allow' : 'deny')
  const waiter = pendingQueue.get(id)
  if (waiter) { waiter(); pendingQueue.delete(id) }
  res.redirect('/')
})

const serverArgsIndex = process.argv.indexOf('--')
if (serverArgsIndex < 0) {
  console.error('ERROR: You must pass the server command after --')
  process.exit(1)
}
const serverCmd = process.argv[serverArgsIndex+1]
const serverArgs = process.argv.slice(serverArgsIndex+2)

// Spawn the real (demo) server
const child = spawn(serverCmd, serverArgs, { stdio: ['pipe','pipe','pipe'] })

child.on('exit', (code)=>{
  console.error('[server] exited with', code)
  process.exit(code || 0)
})

// Protocol detection and setup
const protocol = argv.protocol;

if (protocol === 'content-length' || (protocol === 'auto' && process.env.MCP_PROTOCOL === 'content-length')) {
  console.error('[guard] using Content-Length framing');
  
  // Set up Content-Length parser for client input
  const clientParser = new ContentLengthParser();
  process.stdin.pipe(clientParser);
  
  clientParser.on('data', async (msg) => {
    if (msg && msg.method) {
      const response = await handleRequestFromClient(msg);
      if (response) {
        writeFramed(process.stdout, response);
      }
    } else {
      // Pass through non-method messages
      writeFramed(child.stdin, msg);
    }
  });
  
  // Set up Content-Length parser for server output
  const serverParser = new ContentLengthParser();
  child.stdout.pipe(serverParser);
  
  serverParser.on('data', (msg) => {
    writeFramed(process.stdout, msg);
  });
  
  function passthroughToServer(msg) {
    writeFramed(child.stdin, msg);
  }

} else {
  // NDJSON framing (PoC): each line is a JSON-RPC request/response
  console.error('[guard] using NDJSON framing (legacy/demo mode)');
  const rlClient = readline.createInterface({ input: process.stdin });
  const rlServer = readline.createInterface({ input: child.stdout });

  rlClient.on('line', async (line)=>{
    if (!line.trim()) return
    let msg
    try { msg = JSON.parse(line) } catch (e) { return passthroughToServer(line) }
    if (msg && msg.method) {
      handleRequestFromClient(msg)
    } else {
      // not a request; pass through
      passthroughToServer(line)
    }
  })

  rlServer.on('line', (line)=>{
    process.stdout.write(line+'\n')
  })

  function passthroughToServer(line) {
    child.stdin.write(line+'\n')
  }
}

async function handleRequestFromClient(req) {
  const { method, params, id } = req
  const decision = await decide(method, params)
  logAudit({ method, params, decision })
  
  if (decision === 'deny') {
    const err = { jsonrpc:'2.0', id, error: { code: -32001, message: `Denied by policy: ${method}` } }
    if (protocol === 'content-length') {
      return err;
    } else {
      return process.stdout.write(JSON.stringify(err)+'\n')
    }
  }
  
  if (decision === 'ask') {
    const ok = await awaitApproval(method, params)
    if (!ok) {
      const err = { jsonrpc:'2.0', id, error: { code: -32002, message: `Denied by user: ${method}` } }
      if (protocol === 'content-length') {
        return err;
      } else {
        return process.stdout.write(JSON.stringify(err)+'\n')
      }
    }
  }
  
  // allow - forward to server
  if (protocol === 'content-length') {
    writeFramed(child.stdin, req);
    return null; // Response will come from server
  } else {
    child.stdin.write(JSON.stringify(req)+'\n')
  }
}

function summarize(req) {
  const { method, params } = req
  if (method.startsWith('files.write')) {
    return `${params?.path} (${(params?.content||'').length||0} bytes)`
  }
  if (method.startsWith('files.read')) {
    return `${params?.path}`
  }
  if (method.startsWith('net.fetch')) {
    return `${params?.url} ${params?.method||'GET'}`
  }
  if (method.startsWith('shell.exec')) {
    return `${(params?.cmd||'').split(' ').slice(0,3).join(' ')} ...`
  }
  return JSON.stringify(params||{})
}

function extractTarget(params) {
  if (params?.path) return params.path;
  if (params?.url) return params.url;
  if (params?.cmd) return params.cmd;
  return JSON.stringify(params || {});
}

function intentKey(method, params) {
  if (method.startsWith('files.')) return `${method}:${params?.path}`
  if (method==='net.fetch') return `${method}:${params?.url}`
  if (method==='shell.exec') return `${method}:${params?.cmd}`
  return `${method}:${JSON.stringify(params||{})}`
}

async function decide(method, params) {
  // cache check using ApprovalCache
  const request = { method, target: extractTarget(params), args: params }
  const cached = cache.get(request)
  if (cached) return cached

  // policy
  const p = POL
  const match = (arr, tool, obj) => (arr||[]).some(rule => {
    if (rule.tool && rule.tool !== tool) return false
    if (tool.startsWith('files.') && rule.paths) {
      return rule.paths.some(glob => pathMatch(obj.path, glob))
    }
    if (tool==='net.fetch' && rule.hosts) {
      try { const u = new URL(obj.url); return rule.hosts.includes(u.host) } catch { return false }
    }
    if (tool==='shell.exec' && rule.cmds) {
      return rule.cmds.some(cmd => (obj.cmd||'').startsWith(cmd))
    }
    return true
  })
  const tool = method
  if (match(p.allow, tool, params)) return 'allow'
  if (match(p.ask, tool, params)) return 'ask'
  if (match(p.deny, tool, params)) return 'deny'
  // defaults
  if (tool.startsWith('files.read')) return p.defaults?.read || 'allow'
  if (tool.startsWith('files.write')) return p.defaults?.write || 'ask'
  if (tool==='net.fetch') return p.defaults?.network || 'ask'
  if (tool==='shell.exec') return p.defaults?.exec || 'deny'
  return 'ask'
}

function pathMatch(pth, pattern) {
  if (!pth || !pattern) return false
  // very simple glob: ~/ => expand, ** => substring, * => segment wildcard
  const home = process.env.HOME || ''
  pth = pth.replace(/^~\//, home + '/')
  pattern = pattern.replace(/^~\//, home + '/')
  if (pattern.endsWith('/**')) {
    const base = pattern.slice(0, -3)
    return pth.startsWith(base)
  }
  if (pattern.includes('*')) {
    const re = new RegExp('^' + pattern.replace(/\./g,'\\.').replace(/\*/g,'.*') + '$')
    return re.test(pth)
  }
  return pth === pattern
}

function loadPolicy(file) {
  const text = fs.readFileSync(file, 'utf8')
  const y = YAML.parse(text)
  return {
    defaults: y.defaults || { read:'allow', write:'ask', network:'ask', exec:'deny' },
    allow: (y.servers?.default?.allow || []).concat(y.allow||[]),
    ask:   (y.servers?.default?.ask || []).concat(y.ask||[]),
    deny:  (y.servers?.default?.deny || []).concat(y.deny||[]),
  }
}

function watchPolicy(file) {
  chokidar.watch(file, { ignoreInitial:true }).on('change', ()=>{
    try {
      const p = loadPolicy(file)
      POL.defaults = p.defaults; POL.allow = p.allow; POL.ask = p.ask; POL.deny = p.deny
      console.error('[policy] reloaded')
    } catch (e) {
      console.error('[policy] failed to reload:', e.message)
    }
  })
}

function logAudit({ method, params, decision }) {
  const line = JSON.stringify({ ts: new Date().toISOString(), method, params, decision }) + '\n'
  fs.appendFileSync(path.join(process.cwd(), 'audit.log'), line)
}

function awaitApproval(method, params) {
  const id = nanoid()
  const req = { method, params }
  const intentKeyStr = intentKey(method, params)
  approvals.set(id, { status:'pending', request: req, intentKey: intentKeyStr })
  return new Promise(resolve => {
    pendingQueue.set(id, () => {
      const a = approvals.get(id)
      resolve(a.status === 'approved')
      approvals.delete(id)
    })
  })
}

// Start web
app.listen(argv.port, ()=>{
  console.error(`[web] consent UI http://localhost:${argv.port}`)
})

// Pipe stderr from child to ours
child.stderr.on('data', (d)=> process.stderr.write(`[server] ${d}`))
console.error('[guard] running — waiting for client (NDJSON)')

// Optional built-in demo traffic so the consent UI shows pending approvals without an external client
if (argv.demoTraffic) {
  let demoId = 1
  const send = (method, params, delay) => setTimeout(()=>{
    handleRequestFromClient({ jsonrpc:'2.0', id: demoId++, method, params })
  }, delay)
  // These mirror the example client
  send('files.read',  { path: '~/Projects/demo/README.md' }, 300)
  send('files.write', { path: '~/Projects/demo/README.md', content: 'Updated content\n' }, 800)
  send('net.fetch',   { url: 'https://api.github.com/repos/foo/bar', method: 'GET' }, 1300)
  send('shell.exec',  { cmd: 'rm -rf /' }, 1800)
  console.error('[demo] generating sample traffic (--demo-traffic enabled)')
}
