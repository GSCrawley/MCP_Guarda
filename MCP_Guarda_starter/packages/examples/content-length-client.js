#!/usr/bin/env node
// Content-Length framed MCP client for testing integration
import { ContentLengthParser, writeFramed } from '../guard-core/src/adapters/content_length_adapter.js';
import { spawn } from 'child_process';

console.error('[content-length-client] starting...');

// Spawn the guard proxy with Content-Length protocol
const guard = spawn('node', [
  '../guard-core/index.js', 
  '--policy', '../policy-bundles/default.yaml',
  '--protocol', 'content-length',
  '--port', '8787',
  '--',
  'node', '../examples/echo-mcp-server.js'
], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Set up Content-Length parser for responses
const parser = new ContentLengthParser();
guard.stdout.pipe(parser);

parser.on('data', (response) => {
  console.error('[response]', JSON.stringify(response));
});

parser.on('error', (err) => {
  console.error('[parser error]', err.message);
});

guard.on('exit', (code) => {
  console.error('[guard] exited with code:', code);
  process.exit(code || 0);
});

// Send test requests using Content-Length framing
let id = 1;
function sendRequest(method, params) {
  const request = { jsonrpc: '2.0', id: id++, method, params };
  console.error('[request]', JSON.stringify(request));
  writeFramed(guard.stdin, request);
}

// Give the guard time to start
setTimeout(() => {
  console.error('[content-length-client] sending test requests...');
  sendRequest('files.read', { path: '~/Projects/demo/README.md' });
  setTimeout(() => sendRequest('files.write', { path: '~/Projects/demo/README.md', content: 'Updated content via Content-Length\n' }), 1000);
  setTimeout(() => sendRequest('net.fetch', { url: 'https://api.github.com/repos/foo/bar', method: 'GET' }), 2000);
  setTimeout(() => sendRequest('shell.exec', { cmd: 'echo "Hello from Content-Length client"' }), 3000);
  setTimeout(() => {
    console.error('[content-length-client] all requests sent');
    setTimeout(() => process.exit(0), 2000);
  }, 4000);
}, 2000);
