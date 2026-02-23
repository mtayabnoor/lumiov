# GEMINI.md - Foundational Coding Guidelines

## 1. Code Consistency

- Maintain strict consistency between Frontend and Backend error models.
- All errors must be strongly typed and predictably structured.

## 2. Robustness and Crash Prevention

- Handle all edge cases gracefully, particularly surrounding external dependencies (e.g., Kubernetes, filesystem).
- The application (Node/Electron) must never crash due to network or configuration issues.
- Implement reasonable retry logic (exponential backoff) for recoverable errors.

## 3. Pre-Launch Checks

- Systems must verify the availability of required resources (config files, clusters, ports) before initializing primary user interfaces.
- The UI must inform the user blockingly if mandatory checks fail, offering actionable steps (e.g., start cluster, configure path).

## 4. Workspaces

- All task-specific scratchpads, notes, and local workspace items should be placed in the `.agent` directory.
- Leave primary source directories strictly for production code.

## 5. Implementation Style

- Priority: Efficient, straightforward, and highly structured code. Let the architecture reflect the domain clearly.
- Separation of Concerns: Keep API logic, Business Logic, and UI rendering cleanly separated.
