# MCP Guarda — Integrated Development Tasks

This document integrates the latest work from `packages/guard-core/` with the comprehensive roadmap from `docs/IMPLEMENTATION_CHECKLIST.md` and the current progress from `MCP_Guarda_starter/TASKS.md`.

## Current Status Summary

### ✅ Completed (Latest Work)
- **Guard Core CLI scaffold** - Working NDJSON proxy in MCP_Guarda_starter
- **Policy engine v0** - allow/ask/deny + path/host matchers implemented
- **Consent web UI v0** - Basic list/approve/deny interface working
- **Audit log v0** - JSONL logging implemented
- **NDJSON demo server & client** - Working demo with examples
- **Demo script** - Functional demonstration
- **Approval caching** - 10-minute TTL system implemented in packages/guard-core
- **Content-Length framing adapter** - Real MCP protocol support in packages/guard-core

### 🔄 In Progress (Integration Needed)
- **Integration of latest guard-core with MCP_Guarda_starter** - Key components exist but need integration

## Phase 1: Integration & Core Functionality (Week 0-1)

### 1.1 Integrate Latest Guard-Core Components (2d)
**Priority: Critical**
- [ ] Merge Content-Length framing adapter from `packages/guard-core/src/adapters/` into MCP_Guarda_starter
- [ ] Integrate approval cache from `packages/guard-core/src/approval_cache.js` 
- [ ] Update main `index.js` to use modular components instead of inline implementations
- [ ] Test integration with real MCP clients using Content-Length framing
- **Acceptance**: MCP_Guarda_starter can proxy real MCP JSON-RPC traffic without protocol errors

### 1.2 Enhanced Approval UI & Intent Summary (2d)
**Priority: High**
- [ ] Improve consent UI to show concise intent: action, target (path/host), process, size
- [ ] Add diff link preview for file operations
- [ ] Hide raw JSON by default; add "show details" toggle
- [ ] Implement session-based approval defaults (allow reads, ask for writes/exec/network)
- **Acceptance**: Users can understand and act on approvals within 5 seconds

### 1.3 Write Quarantine System (3d)
**Priority: High**
- [ ] Implement file write snapshots before changes
- [ ] Add diff viewer in web UI for quarantined writes
- [ ] Allow restore/rollback functionality
- [ ] Store binary file hashes and enable replace/restore
- **Acceptance**: Users can inspect and revert quarantined file writes

### 1.4 Basic Automated Tests & CI (2d)
**Priority: Medium**
- [ ] Create unit tests for Content-Length framing adapter
- [ ] Add tests for policy evaluation logic
- [ ] Test approval flow end-to-end
- [ ] Set up GitHub Actions CI pipeline
- **Acceptance**: CI passes on green, core functionality tested

## Phase 2: Production Readiness (Week 1-3)

### 2.1 Encrypted Local Storage (2d)
**Priority: High**
- [ ] Implement OS keyring integration for approval storage
- [ ] Add passphrase fallback for encrypted audit logs
- [ ] Persist approval cache across restarts
- [ ] Secure sensitive policy data
- **Acceptance**: Approvals and logs are encrypted and restore on restart

### 2.2 Network & Execution Controls (3d)
**Priority: High**
- [ ] Implement network allowlist enforcement for hosts
- [ ] Add execution gate with command allowlists
- [ ] Enhance policy engine for network/exec rules
- [ ] Test with realistic MCP server scenarios
- **Acceptance**: Network and execution operations properly gated

### 2.3 Policy Pack System (3d)
**Priority: Medium**
- [ ] Create curated policy packs (Files, Shell, Browser, GitHub)
- [ ] Implement policy import/export YAML functionality
- [ ] Add UI "apply policy pack" workflow
- [ ] Hot-reload policy changes
- **Acceptance**: 3+ policy packs available and easy to apply

### 2.4 CLI/TUI Approvals (2d)
**Priority: Medium**
- [ ] Build terminal UI for headless environments
- [ ] Display pending approvals in TUI
- [ ] Allow accept/deny from command line
- [ ] Test in server environments without browser access
- **Acceptance**: Users can operate Guarda in headless servers

## Phase 3: Polish & Distribution (Week 3-4)

### 3.1 Audit & Export Features (2d)
**Priority: Medium**
- [ ] Implement audit log export API (JSON/CSV)
- [ ] Add simple time/user/target queries
- [ ] Create admin dashboard for log review
- [ ] Add log rotation and archiving
- **Acceptance**: Admin can export last 7 days of logs as CSV

### 3.2 Packaging & Installation (4d)
**Priority: High**
- [ ] Create `npx` runner for easy installation
- [ ] Set up macOS brew tap/cask
- [ ] Build Windows MSI installer stub
- [ ] Package Linux .deb/.rpm distributions
- **Acceptance**: Users can install without building from source

### 3.3 Documentation & Demo Polish (2d)
**Priority: Medium**
- [ ] Create installation and setup guides
- [ ] Record demo videos and screenshots
- [ ] Update README with current capabilities
- [ ] Polish business deck and one-pager
- **Acceptance**: Clear documentation for new users

## Phase 4: Pro Features (Week 4+)

### 4.1 Advanced Security (Stretch)
- [ ] WebAuthn integration for secure approvals
- [ ] Threat modeling documentation
- [ ] Fuzz testing for parsers
- [ ] PII/secret detection in logs

### 4.2 Team Features (Stretch)
- [ ] Central policy sync system
- [ ] SSO integration and RBAC
- [ ] Cross-device approval caching
- [ ] Shared audit logs

### 4.3 Telemetry & Health (Stretch)
- [ ] Opt-in telemetry system
- [ ] Health metrics aggregation
- [ ] Performance monitoring
- [ ] Usage analytics

## Validation Experiments

### User Research
- [ ] Publish 2-minute demo video with single policy pack
- [ ] Track installation and conversion metrics
- [ ] Run 5 user sessions to observe approval fatigue
- [ ] Gather feedback on UI/UX improvements

### Community Outreach
- [ ] Outreach to 3 MCP server maintainers
- [ ] Collaborate on policy pack development
- [ ] Build community around security policies
- [ ] Create contributor guidelines

## Implementation Notes

### Architecture Decisions
- **Modular Design**: Keep guard-core components separate and testable
- **Backward Compatibility**: Maintain NDJSON support for existing demos
- **Security First**: Default deny policies, encrypted storage, audit everything
- **User Experience**: Minimize approval fatigue, clear intent display

### Technical Priorities
1. **Integration**: Make latest components work together seamlessly
2. **Real Protocol**: Content-Length framing for production MCP clients
3. **Security**: Quarantine, encryption, proper gating mechanisms
4. **Usability**: Clear UI, reasonable defaults, easy installation

---

**Owner**: @GSCrawley  
**Status**: Integration phase - combining latest guard-core work with proven MCP_Guarda_starter foundation  
**Next Action**: Begin Phase 1.1 - Integrate latest guard-core components