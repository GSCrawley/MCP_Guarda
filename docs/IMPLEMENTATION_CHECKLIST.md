# Implementation Checklist (first 2 weeks + roadmap)

This checklist is designed to get MCP Guarda from PoC to a polished, testable local product and to validate demand with early users. Tasks are prioritized and sized for a small team (1-3 engineers + designer).

## Week 0–2: High-priority (MVP polish & validation)

1. JSON-RPC framing adapter (Content-Length) — 3d
   - Implement a robust Content-Length stdio framing adapter for real MCP clients.
   - Provide both client-adapter and server-adapter examples in packages/guard-core.
   - Acceptance: Demo client using real framing can proxy through Guarda without protocol errors.

2. Approval caching & defaults — 2d
   - Implement "remember-for-10-minutes" caching and per-session options.
   - Ship a sensible default policy: allow reads, ask for writes/exec/network by default.
   - Acceptance: Typical demo session requires <5 manual approvals.

3. Approval UI text & intent summary — 2d
   - Show concise intent: action, target (path/host), process, size, diff link.
   - Hide raw JSON by default; allow "show details".
   - Acceptance: Users can understand and act on an approval within 5s.

4. Encrypted local approval store — 2d
   - Use OS keyring (or a passphrase fallback) to encrypt approvals and audit logs on disk.
   - Acceptance: Approvals are stored encrypted and load on restart.

5. Basic automated tests + CI — 2d
   - Unit tests for framing, policy evaluation, and approval flows.
   - GitHub Actions that run on push and PR.
   - Acceptance: CI passes on green.

## Week 2–6: Medium priority (stability & polish)

6. Write quarantine + diff viewer — 5d
   - Snapshot file writes; show diff in UI and allow restore.
   - For binaries, store hashed snapshots and allow replace/restore.
   - Acceptance: Users can inspect and revert a quarantined write.

7. Policy packs & import/export — 5d
   - Curated policies for Files, Shell, Browser, GitHub.
   - Import/export YAML and a UI "apply policy pack" flow.
   - Acceptance: 3 policy packs available and easy to apply.

8. CLI/TUI approvals for headless environments — 3d
   - TUI that displays pending approvals and allows accept/deny from terminal.
   - Acceptance: Users can operate in servers without a browser.

9. Audit export API (JSON/CSV) — 2d
   - Export logs and approvals; add simple query by time/user/target.
   - Acceptance: Admin can export last 7 days as CSV.

10. Packaging & installers (dev preview) — 5d
   - macOS brew tap/cask, Windows MSI stub, Linux .deb/.rpm packaging.
   - Acceptance: Users can install without building from source.

## Week 6–12: Pro & teams features (stretch)

11. WebAuthn & secure approvals (Pro) — 6d
12. Central policy sync, SSO & RBAC (Teams) — 2–3w
13. Approval caching across devices & shared audit (Pro/Teams) — 1–2w
14. Telemetry opt-in & aggregated health metrics — 3d

## Security & quality tasks (ongoing)
- Threat modeling and docs for abuse cases.
- Fuzz tests for framing parser and repo-specific payloads.
- Redaction rules for logs (PII/secret detection).

## Quick experiments to validate demand
- Publish a short 2-minute demo + single policy pack and track installs/conversions.
- Run 5 user sessions (1:1) to observe approval fatigue.
- Outreach to 3 server maintainers for policy pack collaboration.

---

Owners: @GSCrawley (you) or nominated maintainers.

Notes: I can split these into GitHub issues and PRs next (one issue per checklist item).