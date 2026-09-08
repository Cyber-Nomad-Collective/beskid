---
title: Beskid projects
description: Current BSOL project manifests, targets, dependencies, and resolution references.
---


Beskid projects use a declarative BSOL root manifest and a deterministic dependency graph.

This document describes the project contract used by CLI, analysis, and LSP tooling. For executable tasks and recovery, use the canonical [Projects guide](/docs/projects/).

## Canonical project manifest

- File name: `App.bproj`
- Location: project root directory
- Format: BSOL declarative manifest

`App.bproj` is the source of truth for:

- project identity,
- targets,
- dependencies,
- source roots and build-relevant metadata.

## Canonical project layout

Minimum expected layout:

```text
MyProject/
├── App.bproj
├── Src/
│   └── Main.bd
├── obj/
│   └── beskid/   # tool-managed materialized artifacts
└── Project.lock  # generated lockfile
```

Notes:

- `obj/beskid/` is tool-managed output and should not be edited manually.
- `Project.lock` is generated and updated by resolve/build flows.

## Project model

- **Project**: one root manifest + one workspace root.
- **Target**: a buildable unit (for example executable or library).
- **Dependency**: a typed edge in the project graph.

Dependency sources in the current contract:

- `path` resolves and materializes a local project.
- `registry` downloads and materializes an active package version.
- `git` is parsed but is not materialized by the current workflow.

## Resolution and determinism contract

- Dependency resolution must produce a deterministic graph.
- Cycles are invalid.
- Build/check/run operations consume the same resolved graph model.
- Compilation order follows topological dependency order.
- Unresolved dependencies fail fast with stable diagnostics.

## Tooling contract

- CLI, analysis, and LSP must share one project-loading and resolution model.
- Manifest validation diagnostics should be stable and actionable.
- Formatter and migration tooling may transform manifest text, but must preserve manifest semantics.

## Related docs

- `./scaffolding.md` — `beskid new`, template sources, corelib on instantiated projects
- `./manifest.md` — manifest schema
- `./examples.md` — sample manifests
- `./resolution.md` — graph and resolution rules
- `./build-workflow.md` — resolve/materialize/build lifecycle
- `./lockfile.md` — lockfile behavior
