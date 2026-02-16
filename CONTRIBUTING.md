# Contributing to Lumiov

First off, thank you for considering contributing to Lumiov! It's people like you that make Lumiov such a great tool.

## 🤝 Code of Conduct

This project and everyone participating in it is governed by the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/). By participating, you are expected to uphold this code. Please report unacceptable behavior to [project_maintainer_email].

## 🚀 Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/lumiov.git
    cd lumiov
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    # This automatically installs dependencies for root, frontend, backend, and electron via 'postinstall' or 'install:all' scripts if configured,
    # but to be safe, run:
    npm run install:all
    ```
4.  **Create a branch** for your feature or fix:
    ```bash
    git checkout -b feat/amazing-feature
    ```

## 🛠️ Development Workflow

### Project Structure

- `electron/`: The Electron main process and native wrappers.
- `frontend/`: React 19 application (Vite + MUI v7).
- `backend/`: Express.js server interacting with Kubernetes logic.

### Running Locally

To start all services (Frontend, Backend, Electron) in development mode:

```bash
npm run dev
```

### Linting & Formatting

Ensure your code follows the project's style guidelines:

```bash
npm run lint
```

We use ESLint and Prettier.

## 📝 Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This is **enforced** by `commitlint` and `husky`.

**Format**: `<type>(<scope>): <subject>`

**Types**:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

**Examples**:

- `feat(pods): add search functionality to pod list`
- `fix(auth): resolve token expiration issue`
- `docs: update readme with new installation steps`

## Pull Requests

1.  **Fill out the PR Template**: Describe your changes, link related issues, and provide screenshots if applicable.
2.  **Pass CI Checks**: Your PR must pass all CI checks (linting, build, tests).
3.  **Code Review**: Address any feedback from maintainers.

## 🐞 Reporting Bugs

Bugs are tracked as [GitHub Issues](https://github.com/mtayabnoor/lumiov/issues).
When creating an issue, please provide:

- A clear description of the issue.
- Steps to reproduce.
- Expected vs. actual behavior.
- Screenshots or logs if possible.
