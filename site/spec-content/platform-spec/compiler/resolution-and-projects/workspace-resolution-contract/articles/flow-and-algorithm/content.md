---
title: Workspace resolution contract - Flow and algorithm
description: End-to-end algorithm from manifest discovery to resolved compile input.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Resolution pipeline

```mermaid
flowchart TD
  root[Discover project root]
  manifest[Load Project.proj]
  graph[Build dependency graph]
  policy[Apply cycle / missing dep policy]
  plan[Create CompilePlan]
  lock[Optional lockfile sync]
  entry[Source root + entry path]
  mods[Mod host event setup]
  root --> manifest --> graph --> policy --> plan
  plan --> lock --> entry
  plan --> mods
```

## Steps

1. Resolve project root and load `Project.proj` manifest.
2. Build dependency graph with policy (`error`, `warn`, or permissive) for unresolved dependencies.
3. Classify each node’s **project type** (including **`Mod`**) and retain manifest fragments needed for mod host registration.
4. Select compilation target and create `CompilePlan`.
5. Optionally materialize workspace and lockfile synchronization.
6. Return final source root and entry path for parsing/lowering.
7. If the workspace includes **`Mod`** projects, pass the resolved graph slice to the **mod host** for **event subscription** setup (see **[Compiler Mods](/platform-spec/compiler/compiler-mods/)**).

Implementations should use `build_compile_plan_with_policy` and `prepare_project_workspace_with_options` to keep command behavior aligned.
