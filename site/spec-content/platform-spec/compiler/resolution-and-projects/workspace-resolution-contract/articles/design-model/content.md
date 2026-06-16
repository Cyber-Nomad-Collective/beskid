---
title: Workspace resolution contract - Design model
description: Actors, data model, and boundaries for project/workspace discovery
  in compiler services.
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

The resolution model has four core objects: `CompilePlan` (target + dependency plan), `PreparedProjectWorkspace` (materialized source roots and lockfile state), resolved source input (`source_path`, `source`) used by compile commands, and **`ProgramAssembly`** (multi-module units + `ModuleIndex` built from effective roots — see **[Program assembly](/platform-spec/compiler/build-pipeline/program-assembly/)**).

`beskid_analysis::projects` owns graph building and manifest semantics; CLI commands and LSP integrations consume this model and should not reimplement manifest traversal rules.

## `Mod` projects in the graph

**`Mod` projects** appear as graph nodes with **`type = Mod`**. Resolution **must**:

1. **Include all transitive `Mod` dependencies** of the active host compilation in the resolved dependency graph.
2. **Never treat `Mod` as the default compile target** for `beskid build` / `beskid run`; host builds resolve App/Lib/Test targets while still loading mod artifacts from dependencies.
3. **Expose the same graph slice to LSP and CLI** so mod scheduling decisions match across surfaces.

Scope narrowing for which host compilation units a mod affects is owned by **`Collector`** contracts at execution time, not by manifest attach metadata.

## Mod artifact resolution

When a `Mod` node is discovered:

1. Resolve package source (workspace path or registry materialization).
2. Check artifact hash against cached AOT output.
3. Rebuild when hash changes (eager incremental check) or when `beskid mod rebuild` is invoked.

Errors in mod artifact load/bootstrap use the **E1821–E1835** band (**[Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/)**, **[AOT artifact contract](/platform-spec/compiler/compiler-mods/mod-host-bridge/aot-artifact-contract/)**).
