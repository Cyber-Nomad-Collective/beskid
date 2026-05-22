---
title: "Tree and resolution"
description: Dependency DAG, build order, and debugging resolution without guessing."
tableOfContents: true
---

Resolution is not magic—it is a **DAG walk** with a lockfile receipt.

## Build lifecycle (deterministic sketch)

1. Discover manifest (`Project.proj` or workspace member).
2. Resolve dependency DAG.
3. Sync `Project.lock`.
4. Materialize dependencies under `obj/beskid`.
5. Build dependencies before dependents.

```mermaid
flowchart TD
  D1[Dep A Lib] --> D2[Dep B Lib]
  D2 --> APP[App target]
```

## Inspecting structure

- `beskid tree` on a `.bd` file shows AST shape (parser-level).
- Project graphs: use reference [resolution](/book/reference/projects/resolution/) and CLI project introspection flags documented on [tree command](/book/reference/cli/commands/tree/) where applicable to manifests.

When resolution fails, read the diagnostic **first**—path dependencies love typos (`../Wrong`).

## Workspace members

Multi-project repos resolve members via `Workspace.proj` (chapter [06](/book/06-monorepo-as-coping-mechanism/)). Single-project repos stay ignorant and happy.

## Failure modes

| Symptom | Likely cause |
| --- | --- |
| Disabled provider in graph | `git`/`registry` dep while only `path` enabled |
| Missing entry | `target.entry` not under `project.root` |
| Cycle | Circular path dependencies between projects |
| Stale lock | Changed manifest without `lock`/`fetch` |

## Deep dive

- [Project Resolution](/book/reference/projects/resolution/)
- [Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)

## Next chapter

[04. Where does this file even go?](/book/04-where-does-this-file-go/)
