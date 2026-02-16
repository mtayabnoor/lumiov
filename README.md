# Lumiov - AI Powered Kubernetes Manager

![Demo](https://raw.githubusercontent.com/mtayabnoor/lumiov/media/demo-lumiov-3.gif)

![Demo](https://raw.githubusercontent.com/mtayabnoor/lumiov/media/demo-lumiov-2.gif)

> [!WARNING]
> **Beta Release**: This project is currently in active development. Features may change, and it may contain bugs. Please exercise caution when using it in production environments.

A production-grade, AI-enhanced Kubernetes management desktop application built with Electron, React, and Node.js.

## 🚀 Features

### Core Kubernetes Management

- **Workloads**: Manage Pods, Deployments, StatefulSets, DaemonSets, Jobs, CronJobs, ReplicaSets.
- **Network**: Services, Ingresses, Endpoints, Network Policies.
- **Storage**: Persistent Volumes (PV), Persistent Volume Claims (PVC), Storage Classes.
- **Configuration**: ConfigMaps, Secrets, Service Accounts.
- **Access Control**: Roles, ClusterRoles, RoleBindings, ClusterRoleBindings.
- **Cluster**: Nodes, Namespaces, Limit Ranges, Resource Quotas, Horizontal Pod Autoscalers (HPA).
- **Custom Resources**: Full support for Custom Resource Definitions (CRDs).

### 🧠 AI-Powered Diagnosis

- **Smart Analysis**: Integrated AI (OpenAI via LangChain) to diagnose pod failures and error logs.
- **Actionable Insights**: Get plain-English explanations and suggested fixes for complex Kubernetes errors.

### 🛠️ Advanced Tooling

- **Real-time Updates**: WebSocket-based live synchronization of cluster state.
- **Terminal Access**: Integrated terminal for executing commands directly into pods.
- **Log Viewer**: Live log streaming with filtering and search.
- **Modern UI**: Polished interface built with Material UI v7 and React 19.
- **Secure Architecture**: Localhost-only backend ensures your cluster credentials remain secure on your machine.

## 💻 Tech Stack

- **Desktop Runtime**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Material UI v7](https://mui.com/), [Recharts](https://recharts.org/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [Socket.IO](https://socket.io/)
- **AI & Logic**: [LangChain](https://js.langchain.com/), [Kubernetes Client Node](https://github.com/kubernetes-client/javascript)
- **Languages**: TypeScript (Strict mode)

## 📦 Installation

Download the latest installer for your platform from the [Releases](https://github.com/mtayabnoor/lumiov/releases) page.

- **Windows**: `.exe` (NSIS installer)
- **macOS**: `.dmg` (Universal)
- **Linux**: `.AppImage`

## 🛠️ Development

### Prerequisites

- Node.js 20+ (v22 recommended)
- npm or pnpm
- A running Kubernetes cluster (Minikube, Kind, or remote) configured in `~/.kube/config`

### Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/mtayabnoor/lumiov.git
   cd lumiov
   ```

2. **Install dependencies**:

   ```bash
   npm run install:all
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   This command concurrently starts:
   - Frontend (Vite) on `http://localhost:5173`
   - Backend (Express) on `http://localhost:3030`
   - Electron Main Process

### Building

To build the application for production:

```bash
# Build all components (Frontend, Backend, Electron)
npm run build

# Package for your current OS
npm run package
```

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to get started, our commit message conventions, and the pull request process.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

Made with ❤️ by [mtayabnoor](https://github.com/mtayabnoor)
