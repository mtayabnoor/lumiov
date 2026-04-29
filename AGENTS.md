# Lumiov — Agent Guidelines

Lumiov is an AI-enhanced Kubernetes desktop app built with Electron (shell) + Express backend + React frontend.
See [docs/tech-stack.md](docs/tech-stack.md) and [docs/agent-architecture.md](docs/agent-architecture.md) for deep-dives.

## Architecture

```
electron/main.ts          ← Electron main process; spawns backend as child process
backend/src/server.ts     ← Express + Socket.IO; talks to Kubernetes via @kubernetes/client-node
frontend/src/             ← React + MUI; communicates with backend over REST + Socket.IO
```

- Backend is **localhost-only** (port `3030`). Frontend dev server runs on `5173`.
- Electron loads the built frontend; in dev, it points to the Vite dev server.
- Backend is bundled with `@vercel/ncc` into a single file for Electron distribution.
- IPC bridge between Electron and frontend is in `electron/preload.cts` with context isolation enabled.

## Build & Dev Commands

```bash
# Install all workspaces
npm run install:all

# Develop (frontend + backend concurrently)
npm run dev

# Build everything
npm run build

# Package Electron app for current OS
npm run package

# Lint / type-check / audit across all workspaces
npm run lint:all
npm run type-check:all
npm run audit:all
```

Per-workspace: each of `frontend/`, `backend/`, `electron/` has its own `npm run dev`, `build`, `lint`, `type-check`.

## Code Conventions

- **TypeScript strict mode** everywhere — no untyped `any` without justification.
- **Separation of concerns**: Keep API routing, business logic, and UI rendering in separate layers.
  - Backend: `routes/` → HTTP, `handlers/` → Socket.IO, `services/` → business logic, `agent/` → AI.
  - Frontend: `features/` → feature modules, `components/` → reusable UI, `context/` → global state, `hooks/` → custom hooks, `services/` → API/socket calls.
- **Consistent error model**: Frontend and backend must share error shapes — strongly typed with `code`, `message`, and `recoverable` fields.
- **Never crash on external failures**: Handle missing kubeconfig, port conflicts, and network errors gracefully with retry/backoff. Pre-launch health checks run before the main window appears.
- **No auto-execute of destructive commands**: Any terminal command that deletes or modifies cluster state needs explicit user confirmation.

## Commit Messages

Conventional Commits are enforced by commitlint + husky. See [CONTRIBUTING.md](CONTRIBUTING.md) for full details.

Format: `<type>(<scope>): <subject>`  
Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

## Key Pitfalls

- **CORS**: Backend allows `file://` and `null` origins for Electron. Don't add restrictions that break the packaged app.
- **Socket.IO transports**: Configured for both `websocket` and `polling` — don't remove polling fallback.
- **Frontend asset paths**: Vite `base` is set to `"./"` so assets load correctly from the Electron file:// protocol.
- **Kubeconfig**: Pulled from `~/.kube/config`. The app handles the case where no cluster is reachable — never assume connectivity.
- **Backend bundling**: Importing new backend dependencies requires them to be compatible with `@vercel/ncc` bundling.

## AI / Agent Feature

See [docs/pod-diagnosis.md](docs/pod-diagnosis.md) and [docs/agent-architecture.md](docs/agent-architecture.md).  
LangChain + OpenAI models are used in `backend/src/agent/`. The `OPENAI_API_KEY` environment variable must be set for this to work.
