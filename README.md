# Lumiov - Kubernetes Manager

A production-grade Kubernetes management desktop application built with Electron, React, and Node.js.

## Features

- 🚀 Real-time Kubernetes resource monitoring
- 🔄 WebSocket-based live updates
- 🖥️ Native desktop application (Electron)
- 🎨 Modern Material-UI interface
- 🔐 Secure localhost-only backend

## Installation

Download the latest release from the [Releases](https://github.com/muno1623/lumiov-releases/releases) page.

## Development

### Prerequisites

- Node.js 20 or higher
- npm
- A Kubernetes cluster (for testing)
- Git

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/muno1623/lumiov.git
   cd lumiov
   ```

2. Install dependencies:

   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. Run the development environment:
   ```bash
   npm run dev
   ```

This will start:

- Frontend on `http://localhost:3000`
- Backend on `http://localhost:5000`
- Electron wrapper

### Building

Build all components:

```bash
npm run build
```

Package the Electron app:

```bash
npm run package
```

## Versioning

This project uses [Semantic Versioning](https://semver.org/) with automated version management.

### Current Version

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

### Version Bumping

Versions are automatically bumped based on commit messages when merging to `master`:

- `feat:` commits → **MINOR** version bump (e.g., 1.0.0 → 1.1.0)
- `fix:` commits → **PATCH** version bump (e.g., 1.0.0 → 1.0.1)
- `feat!:` or `fix!:` (breaking changes) → **MAJOR** version bump (e.g., 1.0.0 → 2.0.0)

Manual version bumping (for testing):

```bash
# Preview next version without committing
npm run release:dry-run

# Bump version and update changelog
npm run release
```

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](./CONTRIBUTING.md) before submitting a pull request.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes following our commit message format
4. Commit: `git commit -m "feat: Add my awesome feature"`
5. Push: `git push origin feat/my-feature`
6. Create a Pull Request

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

Examples:
feat: Add namespace selector
fix: Resolve WebSocket connection timeout
docs: Update API documentation
chore: Update dependencies
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## CI/CD Pipeline

### Pull Request Checks

Every PR is automatically validated:

- ✅ **Type Checking**: TypeScript compilation
- ✅ **Security Scanning**: Dependency vulnerability checks
- ✅ **Build Validation**: Successful builds for all components
- ✅ **Code Quality**: Linting and formatting

### Release Process

When a PR is merged to `master`:

1. 🔍 Security audit runs
2. 🏗️ All components are built
3. 📝 Version is automatically bumped based on commits
4. 📋 Changelog is generated
5. 🏷️ Git tag is created
6. 📦 Electron app is packaged and published
7. 🎉 GitHub release is created

## Security

- Automated dependency updates via Dependabot
- Weekly CodeQL security scans
- Vulnerability scanning on every PR
- High/critical vulnerabilities block builds

Report security issues to [security contact].

## Project Structure

```
lumiov/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   └── services/
│   └── package.json
├── backend/           # Express backend
│   ├── src/
│   │   ├── handlers/
│   │   └── services/
│   └── package.json
├── electron/          # Electron main process
├── .github/           # CI/CD workflows
│   ├── workflows/
│   │   ├── pr-checks.yml
│   │   ├── build.yml
│   │   └── codeql.yml
│   └── dependabot.yml
├── CHANGELOG.md       # Version history
├── CONTRIBUTING.md    # Contribution guidelines
└── package.json       # Root configuration
```

## License

[Your License Here]

## Support

- 📖 [Documentation](https://github.com/muno1623/lumiov/wiki)
- 🐛 [Issue Tracker](https://github.com/muno1623/lumiov/issues)
- 💬 [Discussions](https://github.com/muno1623/lumiov/discussions)

---

Made with ❤️ by the Lumiov team
