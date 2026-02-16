# Lumiov - Technical Stack Documentation

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Frontend Stack](#frontend-stack)
- [Backend Stack](#backend-stack)
- [Electron Wrapper](#electron-wrapper)
- [Development Tools](#development-tools)
- [Build & Deployment](#build--deployment)
- [Dependencies Reference](#dependencies-reference)

---

## Project Overview

**Lumiov** is a production-grade Kubernetes management desktop application built with modern web technologies. The application provides real-time monitoring and management of Kubernetes resources through an intuitive desktop interface.

### Key Features

- 🚀 Real-time Kubernetes resource monitoring
- 🔄 WebSocket-based live updates
- 🖥️ Native desktop application (Electron)
- 🎨 Modern Material-UI interface
- 🔐 Secure localhost-only backend
- 📦 Auto-updates via electron-updater
- 🔒 Security-focused CI/CD pipeline

---

## Architecture Overview

Lumiov follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────────┐
│           Electron Desktop Wrapper              │
│  (Window Management, Auto-Updates, IPC)         │
└──────────────┬──────────────┬───────────────────┘
               │              │
    ┌──────────▼─────┐   ┌────▼──────────────────┐
    │   (React +     │   │   (Express +          │
    │   Vite)        │   │   Socket.IO)          │
    │                │◄─►│                       │
    │   Port: 3000   │   │   Port: 3030          │
    └────────────────┘   └───────┬───────────────┘
                                 │
                         ┌───────▼────────────┐
                         │  Kubernetes API    │
                         │  (@kubernetes/     │
                         │   client-node)     │
                         └────────────────────┘
```

### Communication Flow

1. **Frontend ↔ Backend**: Real-time bidirectional communication via Socket.IO
2. **Backend ↔ Kubernetes**: REST API calls and Watch API for streaming updates
3. **Electron ↔ Frontend**: IPC (Inter-Process Communication) for platform info
4. **Electron ↔ Backend**: Process management and lifecycle control

---

## Technology Stack

### Core Technologies

| Category                    | Technology              | Version | Purpose                               |
| --------------------------- | ----------------------- | ------- | ------------------------------------- |
| **Desktop Runtime**         | Electron                | 40.1.0  | Cross-platform desktop app wrapper    |
| **Frontend Framework**      | React                   | 19.x    | UI component library                  |
| **Frontend Build Tool**     | Vite                    | 7.x     | Fast build tool and dev server        |
| **Backend Framework**       | Express                 | 4.x     | HTTP server framework                 |
| **Real-time Communication** | Socket.IO               | 4.8.x   | WebSocket library (client & server)   |
| **Kubernetes Client**       | @kubernetes/client-node | 1.0.x   | Official Kubernetes JavaScript client |
| **Language**                | TypeScript              | 5.x     | Type-safe JavaScript                  |
| **Package Manager**         | npm                     | Latest  | Dependency management                 |

---

## Frontend Stack

### Build Configuration: **Vite**

**Configuration File**: [`frontend/vite.config.ts`](file:///T:/Projects/lumiov/frontend/vite.config.ts)

```typescript
{
  plugins: [react(), tsconfigPaths()],
  base: "./",               // Relative paths for Electron
  server: { port: 3000 },   // Dev server port
  build: { outDir: "dist" } // Production build output
}
```

### UI Framework: **React 19.2.3**

- Latest React with concurrent features
- Function components with Hooks
- Strict mode enabled for development

### UI Component Library: **Material-UI v7**

**Core Packages:**

- `@mui/material` (7.3.7) - Core components
- `@mui/icons-material` (7.3.7) - Icon set
- `@emotion/react` (11.14.0) - CSS-in-JS styling
- `@emotion/styled` (11.14.1) - Styled components API

**Why Material-UI?**

- Production-ready components
- Comprehensive design system
- Excellent TypeScript support
- Customizable theming
- Accessibility built-in

### Routing: **React Router v7**

**Package**: `react-router-dom` (7.12.0)

- Client-side routing
- Nested routes
- Protected routes support
- History management

### Real-time Communication: **Socket.IO Client**

**Package**: `socket.io-client` (4.8.3)

**Usage:**

- Connects to backend WebSocket server
- Real-time Kubernetes resource updates
- Automatic reconnection handling
- Event-based communication

### Testing Libraries

| Package                       | Version | Purpose                     |
| ----------------------------- | ------- | --------------------------- |
| `@testing-library/react`      | 16.3.2  | React component testing     |
| `@testing-library/dom`        | 10.4.1  | DOM testing utilities       |
| `@testing-library/jest-dom`   | 6.9.1   | Custom Jest matchers        |
| `@testing-library/user-event` | 13.5.0  | User interaction simulation |
| `@types/jest`                 | 27.5.2  | TypeScript types for Jest   |

### Performance Monitoring

**Package**: `web-vitals` (2.1.4)

- Measures Core Web Vitals (LCP, FID, CLS)
- Performance metrics reporting

### TypeScript Configuration

**File**: `frontend/tsconfig.json` (inherited from Vite defaults)

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx"
  }
}
```

### Development Dependencies

| Package                | Version | Purpose                    |
| ---------------------- | ------- | -------------------------- |
| `@vitejs/plugin-react` | 5.1.2   | Vite plugin for React      |
| `vite-tsconfig-paths`  | 6.0.5   | Path aliases from tsconfig |
| `@types/node`          | 25.2.0  | Node.js type definitions   |
| `@types/react`         | 19.2.8  | React type definitions     |
| `@types/react-dom`     | 19.2.3  | ReactDOM type definitions  |
| `typescript`           | 4.9.5   | TypeScript compiler        |

### Frontend Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── feedback/     # Error boundaries, loading states
│   │   └── layout/       # Layout components (MainLayout, Sidebar)
│   ├── features/         # Feature-specific components
│   │   ├── pods/         # Pod management UI
│   │   └── deployments/  # Deployment management UI
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API and Socket.IO services
│   ├── interfaces/       # TypeScript interfaces
│   ├── theme/            # MUI theme configuration
│   ├── utils/            # Utility functions
│   ├── routes.tsx        # Route definitions
│   ├── App.tsx           # Root component
│   └── index.tsx         # Entry point
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
└── package.json          # Dependencies
```

---

## Backend Stack

### Server Framework: **Express 4.21.2**

**Main File**: [`backend/src/server.ts`](file:///T:/Projects/lumiov/backend/src/server.ts)

**Features:**

- RESTful API endpoints
- WebSocket server integration
- Localhost-only binding (security)
- CORS configuration
- Error handling middleware

### Real-time Server: **Socket.IO 4.8.3**

**Purpose**: Real-time bidirectional event-based communication

**Use Cases:**

- Streaming Kubernetes resource updates
- Real-time pod status changes
- Live log streaming
- Connection state management

### Kubernetes Client: **@kubernetes/client-node 1.0.1**

**Official Kubernetes JavaScript Client**

**Capabilities:**

- Full Kubernetes API support
- Watch API for streaming updates
- KubeConfig loading (from ~/.kube/config)
- Type definitions included

**Common Operations:**

- List pods, deployments, services
- Watch resources for changes
- Execute commands in containers
- Read pod logs

### Environment Configuration: **dotenv 16.4.7**

- Loads environment variables from `.env` files
- Configuration management
- Secrets handling

### TypeScript Configuration

**File**: [`backend/tsconfig.json`](file:///T:/Projects/lumiov/backend/tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}
```

### Development Dependencies

| Package          | Version | Purpose                           |
| ---------------- | ------- | --------------------------------- |
| `tsx`            | 4.19.2  | TypeScript execution (dev server) |
| `@types/express` | 5.0.0   | Express type definitions          |
| `@types/node`    | 22.10.7 | Node.js type definitions          |
| `typescript`     | 5.7.3   | TypeScript compiler               |

### Backend Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── k8s.ts        # Kubernetes client setup
│   ├── handlers/         # Request handlers
│   │   └── watch-resource.ts  # WebSocket handlers
│   ├── services/         # Business logic
│   │   └── kubernetes.service.ts  # K8s operations
│   ├── routes/           # API route definitions
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   └── server.ts         # Main entry point
├── tsconfig.json         # TypeScript config
└── package.json          # Dependencies
```

### Backend Scripts

```json
{
  "dev": "tsx watch src/server.ts", // Development with hot reload
  "build": "tsc", // Production build
  "start": "node dist/server.js", // Run production build
  "type-check": "tsc --noEmit" // Type checking only
}
```

---

## Electron Wrapper

### Electron Version: **40.1.0**

Latest stable Electron with Chromium 134 and Node.js 22

### Main Process

**File**: [`electron/main.ts`](file:///T:/Projects/lumiov/electron/main.ts)

**Responsibilities:**

- Create and manage browser windows
- Launch and manage backend process
- Handle auto-updates
- Provide IPC handlers
- Manage application lifecycle

### Backend Launcher

**File**: [`electron/backend-launcher.ts`](file:///T:/Projects/lumiov/electron/backend-launcher.ts)

**Purpose**: Spawn and manage the Express backend as a child process

**Features:**

- Different paths for dev vs production
- Process lifecycle management
- Graceful shutdown handling
- Error reporting

### Preload Script

**File**: [`electron/preload.cts`](file:///T:/Projects/lumiov/electron/preload.cts)

**Purpose**: Secure bridge between main process and renderer

**Security Features:**

- Context isolation enabled
- Sandbox mode enabled
- No Node.js integration in renderer
- Selective IPC exposure

### Auto-Updates: **electron-updater 6.1.7**

**Features:**

- Automatic update checking
- Background download
- User notification on update
- Delta updates support
- GitHub releases integration

**Configuration** (in root `package.json`):

```json
{
  "publish": [
    {
      "provider": "github",
      "owner": "mtayabnoor",
      "repo": "lumiov-releases",
      "releaseType": "release"
    }
  ]
}
```

### Electron Builder: **26.7.0**

**Purpose**: Package and distribute Electron apps

**Windows Configuration:**

```json
{
  "win": {
    "target": ["nsis"],
    "cscLink": "lumiov_dev.pfx"
  },
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

### Electron Project Structure

```
electron/
├── main.ts              # Main process entry point
├── backend-launcher.ts  # Backend process manager
├── preload.cts          # Preload script (CommonJS)
├── dist/                # Compiled output
└── .gitignore
```

### Electron TypeScript Configuration

**File**: [`tsconfig.json`](file:///T:/Projects/lumiov/tsconfig.json) (root)

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "outDir": "./electron/dist/electron",
    "rootDir": "./electron",
    "types": ["node", "electron"]
  }
}
```

---

## Development Tools

### Version Control & Quality

| Tool                 | Version | Purpose                            |
| -------------------- | ------- | ---------------------------------- |
| **Husky**            | 9.0.0   | Git hooks management               |
| **Commitlint**       | 18.6.0  | Commit message validation          |
| **Standard-Version** | 9.5.0   | Automated versioning and changelog |

### Commit Convention: **Conventional Commits**

**Configuration**: [`commitlint.config.js`](file:///T:/Projects/lumiov/commitlint.config.js)

**Enforced Types:**

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Test changes
- `build:` - Build system changes
- `ci:` - CI/CD changes
- `chore:` - Maintenance tasks

### Build Utilities

| Tool             | Version | Purpose                               |
| ---------------- | ------- | ------------------------------------- |
| **Concurrently** | 8.2.0   | Run multiple npm scripts in parallel  |
| **Wait-on**      | 7.2.0   | Wait for resources (e.g., dev server) |
| **Rimraf**       | 5.0.0   | Cross-platform file deletion          |

### Development Scripts (Root)

```json
{
  "dev": "concurrently \"dev:frontend\" \"dev:backend\" \"dev:electron\"",
  "dev:frontend": "cd frontend && npm start", // Vite dev server
  "dev:backend": "cd backend && npm run dev", // tsx watch (port 3030)
  "dev:electron": "wait-on http://localhost:3000 && tsc && electron .",

  "build": "npm run build:frontend && build:backend && tsc",
  "build:frontend": "cd frontend && npm run build", // Vite build
  "build:backend": "cd backend && npm run build", // tsc

  "package": "npm run build && electron-builder",
  "clean": "rimraf dist release",

  "release": "standard-version",
  "release:dry-run": "standard-version --dry-run"
}
```

---

## Build & Deployment

### CI/CD Platform: **GitHub Actions**

**Workflow Files** in [`.github/workflows/`](file:///T:/Projects/lumiov/.github/workflows/):

#### 1. PR Checks ([pr-checks.yml](file:///T:/Projects/lumiov/.github/workflows/pr-checks.yml))

**Triggers**: Pull requests to master

**Jobs:**

- **Lint and Type Check**
  - Frontend build (includes type checking)
  - Backend type checking
- **Security Scan**
  - `npm audit` on all modules
  - Fails on high/critical vulnerabilities
- **Build Validation**
  - Test builds for frontend, backend, Electron

#### 2. Build and Release ([build.yml](file:///T:/Projects/lumiov/.github/workflows/build.yml))

**Triggers**: Push to master branch

**Steps:**

1. Security audit (npm audit)
2. Build all components
3. Bump version automatically (standard-version)
4. Generate changelog
5. Push version commit and tag
6. Build Electron app (electron-builder)
7. Publish to GitHub releases
8. Create GitHub release with changelog

#### 3. CodeQL Security Analysis ([codeql.yml](file:///T:/Projects/lumiov/.github/workflows/codeql.yml))

**Triggers**: PRs, master pushes, weekly schedule

**Purpose**: Advanced security analysis for JavaScript/TypeScript

### Dependency Management: **Dependabot**

**Configuration**: [`.github/dependabot.yml`](file:///T:/Projects/lumiov/.github/dependabot.yml)

**Monitored Packages:**

- Root npm dependencies (weekly)
- Frontend npm dependencies (weekly)
- Backend npm dependencies (weekly)
- GitHub Actions (weekly)

**Features:**

- Automated PRs for updates
- Conventional commit messages
- Security vulnerability alerts

### Semantic Versioning

**Configuration**: [`.versionrc.json`](file:///T:/Projects/lumiov/.versionrc.json)

**Version Bump Rules:**

- `feat:` commits → MINOR version bump (1.0.0 → 1.1.0)
- `fix:` commits → PATCH version bump (1.0.0 → 1.0.1)
- `feat!:` or `BREAKING CHANGE:` → MAJOR bump (1.0.0 → 2.0.0)

**Multi-Package Versioning:**

- Root `package.json`
- Frontend `package.json`
- Backend `package.json`

All synchronized to same version number.

### Build Outputs

**Development:**

- Frontend: `http://localhost:3000` (Vite dev server)
- Backend: `http://localhost:3030` (Express server)
- Electron: Loads frontend from localhost

**Production:**

```
lumiov/
├── electron/dist/electron/    # Compiled Electron code
├── frontend/dist/             # Vite production build
├── backend/dist/              # Compiled backend code
└── release/                   # Final packaged app (.exe, installers)
```

---

## Dependencies Reference

### Root Dependencies

```json
{
  "dependencies": {
    "electron-updater": "^6.1.7"
  },
  "devDependencies": {
    "@commitlint/cli": "^18.6.0",
    "@commitlint/config-conventional": "^18.6.0",
    "concurrently": "^8.2.0",
    "electron": "40.1.0",
    "electron-builder": "26.7.0",
    "husky": "^9.0.0",
    "rimraf": "^5.0.0",
    "standard-version": "^9.5.0",
    "typescript": "^5.3.0",
    "wait-on": "^7.2.0"
  }
}
```

### Frontend Dependencies

```json
{
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@mui/icons-material": "^7.3.7",
    "@mui/material": "^7.3.7",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^13.5.0",
    "@types/jest": "^27.5.2",
    "@types/react": "^19.2.8",
    "@types/react-dom": "^19.2.3",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-router-dom": "^7.12.0",
    "socket.io-client": "^4.8.3",
    "typescript": "^4.9.5",
    "web-vitals": "^2.1.4"
  },
  "devDependencies": {
    "@types/node": "^25.2.0",
    "@vitejs/plugin-react": "^5.1.2",
    "vite": "^7.3.1",
    "vite-tsconfig-paths": "^6.0.5"
  }
}
```

### Backend Dependencies

```json
{
  "dependencies": {
    "@kubernetes/client-node": "^1.0.1",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "socket.io": "^4.8.3"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.7",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone https://github.com/mtayabnoor/lumiov.git
cd lumiov

# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install
```

### Development

```bash
# Run all components concurrently
npm run dev

# Or run individually:
npm run dev:frontend   # Vite dev server (port 3000)
npm run dev:backend    # Express server (port 5000)
npm run dev:electron   # Electron app
```

### Building

```bash
# Build all components
npm run build

# Package Electron app
npm run package

# Clean build artifacts
npm run clean
```

### Versioning

```bash
# Preview next version
npm run release:dry-run

# Create new version (automated in CI/CD)
npm run release
```

### Testing

```bash
# Frontend tests
cd frontend && npm test

# Type checking
cd backend && npm run type-check
```

---

## Browser Support

**Target Browsers (via browserslist):**

**Production:**

- Modern browsers with >0.2% market share
- Excludes dead browsers
- Excludes Opera Mini

**Development:**

- Latest Chrome
- Latest Firefox
- Latest Safari

---

## Security Considerations

### Frontend Security

- No sensitive data in client
- CORS handled by backend
- WebSocket origin validation

### Backend Security

- Localhost-only binding (127.0.0.1)
- No exposed external endpoints
- Kubernetes credentials from kubeconfig
- Environment variable validation

### Electron Security

- Context isolation enabled
- Sandbox mode enabled
- No nodeIntegration in renderer
- CSP (Content Security Policy) recommended
- Code signing for Windows (lumiov_dev.pfx)

### CI/CD Security

- npm audit on every build
- CodeQL weekly scans
- Dependabot security alerts
- High/critical vulnerabilities block builds

---

## Performance Optimizations

### Frontend

- Vite for fast HMR (Hot Module Replacement)
- Code splitting (React.lazy)
- Tree shaking in production
- Minification and compression

### Backend

- Efficient Kubernetes Watch API
- Resource streaming vs polling
- Connection pooling

### Electron

- Lazy window creation
- Process separation
- Optimized preload script

---

## Monitoring & Observability

### Performance Metrics

- Web Vitals (LCP, FID, CLS, TTFB)
- React strict mode warnings
- Build time tracking

### Error Tracking

- Error boundaries in React
- Backend error middleware
- Electron crash reporting

---

## Future Considerations

### Potential Enhancements

- End-to-end testing (Playwright/Cypress)
- Unit test coverage reporting
- Performance profiling
- Logging framework (Winston/Pino)
- State management (Redux/Zustand)
- API documentation (Swagger)
- Multi-cluster support
- RBAC (Role-Based Access Control)

---

## Useful Links

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [Material-UI Documentation](https://mui.com/)
- [Socket.IO Documentation](https://socket.io/)
- [Kubernetes Client Node](https://github.com/kubernetes-client/javascript)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

---

## Contributing

See [CONTRIBUTING.md](file:///T:/Projects/lumiov/CONTRIBUTING.md) for development guidelines and commit message standards.

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-01  
**Maintained By**: Lumiov Development Team
