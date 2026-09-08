---
title: "Build and run workflow"
description: Current project resolution, lock, materialization, and command stages.
---


This reference describes the shared project workflow used by `run`, `clif`, `analyze`, `build`, and `test`. Use [Dependencies and locks](/docs/projects/dependencies-and-locks/) for an executable procedure.

## Scope

- Single project root (`App.bproj`) plus transitive dependencies.
- Path and registry dependencies.
- Git dependencies are parsed but are not materialized in the current workflow.

## Required lifecycle

1. Discover project manifest.
2. Resolve dependency DAG.
3. Validate provider scope.
4. Sync `Project.lock`.
5. Materialize dependency sources under `obj/beskid`.
6. Project compile-unit projection in deterministic dependency-first order.
7. Command execution (`run`, `clif`, `analyze`).

Commands must not skip stages.

## Directory layout

- `obj/beskid/deps/src/` - materialized dependency source trees.
- `obj/beskid/build/` - build outputs by profile and target.
- `obj/beskid/state/` - resolver/materialization metadata.

## Materialization policy

- Copy dependency files from source roots into `obj/beskid/deps/src/<PackageId>/`.
- Copy local source when it is newer than the materialized file.
- Download an active registry artifact and extract it under the dependency materialization root.
- Compilation consumes materialized roots, not raw dependency paths.

## Determinism rules

- Dependency order is deterministic and dependency-first.
- Tie-break on same rank: canonical manifest path lexical order.
- Package identity is canonicalized by manifest path and dependency source identity.

## Failure policy

- Build and run fail fast on unresolved dependencies.
- Git sources fail at resolution stage.
- A missing or invalid registry result prevents a usable dependency from entering the prepared workspace.
- Lock or materialization errors fail before compile.

## Diagnostics contract

Project workflow diagnostics use shared analysis diagnostics infrastructure and stable error codes.

### Error codes

- `E3001`: missing `App.bproj` at '{path}'
- `E3006`: dependency '{dependency}' manifest not found at {path}
- `E3007`: dependency cycle detected: {chain}
- `E3008`: unresolved external dependencies: {details}
- `E3011`: unsupported dependency source '{source}'
- `E3022`: lockfile is out of date for project '{project}'
- `E3023`: lockfile update forbidden in frozen mode
- `E3031`: failed to copy dependency source '{from}' -> '{to}': {source}
- `E3033`: build cannot start because dependencies were not materialized

## CLI lock behavior

- Default mode creates or updates `Project.lock` when the resolved entries change.
- `--frozen` forbids lockfile updates.
- `--locked` requires an existing lockfile and forbids changes.

## Interop alignment

Interop migration must use the same lifecycle. `Std` is resolved as a regular dependency and loaded from materialized source roots.
