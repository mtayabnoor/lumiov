# Release Flow

## Branching Model

```
feature/*  ──PR──▶  development  ──PR──▶  main
                    (RC tags)             (stable tags)
                         ▲                    │
                         └──── auto back-merge┘
```

| Branch        | Purpose                                                         |
| ------------- | --------------------------------------------------------------- |
| `feature/*`   | Individual changes, PRs target `development`                    |
| `development` | Integration branch; every relevant push auto-tags `vX.Y.Z-rc.N` |
| `main`        | Stable releases only; every merge auto-tags `vX.Y.Z`            |

> There are no `release/vX.Y.Z` branches. RC candidates come straight from `development`.

---

## Step-by-Step

### 1. Feature Development

```bash
git checkout -b feature/my-feature
git commit -m "feat: Add something"
git push origin feature/my-feature
# Open PR → development
```

**CI runs automatically on every PR.** Merge when all checks pass.

### 2. RC Tags (automatic)

Once a PR is merged into `development`, semantic-release runs automatically.
If the commits contain `feat`, `fix`, or `perf` changes a new RC tag is created:

- First merge with relevant commits → `v1.2.0-rc.1`
- Next merge with relevant commits → `v1.2.0-rc.2`, etc.

No manual steps needed. A GitHub Pre-Release and Electron build are published automatically.

### 3. Stable Release

Open a PR on GitHub: `development` → `main`, then merge.

**🤖 Automation:**

- Creates tag `v1.2.0` + GitHub Release
- Generates changelog
- Builds and publishes signed Electron installer
- Directly merges `main` back into `development` (no PR needed)

---

## What's Manual vs Automatic

| Step         | You                                 | Automation                               |
| ------------ | ----------------------------------- | ---------------------------------------- |
| Feature work | Branch, commit, PR to `development` | CI checks                                |
| RC tags      | —                                   | `vX.Y.Z-rc.N` + pre-release on each push |
| Go stable    | Merge `development` → `main`        | `vX.Y.Z` tag + release + Electron build  |
| Back-merge   | —                                   | Direct push `main` → `development`       |

> **You never manually create tags.** Merge to `development` → RC tag. Merge to `main` → stable tag.

---

## Tagging Summary

| Tag format    | When created   | Trigger                                |
| ------------- | -------------- | -------------------------------------- |
| `v1.2.0-rc.1` | Pre-release    | Push relevant commits to `development` |
| `v1.2.0-rc.2` | Pre-release    | Another push with relevant commits     |
| `v1.2.0`      | Stable release | Merge `development` → `main`           |
