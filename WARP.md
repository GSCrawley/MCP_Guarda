# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**MCP Guarda** is a security-first policy proxy and consent gateway for the Model Context Protocol (MCP). It intercepts MCP JSON-RPC requests between clients and servers, enforcing deny-by-default policies, requiring explicit user approval for sensitive operations, and maintaining complete audit trails.

**Core Philosophy**: Nothing runs without explicit permission. Every operation must pass policy evaluation or receive user consent.

## Repository Structure

The repository contains two parallel development tracks currently being integrated:

- **`MCP_Guarda_starter/`** - Working Proof of Concept (PoC)
  - NDJSON-based proxy with web UI, policy engine, and demo system
  - Contains `packages/guard-core/`, `packages/examples/`, and `packages/policy-bundles/`
  - This is the **proven foundation** that currently works end-to-end

- **`packages/guard-core/`** - Latest modular components
  - Real MCP Content-Length framing support (`src/adapters/content_length_adapter.js`)
  - Enhanced approval caching with TTL (`src/approval_cache.js`)
  - These components need to be integrated into the starter

## Essential Commands

### Running the Current Demo (NDJSON-based PoC)

```bash
# Install dependencies
cd MCP_Guarda_starter/packages/guard-core
npm install

# Start the guard proxy with demo server
node index.js --policy ../policy-bundles/default.yaml --port 8787 -- node ../examples/echo-mcp-server.js

# In another terminal, run the demo client
cd MCP_Guarda_starter/packages/examples
node echo-mcp-client.js
```

Open http://localhost:8787 in a browser to approve/deny requests via the consent UI.

### Testing with Content-Length Protocol (New Feature)

```bash
cd MCP_Guarda_starter/packages/guard-core
node index.js --policy ../policy-bundles/default.yaml --protocol content-length --port 8787 -- node ../examples/content-length-server.js
```

### Running with Built-in Demo Traffic

```bash
# Generate sample requests internally without needing a separate client
node index.js --policy ../policy-bundles/default.yaml --port 8787 --demo-traffic -- node ../examples/echo-mcp-server.js
```

### Policy Management

```bash
# Edit default policy bundle
vim MCP_Guarda_starter/packages/policy-bundles/default.yaml

# Policy is hot-reloaded automatically on file changes
```

### Audit Log Review

```bash
# View audit trail (created in current working directory)
tail -f audit.log

# Export for analysis
cat audit.log | jq '.'
```

## Architecture and Code Organization

### High-Level Flow

1. **Client** sends JSON-RPC request (via stdin, NDJSON or Content-Length framed)
2. **Guard Core** (`index.js`) intercepts and parses the request
3. **Policy Engine** evaluates request against loaded YAML policy
4. **Decision Path**:
   - `allow` → Forward immediately to server
   - `ask` → Create pending approval in web UI, wait for user decision
   - `deny` → Return error to client without forwarding
5. **Approval Cache** remembers user decisions for 10 minutes (TTL-based)
6. **Audit Logger** writes all decisions to JSONL file
7. **Server** (if request forwarded) processes and returns response

### Key Components

#### 1. Main Proxy (`MCP_Guarda_starter/packages/guard-core/index.js`)

- **Protocol Detection** (lines 86-145): Auto-detects or explicitly uses NDJSON vs Content-Length framing
- **Request Handler** (`handleRequestFromClient`, lines 147-180): Core interception logic
- **Policy Evaluation** (`decide` function, lines 213-244): Matches requests against YAML rules
- **Approval System** (`awaitApproval`, lines 291-303): Manages pending user decisions
- **Web UI** (Express routes, lines 37-68): Simple HTML interface for approvals

#### 2. Policy Engine

**Policy Structure** (YAML):
```yaml
defaults:
  read: allow      # Default for file read operations
  write: ask       # Default for file write operations
  network: ask     # Default for network requests
  exec: deny       # Default for shell execution

servers:
  files:
    allow:
      - tool: files.read
        paths: ["~/Projects/demo/**", "/etc/hostname"]
    ask:
      - tool: files.write
        paths: ["~/Projects/demo/**"]
  
  shell:
    deny:
      - tool: shell.exec
  
  github:
    ask:
      - tool: net.fetch
        hosts: ["api.github.com"]
```

