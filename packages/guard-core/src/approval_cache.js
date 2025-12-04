// Lightweight approval cache for runtime checks (default TTL: 600s)
const cache = new Map();

function setApproval(key, ttlSec = 600) {
  const expires = Date.now() + ttlSec * 1000;
  cache.set(key, { approved: true, expires });
}

function isApproved(key) {
  const entry = cache.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return false;
  }
  return entry.approved;
}

module.exports = { setApproval, isApproved };