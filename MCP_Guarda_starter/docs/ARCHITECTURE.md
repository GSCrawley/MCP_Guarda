# Architecture (PoC)

## Components
- **Guard Core**: JSON-RPC NDJSON proxy; policy engine; consent API.
- **Consent UI**: simple localhost web (served by guard-core).
- **Policy Bundles**: YAML with allow/ask/deny rules and matchers.
- **Examples**: echo servers that mimic tools (`files.read`, `files.write`, `net.fetch`, `shell.exec`).

## Sequence (Mermaid)
```mermaid
sequenceDiagram
  participant Client
  participant Guarda
  participant Server
  Client->>Guarda: JSON-RPC request (method, params)
  Guarda->>Guarda: Inspect (tool, resource, risk)
  Guarda->>Guarda: Evaluate policy (allow/ask/deny)
  alt allow
    Guarda->>Server: Forward request
    Server-->>Guarda: Result
    Guarda-->>Client: Result
  else ask
    Guarda->>ConsentUI: Create pending approval
    Client-->>Guarda: waits
    User->>ConsentUI: Approve/Deny
    ConsentUI->>Guarda: Decision
    opt approve
      Guarda->>Server: Forward request
      Server-->>Guarda: Result
      Guarda-->>Client: Result
    end
  else deny
    Guarda-->>Client: Error (denied by policy)
  end
```

## Data
- **AuditEvent**: `{ts, method, resource, decision, reason, server, user}` (JSONL).
- **Approval**: in-memory, TTL.
- **Policy**: YAML parsed to rules; hot-reload planned.

## Roadmap to production
- Implement MCP stdio framing (Content-Length), WS transport.
- WebAuthn approvals; diff viewer for writes; container sandbox runner.
- Central policy sync; SSO; OPA/Cerbos adapter.
