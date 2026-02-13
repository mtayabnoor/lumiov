# Contributing to Lumiov

First off, thank you for considering contributing to Lumiov! It's people like you that make Lumiov such a great tool.

## Branching Model

We use a structured Git Flow branching model:

```
feature/*  ──PR──▶  development  ──PR──▶  release/vX.Y.Z  ──PR──▶  main
                         ▲                                            │
                         └────────────── back-merge PR ◀──────────────┘
```

| Branch           | Purpose                                                      |
| ---------------- | ------------------------------------------------------------ |
| `main`           | Stable production releases only                              |
| `development`    | Integration branch — all feature PRs target here             |
| `release/vX.Y.Z` | Release candidate branch — cut from `development` when ready |
| `feature/*`      | Short-lived feature branches for individual changes          |

## Development Workflow

### Prerequisites

- Node.js 22 or higher
- npm
- Git
- A Kubernetes cluster (for testing)

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/lumiov.git`
3. Install dependencies: `npm install`
4. Install frontend dependencies: `cd frontend && npm install`
5. Install backend dependencies: `cd ../backend && npm install`
6. Run the development environment: `npm run dev`

## Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. This leads to more readable messages and allows us to generate changelogs automatically.

### Commit Message Format

Each commit message consists of a **header**, a **body** (optional), and a **footer** (optional):

```
<type>(<scope>): <subject>

<body>

<footer>
```

The **header** is mandatory. The **scope** is optional.

### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Examples

```
feat: Add pod restart functionality
fix: Resolve connection timeout issues
docs: Update README with installation instructions
chore: Update dependencies
```

With scope:

```
feat(frontend): Add dark mode theme
fix(backend): Resolve WebSocket reconnection bug
```

With body:

```
feat: Add pod logs viewer

Implemented a real-time log viewer for Kubernetes pods
using WebSocket streaming. Users can now view and filter
pod logs directly from the UI.
```

### Commit Message Validation

We use git hooks to validate commit messages. If your commit message doesn't follow the format, the commit will be rejected with a helpful error message.

**Example of a valid commit:**

```bash
git commit -m "feat: Add namespace selector to UI"
```

**Example of an invalid commit:**

```bash
git commit -m "added new feature"  # ❌ Missing type prefix
```

## Pull Request Process

1. **Create a feature branch**: `git checkout -b feature/amazing-feature`
2. **Make your changes** following the code style guidelines
3. **Commit your changes** using conventional commits
4. **Push to your fork**: `git push origin feature/amazing-feature`
5. **Open a Pull Request** against the `development` branch

### PR Checks

All PRs must pass the following CI checks before merging:

- ✅ **Commit Lint**: Commit messages follow Conventional Commits
- ✅ **Code Linting**: ESLint checks for code quality
- ✅ **Type Checking**: TypeScript compilation without errors
- ✅ **Build Validation**: All components build successfully
- ✅ **Security Scanning**: No high/critical vulnerabilities in dependencies

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backwards compatible manner
- **PATCH** version for backwards compatible bug fixes

Versions are automatically bumped based on commit messages:

- `feat:` commits trigger a **MINOR** version bump
- `fix:` commits trigger a **PATCH** version bump
- `feat!:` or `fix!:` (with breaking changes) trigger a **MAJOR** version bump

### Release Process

Releases follow the release candidate workflow:

1. When `development` is ready for release, a `release/vX.Y.Z` branch is created
2. The RC workflow automatically creates pre-releases (`vX.Y.Z-rc.1`, `rc.2`, etc.)
3. Testers validate the RC build
4. Once approved, the release branch is merged to `main`
5. The release workflow creates the stable release and publishes the Electron app
6. A back-merge PR is automatically created to sync `main` → `development`

## Code Style

- **Frontend**: React with TypeScript, Material-UI components
- **Backend**: Node.js with TypeScript, Express
- **Electron**: TypeScript

### Best Practices

- Write meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Write tests for new features (when test infrastructure is available)
- Update documentation when adding new features

## Project Structure

```
lumiov/
├── frontend/          # React frontend application
├── backend/           # Express backend server
├── electron/          # Electron main process
├── .github/           # GitHub workflows and configurations
└── package.json       # Root package configuration
```

## Getting Help

If you have questions or need help:

- Open an issue with the `question` label
- Check existing issues for similar questions
- Review the project documentation

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Code of Conduct

Be respectful and inclusive. We want this to be a welcoming community for everyone.

---

Thank you for contributing to Lumiov! 🚀
