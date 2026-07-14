---
title: "Fetch, lock, update"
description: Dependency resolution, Project.lock, frozen builds, and staying reproducible."
tableOfContents: true
---

Manifests declare intent. **Locks** declare what actually happened—so CI and your laptop stop arguing.

## The trio

| Command | Role |
| --- | --- |
| `fetch` | Resolve and materialize dependencies into `obj/beskid` |
| `lock` | Synchronize `Project.lock` with current resolution |
| `update` | Refresh resolution and materialized tree when policy allows |

Reference: [fetch](/book/reference/cli/commands/fetch/), [lock](/book/reference/cli/commands/lock/), [update](/book/reference/cli/commands/update/), [lockfile guide](/book/reference/projects/lockfile/).

## Frozen / locked builds

CI should prefer **reproducible** resolution:

- `--frozen` — fail if lock would change
- `--locked` — enforce lock consistency (see per-command docs for exact semantics)

```mermaid
flowchart LR
  M[Project.proj] --> R[Resolver]
  R --> L[Project.lock]
  R --> O[obj/beskid materialized]
  L --> CI[CI with --frozen]
```

## When the lock changes

Expect `Project.lock` updates when:

- You add/remove/retarget dependencies
- Path dependencies move on disk (sometimes)
- Resolver policy or toolchain version changes resolution

Do **not** `.gitignore` the lock because "it is generated" unless you enjoy production roulette.

## Path-only era (v1)

With `source = path` as the enabled provider, "version drift" is often literally **different folders on disk**. Workspaces add shared override policy—chapter [06](/book/06-monorepo-as-coping-mechanism/).

## Standard reference (informative)

- [Workspace and lock contracts](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/)

## Next

[Tree and resolution](/book/03-project-proj-or-it-didnt-happen/tree-and-resolution/)
