# Guard-Core Integration Guide

This guide outlines how to integrate the latest modular components from `packages/guard-core/` into the working `MCP_Guarda_starter/` implementation.

## Integration Overview

### Current State
- **MCP_Guarda_starter**: Working NDJSON-based proxy with web UI, policies, demo
- **packages/guard-core**: New modular components (Content-Length adapter, approval cache)

### Target State
- **Unified Implementation**: MCP_Guarda_starter enhanced with guard-core modules
- **Real MCP Support**: Content-Length framing for production clients
- **Enhanced Caching**: Improved approval cache with proper TTL
- **Modular Architecture**: Testable, maintainable component structure

## Step-by-Step Integration

### Phase 1: Module Integration (Priority 1)

#### 1.1 Copy Guard-Core Components
```bash
# Copy new modules to MCP_Guarda_starter
cp -r packages/guard-core/src/ MCP_Guarda_starter/packages/guard-core/src/
```

#### 1.2 Update Package Dependencies
Update `MCP_Guarda_starter/packages/guard-core/package.json`:
```json
{
  "dependencies": {
    "express": "^4.19.2",
    "yaml": "^2.4.2", 
    "yargs": "^17.7.2",
    "chokidar": "^3.6.0",
    "nanoid": "^5.0.7"
  }
}
```

#### 1.3 Refactor Main Index.js
Replace inline cache and add Content-Length support:

**Before** (current MCP_Guarda_starter/packages/guard-core/index.js):
```javascript
const cache = new Map()       // intentKey -> { decision, expiresAt }
```

**After**:
```javascript
import ApprovalCache from './src/approval_cache.js';
import { ContentLengthParser, writeFramed } from './src/adapters/content_length_adapter.js';

const cache = new ApprovalCache({ ttlMs: 10 * 60 * 1000 }); // 10 minutes
```

#### 1.4 Add Protocol Detection
Support both NDJSON (demo) and Content-Length (production):
```javascript
// Detect protocol type from --protocol flag or auto-detect
const protocol = argv.protocol || 'auto'; // 'ndjson', 'content-length', 'auto'

if (protocol === 'content-length' || protocol === 'auto') {
  // Use ContentLengthParser for real MCP clients
  const parser = new ContentLengthParser();
  process.stdin.pipe(parser);
  parser.on('data', handleRequestFromClient);
  
  // Response using writeFramed
  function sendResponse(response) {
    writeFramed(process.stdout, response);
  }
} else {
  // Keep existing NDJSON for demos
  const rlClient = readline.createInterface({ input: process.stdin });
  rlClient.on('line', async (line) => {
    // existing logic
  });
}
```

### Phase 2: Enhanced Features (Priority 2)

#### 2.1 Approval Cache Integration
Replace manual cache with ApprovalCache:

**Before**:
```javascript
const intentKey = `${method}:${JSON.stringify(params)}`;
const cached = cache.get(intentKey);
if (cached && cached.expiresAt > Date.now()) {
  return cached.decision;
}
```

**After**:
```javascript
const request = { method, target: extractTarget(params), args: params };
const cached = cache.get(request);
if (cached) {
  return cached;
}
// After decision made:
cache.set(request, decision);
```

#### 2.2 Enhanced Web UI
Improve consent interface with better intent display:
```javascript
function summarize(request) {
  const { method, params } = request;
  switch (method) {
    case 'files.write':
      return `Write to: ${params.path} (${params.content?.length || 0} bytes)`;
    case 'files.read':
      return `Read from: ${params.path}`;
    case 'shell.exec':
      return `Execute: ${params.command}`;
    case 'net.fetch':
      return `Fetch: ${params.url}`;
    default:
      return JSON.stringify(params);
  }
}
```

### Phase 3: Testing Integration

#### 3.1 Test with NDJSON (Backward Compatibility)
```bash
cd MCP_Guarda_starter/packages/guard-core
npm install
node index.js --policy ../policy-bundles/default.yaml --protocol ndjson --port 8787 -- node ../examples/echo-mcp-server.js
```

#### 3.2 Test with Content-Length (New Feature)
```bash
# Create test MCP client with real framing
node index.js --policy ../policy-bundles/default.yaml --protocol content-length --port 8787 -- node ../examples/content-length-server.js
```

#### 3.3 Test Approval Cache
1. Make a request requiring approval
2. Approve it in web UI  
3. Make same request again within 10 minutes
4. Verify auto-approval (no UI prompt)

## File Changes Required

### Core Files to Modify
1. **MCP_Guarda_starter/packages/guard-core/index.js** - Main integration
2. **MCP_Guarda_starter/packages/guard-core/package.json** - Dependencies
3. **MCP_Guarda_starter/README.md** - Update documentation

### New Files to Add
1. **MCP_Guarda_starter/packages/guard-core/src/approval_cache.js**
2. **MCP_Guarda_starter/packages/guard-core/src/adapters/content_length_adapter.js**

### Test Files to Create
1. **MCP_Guarda_starter/packages/guard-core/test/** - Unit tests
2. **MCP_Guarda_starter/packages/examples/content-length-client.js** - Real MCP client
3. **MCP_Guarda_starter/packages/examples/content-length-server.js** - Real MCP server

## Validation Checklist

### ✅ Integration Success Criteria
- [ ] NDJSON demo still works (backward compatibility)
- [ ] Content-Length framing works with real MCP clients
- [ ] Approval cache properly stores and retrieves decisions
- [ ] Web UI shows enhanced intent summaries
- [ ] All existing functionality preserved
- [ ] New protocol detection works automatically

### 🔍 Testing Scenarios
- [ ] Basic file read/write operations
- [ ] Network fetch requests
- [ ] Shell command execution
- [ ] Mixed protocol support
- [ ] Cache expiration behavior
- [ ] Policy enforcement accuracy

## Next Steps After Integration

1. **Enhanced UI** - Better diff viewer, intent clarity
2. **Write Quarantine** - File snapshots and restore
3. **Security Hardening** - Encrypted storage, OS keyring
4. **Production Testing** - Real MCP server integration
5. **Documentation Update** - Reflect new capabilities

---

**Owner**: @GSCrawley  
**Priority**: Critical - Foundation for all subsequent development  
**Estimate**: 2-3 days for complete integration and testing