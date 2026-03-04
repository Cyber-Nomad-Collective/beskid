---
description: Beskid Project Build and Run Workflow
---

# Build and Run Workflow (v1)

This document defines the required project workflow used by `run`, `clif`, and `analyze`.

## Scope

- Single project root (`Project.proj`) plus transitive dependencies.
- Source-only dependencies.
- Active provider: `path`.
- Deferred providers (infrastructure only): `git`, `registry`.

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
- Copy only when source file is newer than materialized file.
- Compilation consumes materialized roots, not raw dependency paths.

## Determinism rules

- Dependency order is deterministic and dependency-first.
- Tie-break on same rank: canonical manifest path lexical order.
- Package identity is canonicalized by manifest path and dependency source identity.

## Failure policy

- Build and run fail fast on unresolved dependencies.
- Provider-disabled sources fail at resolution stage.
- Lock or materialization errors fail before compile.

## Diagnostics contract

Project workflow diagnostics use shared analysis diagnostics infrastructure and stable error codes.

### Error codes

- `E3001`: missing `Project.proj` at '{path}'
- `E3006`: dependency '{dependency}' manifest not found at {path}
- `E3007`: dependency cycle detected: {chain}
- `E3008`: unresolved external dependencies: {details}
- `E3011`: unsupported dependency source '{source}' in v1
- `E3022`: lockfile is out of date for project '{project}'
- `E3023`: lockfile update forbidden in frozen mode
- `E3031`: failed to copy dependency source '{from}' -> '{to}': {source}
- `E3033`: build cannot start because dependencies were not materialized

## CLI behavior recommendations

- Default mode: lock-aware with automatic lock creation/update.
- Future strict flags:
  - `--frozen`: no lock updates.
  - `--locked`: require existing up-to-date lock.

## Interop alignment

Interop migration must use the same lifecycle. `Std` is resolved as a regular dependency and loaded from materialized source roots.
