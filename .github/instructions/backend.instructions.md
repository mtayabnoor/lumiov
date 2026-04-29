---
description: 'Use when writing or modifying backend code: Express routes, Socket.IO handlers, Kubernetes service methods, or AI agent logic. Covers layer separation, error model, and K8s service conventions.'
applyTo: 'backend/src/**'
---

# Backend Conventions

See [docs/agent-architecture.md](../../docs/agent-architecture.md) for the full backend architecture.

## Layer Separation

| Folder      | Responsibility                         | Must NOT                     |
| ----------- | -------------------------------------- | ---------------------------- |
| `routes/`   | HTTP request parsing, response shaping | Contain business logic       |
| `handlers/` | Socket.IO event registration           | Call K8s API directly        |
| `services/` | Business logic, K8s API calls          | Import Socket.IO or Express  |
| `agent/`    | LangChain AI chains                    | Manage HTTP/socket lifecycle |

## Error Model

All error responses must use this shape — both REST and Socket.IO:

```typescript
{
  code: string;
  message: string;
  recoverable: boolean;
}
```

- `code`: machine-readable string (e.g. `K8S_UNREACHABLE`, `RESOURCE_NOT_FOUND`)
- `recoverable`: `true` if the user can retry without changing state

## K8s Service Rules

- Never call `@kubernetes/client-node` APIs outside of `services/kubernetes.service.ts`
- Use `k8sService.listResource(resource)` for snapshots, `k8sService.watchResource(...)` for streaming
- Always handle `K8sState` values: `INITIALIZING`, `CONNECTED`, `CONFIG_MISSING`, `CLUSTER_UNREACHABLE`, `ERROR`
- Use `withRetry()` (exponential backoff: 1s, 2s, 4s) for any network calls that may be transient

## Socket.IO Handler Pattern

```typescript
// handlers/example.handler.ts
export function registerExampleHandlers(io: Server, socket: Socket) {
  socket.on('event-name', async (payload) => {
    try {
      const result = await someService.doWork(payload);
      socket.emit('event-result', result);
    } catch (err) {
      socket.emit('event-error', {
        code: 'EXAMPLE_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
        recoverable: false,
      });
    }
  });
}
```

## CORS

`file://` and `null` origins are allowed — required for Electron packaging. Do not tighten the CORS config without accounting for these origins.

## Socket.IO Transports

Both `websocket` and `polling` are enabled. Do not remove `polling` — it is the fallback for environments where WebSocket upgrades fail.
