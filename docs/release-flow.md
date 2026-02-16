# Release Flow

## Branching Model

```
feature/*  ──PR──▶  development  ──PR──▶  release/vX.Y.Z  ──PR──▶  main
                         ▲                    │ (RC tags)              │
                         └──── back-merge PR ◀┘                       │
                         └──── back-merge PR ◀────────────────────────┘
```

| Branch           | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `feature/*`      | Individual changes, PRs target `development`         |
| `development`    | Integration branch, CI runs on every PR              |
| `release/vX.Y.Z` | Release candidate testing, auto-tagged `vX.Y.Z-rc.N` |
| `main`           | Stable releases only, auto-tagged `vX.Y.Z`           |

---

## Step-by-Step

### 1. Feature Development

```bash
git checkout -b feature/my-feature
git commit -m "feat: Add something"
git push origin feature/my-feature
# Open PR → development
```

**CI runs automatically.** Merge when all checks pass.

### 2. Cut a Release

```bash
git checkout development && git pull
git checkout -b release/v1.2.0
git push origin release/v1.2.0
```

**🤖 Automation:** Creates tag `v1.2.0-rc.1` + GitHub Pre-Release + Electron build.

### 3. Fix During RC (if needed)

```bash
git checkout release/v1.2.0
git commit -m "fix: Patch something"
git push
```

**🤖 Automation:** Creates `v1.2.0-rc.2`, `rc.3`, etc. automatically.

### 4. Stable Release

Open a PR on GitHub: `release/v1.2.0` → `main`, then merge.

**🤖 Automation:**

- Creates tag `v1.2.0` + GitHub Release
- Generates changelog
- Builds and publishes signed Electron installer
- Creates a back-merge PR (`main` → `development`)

### 5. Back-merge

Review and merge the auto-created PR to keep `development` in sync.

---

## What's Manual vs Automatic

| Step         | You                                 | Automation                     |
| ------------ | ----------------------------------- | ------------------------------ |
| Feature work | Branch, commit, PR to `development` | CI checks                      |
| Cut release  | Create `release/vX.Y.Z` branch      | —                              |
| RC tags      | —                                   | `vX.Y.Z-rc.N` + pre-release    |
| RC fixes     | Push to `release/*`                 | Increments RC number           |
| Go stable    | Merge release branch → `main`       | `vX.Y.Z` tag + release + build |
| Back-merge   | Review and merge the PR             | Creates the PR                 |

> **You never manually create tags.** Push to `release/*` → RC tags. Merge to `main` → stable tag.

---

## Tagging Summary

| Tag format    | When created   | Trigger                          |
| ------------- | -------------- | -------------------------------- |
| `v1.2.0-rc.1` | Pre-release    | Push to `release/v1.2.0`         |
| `v1.2.0-rc.2` | Pre-release    | Another push to `release/v1.2.0` |
| `v1.2.0`      | Stable release | Merge `release/v1.2.0` → `main`  |
