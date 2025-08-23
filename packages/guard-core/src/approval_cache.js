// Simple approval caching layer (in-memory + TTL) for PoC
// Responsibilities:
//  - store decision keys with expiry
//  - lookup whether a request should be auto-approved
//  - persist to disk (optional) for session restore (not implemented here)
//
// Key design: use deterministic request fingerprint (e.g. method + target + args hash)
// For production, combine more provenance (pid, user, process path).

const crypto = require('crypto');

class ApprovalCache {
  constructor({ ttlMs = 10 * 60 * 1000 } = {}) {
    this.ttlMs = ttlMs;
    this.store = new Map(); // key -> { decision: 'allow'|'deny', expiresAt }
  }

  _now() { return Date.now(); }

  _keyFor(request) {
    // request: { method, target, args }
    const str = `${request.method}|${request.target || ''}|${JSON.stringify(request.args || {})}`;
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  set(request, decision) {
    const key = this._keyFor(request);
    this.store.set(key, { decision, expiresAt: this._now() + this.ttlMs });
  }

  get(request) {
    const key = this._keyFor(request);
    const row = this.store.get(key);
    if (!row) return null;
    if (row.expiresAt < this._now()) {
      this.store.delete(key);
      return null;
    }
    return row.decision;
  }

  clear() {
    this.store.clear();
  }

  // optional: call periodically to prune expired
  prune() {
    const now = this._now();
    for (const [k, v] of this.store.entries()) {
      if (v.expiresAt < now) this.store.delete(k);
    }
  }
}

module.exports = ApprovalCache;