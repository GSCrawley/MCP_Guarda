# MCP Guarda — One Pager

**Tagline:** Make MCP safe on your laptop. Guardrails without friction.

**What it does:** A local policy proxy + consent gateway for MCP that blocks dangerous actions by default, asks you for approval with plain‑English intent, and keeps an audit log. Drop‑in. No code changes.

**Why it matters:** MCP servers run with your user permissions. One bad call can overwrite files, run commands, or exfiltrate data. Guarda limits scope and makes side‑effects explicit.

**How it works (3 steps):**
1) **Inspect** the tool call (files/net/exec).
2) **Ask** when risky (write/exec/network) — intent shown in plain English.
3) **Apply** or block and log — writes can be quarantined until approved.

**Who uses it:** Developers, analysts, security‑minded teams adopting AI tooling.

**Pricing:** Free (open‑core). Pro $7/user/mo. Teams $3–5/user/mo.

**Roadmap:** WebAuthn, diff viewer, container sandbox, OPA adapter, SSO/MDM.

**Call to action:** Try the open‑core PoC today. Upgrade to Pro when you need stronger approvals and reporting.
