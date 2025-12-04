// Core security filters: detect and block risky tool behaviors
const BLOCK_PATTERNS = [
  /\brm\s+-rf\b/i,
  /curl\s+https?:\/\//i,
  /\bDROP\s+TABLE\b/i,
  /secret\s*[:=]/i,
  /--password/i,
];

function checkDangerousInput(input) {
  return BLOCK_PATTERNS.some((regex) => regex.test(input));
}

module.exports = { checkDangerousInput };