**Policy Matching Logic** (`decide` function):
- First checks `cache` for recent approval (10-minute TTL)
- Then evaluates `allow`, `ask`, `deny` rules in order
- Uses path globs (`~/Projects/demo/**`), host allowlists, and command prefixes
- Falls back to `defaults` if no rule matches
- Path matching supports `~/` expansion, `**` for recursive dirs, `*` for wildcards

#### 3. Modular Components (in `packages/guard-core/src/`)

**ApprovalCache** (`approval_cache.js`):
- In-memory cache with TTL expiration
- Uses SHA-256 hashing of `method|target|args` for deterministic keys
- Includes automatic pruning of expired entries
- Implements `get(request)`, `set(request, decision)`, `clear()`, `prune()`

**ContentLengthParser** (`adapters/content_length_adapter.js`):
- Transform stream that parses MCP Content-Length framed messages
- Extracts `Content-Length: <bytes>` header, reads exact body length
- Emits parsed JSON objects in readable object mode
- Companion `writeFramed(stream, obj)` function for responses

#### 4. Protocol Framing

**NDJSON (Legacy/Demo)**:
- One JSON object per line, newline-delimited
- Used by current `echo-mcp-server.js` and `echo-mcp-client.js` examples
- Simple readline-based parsing

**Content-Length (Production)**:
- Standard MCP JSON-RPC framing
- Format: `Content-Length: <bytes>\r\n\r\n<JSON body>`
- Required for real MCP client compatibility
- Implemented in `content_length_adapter.js`, integrated in `index.js` lines 89-118

### Integration Architecture

The codebase is currently in **Phase 1: Integration** - combining proven NDJSON foundation with new Content-Length support:

**Current State** (v0.1.0):
- ✅ NDJSON proxy working with web UI
- ✅ Policy engine with allow/ask/deny
- ✅ Approval cache module created
- ✅ Content-Length adapter created
- ⚠️ Components need integration testing

**Integration Pattern**:
1. `index.js` detects protocol type (`--protocol` flag or auto-detect)
2. Conditionally pipes through `ContentLengthParser` or `readline` interface
3. Both code paths converge at `handleRequestFromClient(msg)`
4. Responses use `writeFramed()` for Content-Length or `stdout.write()` for NDJSON

## Development Guidelines

### When Adding Features

1. **Maintain Dual Protocol Support**: Changes must work with both NDJSON (demos) and Content-Length (production)
2. **Update Policy Files**: New tool types need default policies in `default.yaml`
3. **Add Intent Summaries**: Update `summarize()` function for UI clarity
4. **Log Audit Events**: All decisions must call `logAudit()`
5. **Test Approval Flow**: Verify cache behavior and UI updates

### Policy Development

- **Start Restrictive**: Default to `deny` or `ask`, explicitly `allow` only safe operations
- **Use Granular Matchers**: Prefer specific paths/hosts over wildcards
- **Document Rationale**: Comment policy decisions in YAML
- **Hot-Reload Friendly**: Policies are watched by `chokidar` and reloaded on change

### Security Principles

- **Deny by Default**: Unknown operations must be denied or require approval
- **Least Privilege**: Policies should grant minimum necessary permissions
- **Intent Transparency**: Users must understand what they're approving
- **Audit Everything**: All decisions logged with full context
- **Time-Bound Approvals**: Cache TTL prevents indefinite permissions

### Testing Strategy

**Current Testing Gaps** (Phase 1.4 priority):
- ❌ No unit tests for Content-Length framing
- ❌ No tests for policy evaluation logic
- ❌ No end-to-end approval flow tests
- ❌ CI exists (`.github/workflows/ci.yml`) but runs placeholder tests

**Manual Testing Workflow**:
1. Start guard with demo server
2. Run echo client or use `--demo-traffic`
3. Verify requests appear in web UI
4. Approve/deny and check client receives correct response
5. Repeat same request within 10 minutes, verify cache hit (no UI prompt)
6. Check `audit.log` contains all operations

### Code Patterns

**Adding a New Tool Type**:
1. Update `summarize()` to extract relevant params
2. Update `extractTarget()` for cache key generation
3. Add matcher logic to `decide()` function
4. Add default policy to `loadPolicy()` defaults
5. Create policy examples in `default.yaml`
6. Test with demo client

