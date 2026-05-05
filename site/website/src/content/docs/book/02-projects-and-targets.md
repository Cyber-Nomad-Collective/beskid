---
title: "02. Projects and Targets"
description: Build your first mental model of `Project.proj`, targets, dependencies, and lock behavior.
---

Every Beskid project is rooted at a `Project.proj` file.

## By the end of this chapter

- Understand the role of `project`, `target`, and `dependency` blocks.
- Predict the resolver/build order for a project.
- Know when and why `Project.lock` changes.

## Project essentials

- `project { ... }` defines identity and source root.
- `target "<name>" { ... }` defines buildable entries.
- `dependency "<name>" { ... }` defines graph edges.

In manifests, enum-like fields such as **`kind`** and **`source`** are usually written without quotes (for example `kind = App`, `source = path`); quoted forms remain valid.

The default source root is `Src` when `project.root` is not set.
`project.root_namespace` is optional metadata for package namespace conventions and does not alter file-to-module mapping.

## Minimal project shape

```text
MyProject/
├── Project.proj
├── Src/
│   └── main.bd
├── obj/
│   └── beskid/
└── Project.lock
```

## Build lifecycle

Resolution and build flows follow a deterministic order:

1. Discover the manifest.
2. Resolve dependency DAG.
3. Sync `Project.lock`.
4. Materialize dependencies under `obj/beskid`.
5. Build dependencies before dependents.

## Deep dive in spec and guides

- [Beskid Projects guide](/guides/projects/)
- [Project Resolution](/guides/projects/resolution/)
- [Build Workflow](/guides/projects/build-workflow/)
- [Lockfile](/guides/projects/lockfile/)
- [Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)
- [Workspace and lock contracts](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/)

## Next

Continue with [03. Modules and Files](/book/03-modules-and-files/).
