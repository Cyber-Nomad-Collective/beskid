---
title: "Workspace manifest"
description: ".bws structure—identity, members, overrides, registries."
tableOfContents: true
---

**`.bws`** workspace manifests coordinate multi-project repos. They do not replace per-member **`.bproj`** files—they declare members and shared resolver policy.

Legacy **`Workspace.proj`** is rejected (**E1895**); rename to a `.bws` file (for example `CoreLib.bws`).

## Building blocks

- **`workspace { ... }`** — workspace identity and resolver policy; extras such as **`defaultTestMember`** select the member when you pass the workspace path without `--workspace-member`
- **`member "<label>" { path = "..." }`** — adds a project at `path`; optional extras (`package`, `description`, `category`, `tags`) are publish/editor metadata merged from the workspace manifest
- **`override "<dep>" { version = "..." }`** — shared version policy (forward-looking as registry deps mature)
- **`registry "<name>" { url = "..." }`** — centralized registry endpoints

## Why bother

| Without workspace | With workspace |
| --- | --- |
| Each project owns conflicting dep policy | Shared overrides |
| CI scripts special-case every folder | One lock/resolution story |
| "Which `.bproj`?" roulette | Explicit members |

## Minimal mental picture

```mermaid
flowchart TD
  W[CoreLib.bws] --> M1[member app]
  W --> M2[member lib]
  M1 --> P1[app.bproj]
  M2 --> P2[lib.bproj]
```

## Guides and spec

- [Workspace monorepo setup](/book/reference/workspace-monorepo/)
- [Workspace and lock contracts](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/)

## Next

[Member projects](/book/06-monorepo-as-coping-mechanism/member-projects/)
