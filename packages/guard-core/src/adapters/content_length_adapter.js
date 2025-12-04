// Wraps stdout messages with Content-Length headers for MCP compliance
function wrap(content) {
  const body = typeof content === 'string' ? content : JSON.stringify(content);
  return `Content-Length: ${Buffer.byteLength(body, 'utf8')}

${body}`;
}

module.exports = { wrap };