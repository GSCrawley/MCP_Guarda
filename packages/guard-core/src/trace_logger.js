// Basic trace + audit logging with unique request IDs
const crypto = require("crypto");

function newTraceId() {
  return crypto.randomUUID();
}

function logTrace(id, context) {
  console.log(`[TRACE ${id}]`, JSON.stringify(context));
}

module.exports = { newTraceId, logTrace };