**Implementing Write Quarantine** (Phase 1.3, roadmap item):
- Snapshot files before write operations
- Store in temporary quarantine directory
- Add diff viewer to web UI
- Implement rollback mechanism
- See `INTEGRATED_TASKS.md` Section 1.3

## Current Development Phase

**Phase 1: Integration & Core Functionality** (Week 0-1)

Focus: Merge `packages/guard-core/` components into `MCP_Guarda_starter/`

**Immediate Priorities**:
1. **Phase 1.1**: Integrate Content-Length adapter and approval cache (2d estimate)
2. **Phase 1.2**: Enhanced approval UI with clear intent display (2d)
3. **Phase 1.3**: Implement write quarantine system (3d)
4. **Phase 1.4**: Add automated tests and CI (2d)

See `INTEGRATED_TASKS.md` for complete task breakdown and acceptance criteria.

## Related Documentation

- **`README.md`** - Project overview, quick start, and roadmap
- **`INTEGRATED_TASKS.md`** - Comprehensive task list with priorities and estimates
- **`INTEGRATION_GUIDE.md`** - Step-by-step guide for merging guard-core components
- **`MCP_Guarda_starter/docs/ARCHITECTURE.md`** - PoC architecture details
- **`docs/IMPLEMENTATION_CHECKLIST.md`** - Original comprehensive roadmap

## Troubleshooting

### Common Issues

**Issue**: "Missing Content-Length header" error
- **Cause**: Client using NDJSON protocol but server expecting Content-Length
- **Fix**: Explicitly set `--protocol ndjson` or ensure client sends proper headers

**Issue**: Approvals not caching
- **Cause**: Request fingerprint changing between calls
- **Fix**: Verify `method`, `target`, and `args` are identical; check TTL hasn't expired

**Issue**: Policy changes not taking effect
- **Cause**: YAML syntax error or file watcher not triggering
- **Fix**: Check console for `[policy] failed to reload` messages; restart guard

**Issue**: Web UI shows no pending approvals
- **Cause**: All requests are `allow` by policy or guard process crashed
- **Fix**: Check audit.log for decisions; verify web server running on correct port

### Debugging Commands

```bash
# Check if guard process is running
ps aux | grep "node index.js"

# Monitor all guard output
node index.js --policy ../policy-bundles/default.yaml --port 8787 -- node ../examples/echo-mcp-server.js 2>&1 | tee guard-debug.log

# Trace policy evaluation (add console.error in decide() function)
# Edit index.js temporarily to add: console.error('[policy] evaluating', method, params, 'result:', result)

# Test policy parsing standalone
node -e "const fs = require('fs'); const YAML = require('yaml'); console.log(YAML.parse(fs.readFileSync('packages/policy-bundles/default.yaml', 'utf8')))"
```

## Dependencies

**Production Dependencies** (`MCP_Guarda_starter/packages/guard-core/package.json`):
- `express@^4.19.2` - Web server for consent UI
- `yaml@^2.4.2` - Policy file parsing
- `yargs@^17.7.2` - CLI argument parsing
- `chokidar@^3.6.0` - Policy file watching for hot-reload
- `nanoid@^5.0.7` - Approval ID generation

**Important**: The repository uses ES modules (`"type": "module"` in package.json)

## Key Files to Reference

- **Main entry point**: `MCP_Guarda_starter/packages/guard-core/index.js`
- **Policy example**: `MCP_Guarda_starter/packages/policy-bundles/default.yaml`
- **Demo server**: `MCP_Guarda_starter/packages/examples/echo-mcp-server.js`
- **Demo client**: `MCP_Guarda_starter/packages/examples/echo-mcp-client.js`
- **Approval cache**: `packages/guard-core/src/approval_cache.js`
- **Content-Length adapter**: `packages/guard-core/src/adapters/content_length_adapter.js`

## Notes for AI Assistants

- This is a **security-critical** project - always prioritize safety and auditability
- The codebase is in active integration phase - check `INTEGRATED_TASKS.md` for current status
- When suggesting changes, maintain backward compatibility with existing NDJSON demo
- Always consider approval fatigue - minimize unnecessary user prompts through smart caching
- The audit log format is JSONL (newline-delimited JSON) for streaming and analysis
- Policy hot-reload is a key feature - don't break `watchPolicy()` functionality
