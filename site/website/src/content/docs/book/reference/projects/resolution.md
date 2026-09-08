---
title: "Project resolution"
description: BSOL project discovery, dependency graphs, materialization, and lock behavior.
---


This document defines how module paths are resolved, how the project graph is built from `App.bproj`, and how imports are validated.

It also defines the build/run dependency lifecycle used by CLI commands:

1. Discover manifest.
2. Resolve project DAG.
3. Sync `Project.lock`.
4. Materialize dependency sources under `obj/beskid`.
5. Build in dependency-first order.
6. Run selected target.

Graph implementation: `daggy` (`Dag<ProjectNode, DependencyEdge>`), with `petgraph` traversal utilities available through Daggy re-exports when needed.

## Terminology
- **Project root**: directory containing `App.bproj`.
- **Source root**: `project.root` field inside `App.bproj` (default `Src`).
- **Module path**: dotted path like `Net.Http`.

## Project Graph Construction
1. Start at the root project `App.bproj`.
2. Parse manifest to collect project identity, targets, and dependencies.
3. Canonicalize manifest path and intern a node key for the root project.
4. For each dependency, create an edge from consumer project -> dependency project.
5. For `source = "path"`, resolve and recursively load dependency manifests.
6. Preserve registry dependencies for artifact materialization. Reject unresolved Git dependencies before compilation.
7. Reject cycles at edge insertion time and report chain.

## Provider scope

- Path dependencies resolve local project manifests.
- Registry dependencies select and extract an active package version during workspace preparation.
- Git dependencies are not materialized by the current workflow.
- Build and run do not proceed with an unresolved Git dependency.

## Daggy Node and Edge Model
- **ProjectNode**
  - Root project node
  - Resolved local path dependency node
  - Unresolved git dependency node
  - Unresolved registry dependency node
- **DependencyEdge**
  - dependency alias (`dependency "Name"` label)
  - source kind (`path` / `git` / `registry`)
  - raw source metadata for diagnostics

The graph keeps project identity canonicalized by manifest path to prevent duplicated nodes for equivalent relative paths.

## Deterministic Build Projection
- Derive compile order from the project DAG in deterministic topological order.
- Dependencies are emitted before dependents.
- Stable tie-break for same-rank nodes: canonical manifest path lexical order.
- The projected ordered compile units are consumed by CLI and analysis pipelines.

## Unresolved Dependency Policy (v1)
- `path`: must resolve to an existing `App.bproj`; otherwise error.
- `registry`: download an active version and require a `.bproj` manifest in the artifact.
- `git`: fail before compile because the current workflow does not materialize it.
- Build/run does not continue past resolution stage when any dependency is unresolved.

## Materialization and Build Staging

Before build or run:

1. Resolve all path dependencies transitively.
2. Copy path dependencies or extract registry artifacts into `obj/beskid/deps/src/<materialized-id>`.
3. For path dependencies, copy when the source file timestamp is newer than the materialized file.
4. Use materialized source roots for compile units.

Build outputs and state directories:

- `obj/beskid/deps/src/` - materialized dependency sources.
- `obj/beskid/build/` - compilation outputs by profile/target.
- `obj/beskid/state/` - resolver and lock sync metadata.

## Lockfile Lifecycle

- Lockfile path: `Project.lock` at project root.
- Lockfile is created automatically when missing during resolve/build/run.
- Lockfile is updated automatically when dependency graph changes.
- `--frozen` forbids lock updates. `--locked` requires an existing lock and forbids updates.

## File-to-Module Mapping
- File `Src/Net/Http.bd` maps to module path `Net.Http`.
- The file path relative to `root` determines the module path.
- The last segment is the module name (file stem).
- If the file starts with file-scoped `mod A.B;`, that declared path overrides path-derived mapping for that file.

## Resolution Order (name lookup)
For identifiers and paths inside a module:
1. Local scope (params, let bindings).
2. Enclosing scopes.
3. Imports (`use` aliases).
4. Module-level items.

This order is consistent with `/docs/standard/language-meta/program-structure/name-resolution/`.

## Module Graph (Inferred)
The module graph is inferred from `mod` declarations and file layout. The manifest does not list modules explicitly.

## `mod` Declarations
- Optional file-scoped form: `mod Net.Http;` as the first top-level item declares the file-scoped module identity.
- In file-scoped mode, any additional `mod` declarations in the same file are errors.
- Without file-scoped mode, regular `mod` declarations participate in module graph inference as before.

## `use` Imports
- `use Net.Http.Client;` resolves against the module graph.
- If multiple imports provide the same name without aliasing, emit `AmbiguousImport`.

## Visibility
- Items are private by default.
- `pub` items are visible across modules.
- Access to non-`pub` symbols from another module is an error.

## Error Conditions
- Missing `App.bproj`.
- Duplicate project names in dependency graph.
- Project cycles.
- Missing path dependency manifest.
- Unsupported Git dependency in the active graph.
- Lockfile read/parse/update mismatch errors.
- Materialization copy failures.
- Import path not found.
- Visibility violations.
- Ambiguous imports.

## Manifest-specific error conditions
- Unknown `source` kind in `dependency` block.
- Missing `entry` in `target` block.
- Target entry path outside source root.
- Duplicate target names.

## Future Extensions
- Virtual modules for generated code.
- Extended workspace policy for large monorepos.

## Corelib (`Std`) graph behavior
- `Std` is treated as a normal dependency node in the project DAG.
- If a resolvable `Std` dependency node exists, corelib prelude fallback injection must be disabled.
- Feature-gated fallback remains only as a compatibility path when no resolvable `Std` node is present.
