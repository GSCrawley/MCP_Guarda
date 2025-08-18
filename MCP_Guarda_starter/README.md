# MCP Guarda (starter)

**MCP Guarda** is a local **policy proxy + consent gateway** for MCP toolchains. It sits between the MCP client and MCP servers, enforcing **deny-by-default** policies, intent-bound approvals, sandboxing for writes, and full audit logs.

> This starter is a PoC scaffold for your investor demo. The JSON-RPC plumbing uses **NDJSON** for the demo server. Real MCP stdio framing (Content-Length) can be implemented next.

## Packages
- `packages/guard-core` – CLI proxy that inspects calls, enforces policy, hosts consent API.
- `packages/policy-bundles` – YAML policies and schema.
- `packages/examples` – Fake NDJSON “MCP-like” servers for demo.

## Quick demo
```bash
# Terminal A
cd packages/guard-core
npm i
node index.js --policy ../policy-bundles/default.yaml --port 8787 --   node ../examples/echo-mcp-server.js

# Terminal B (simulate client)
cd packages/examples
node echo-mcp-client.js  # sends read/write/fetch/exec methods
```

Open http://localhost:8787 in a browser to approve pending requests.

## Notes
- **PoC only**. For real MCP clients, implement JSON-RPC framing (Content-Length headers). See TODOs in code.
- Policies are `allow|ask|deny`. “Ask” will queue a request until you approve in the web UI.
