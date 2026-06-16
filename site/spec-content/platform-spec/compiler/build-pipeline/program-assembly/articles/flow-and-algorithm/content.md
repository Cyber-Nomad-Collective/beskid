---
title: Program assembly - Flow and algorithm
description: Ordered assembly after workspace materialize and before multi-unit
  parse and HIR resolution.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

1. Build `EffectiveCompilationRoots` from `CompilePlan` + optional `PreparedProjectWorkspace` (or lockfile replay for LSP).
2. Emit pipeline phase **`program.assemble`** (after `workspace.materialize` when present).
3. Discover source paths per `AssemblyOptions.discovery`.
4. Parse each unit; build **`ModuleIndex`** by collection-only resolver passes on non-entry units.
5. Hand entry `SourceUnit` and `ModuleIndex` to the shared front-end spine (mod host → semantic → HIR resolve/type on entry with prefetch index).
6. Lower to `CodegenArtifact` for JIT/AOT consumers.

Workspace resolution step 1 output **must** feed stage-ordering step 6 (HIR/resolution) through `ModuleIndex`, not only semantic rules on the entry file.
