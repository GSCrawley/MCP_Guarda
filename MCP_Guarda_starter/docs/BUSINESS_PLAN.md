# Business Plan (concise)

## Problem
MCP servers multiply privileged surfaces (file writes, exec, network). Current clients lack fine-grained consent and audit.

## Solution
**MCP Guarda** — a drop-in **policy proxy + consent gateway**. Deny-by-default, intent-bound approvals, write quarantine, network/exec allowlists, full audit logs.

## Market & Users
- Individual developers/analysts using AI toolchains locally.
- Small teams with data/automation workflows.
- Enterprises piloting AI assistants on developer endpoints.

## Model
- **Open-core** (Apache-2.0).
- **Pro**: $7/user/mo (WebAuthn, diff viewer, approval caching, log export, auto-updates).
- **Teams**: $3–5/user/mo (central policy sync, SSO, RBAC, dashboards).
- **Enterprise**: site license + support + sandbox runner.

## GTM
Open-source launch (HN, GitHub), short video demo, policy packs for common servers, partnerships with server authors.

## Milestones
- PoC (today): local proxy, ask/allow/deny, consent UI, audit logs.
- +2 weeks: polished UI, remember-for-10-min, GitHub release & brew tap.
- +6 weeks: Pro features & billing.
- +12 weeks: Teams alpha with 5 design partners.

## Risks & Mitigations
- UX fatigue → approval caching, good defaults, per-folder trust.
- Protocol changes → stable adapter boundary, version detection.
- Performance → streaming mode, zero-copy pass-through, profiling.

## Use of Funds (seed)
Engineering (70%), GTM (20%), Design (10%). Target 1k Pro seats + 10 Teams orgs in 6 months (~$10–15k MRR).
