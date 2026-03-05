---
title: "Beskid Projects (HCL-based)"
---


Beskid projects are defined by a declarative root manifest and a deterministic dependency graph.

This document describes the project contract used by CLI, analysis, and LSP tooling.

## Canonical project manifest

- File name: `Project.proj`
- Location: project root directory
- Format: HCL-based declarative manifest

`Project.proj` is the source of truth for:

- project identity,
- targets,
- dependencies,
- source roots and build-relevant metadata.

## Canonical project layout

Minimum expected layout:

```text
MyProject/
├── Project.proj
├── src/
│   └── main.bd   # or library entry source
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

Dependency sources in contract:

- `path` (active)
- `git` and `registry` (reserved schema extension points)

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

- `./manifest.md` — manifest schema
- `./examples.md` — sample manifests
- `./resolution.md` — graph and resolution rules
- `./build-workflow.md` — resolve/materialize/build lifecycle
- `./lockfile.md` — lockfile behavior
