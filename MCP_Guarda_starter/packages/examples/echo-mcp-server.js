// NDJSON "MCP-like" echo server (PoC)
// Reads lines of JSON, responds with result for methods.
const readline = require('readline')

const rl = readline.createInterface({ input: process.stdin })

rl.on('line', (line)=>{
  if (!line.trim()) return
  let msg
  try { msg = JSON.parse(line) } catch (e) { return }
  const { id, method, params } = msg
  if (!id) return
  // simulate results
  if (method === 'files.read') {
    return respond(id, { content: 'hello world\\n' })
  }
  if (method === 'files.write') {
    // pretend we wrote
    return respond(id, { ok: true, bytes: (params.content||'').length })
  }
  if (method === 'net.fetch') {
    return respond(id, { status: 200, body: 'ok' })
  }
  if (method === 'shell.exec') {
    return respondErr(id, -32010, 'exec not allowed by server (demo)')
  }
  respond(id, { ok:true })
})

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc:'2.0', id, result }) + '\n')
}
function respondErr(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc:'2.0', id, error:{ code, message }}) + '\n')
}
console.error('[echo-mcp-server] ready (NDJSON)')
