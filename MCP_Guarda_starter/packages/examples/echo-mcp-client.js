// NDJSON client to talk to guard-core (PoC)
const readline = require('readline')

let id = 1
function send(method, params) {
  const msg = { jsonrpc:'2.0', id: id++, method, params }
  process.stdout.write(JSON.stringify(msg)+'\n')
}

const rl = readline.createInterface({ input: process.stdin })
rl.on('line', (line)=>{
  if (!line.trim()) return
  try { console.log('[resp]', line) } catch {}
})

setTimeout(()=> send('files.read',  { path: '~/Projects/demo/README.md' }), 200)
setTimeout(()=> send('files.write', { path: '~/Projects/demo/README.md', content: 'Updated content\\n' }), 600)
setTimeout(()=> send('net.fetch',   { url: 'https://api.github.com/repos/foo/bar', method: 'GET' }), 1000)
setTimeout(()=> send('shell.exec',  { cmd: 'rm -rf /' }), 1400)
