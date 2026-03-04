# Beskid Projects (HCL-based)

Beskid project definition is moving to **HCL** syntax with a `.proj` file extension.

We are dropping `project.bd` as the project definition mechanism and replacing it with a declarative manifest (`Project.proj`) to keep project loading deterministic, tool-friendly, and IDE-friendly.

## Why HCL

1. Human-readable, concise syntax.
2. Good nested-structure ergonomics for targets and dependencies.
3. Strong Rust ecosystem support.
4. Better fit for static project graph construction than executable build scripts.

## Recommended Rust libraries

### Primary choice: `hcl-rs`
- Crate: `hcl-rs`
- Strengths:
  - serde-based decode into typed Rust structs
  - parse + encode support
  - mature and actively maintained

### Secondary choice: `hcl-edit`
- Crate: `hcl-edit`
- Strengths:
  - preserves comments/formatting for round-trip edits
  - useful for `beskid fmt` / auto-migrations and editor tooling

### Decision

Use a two-layer approach:
1. **Loader/validator**: `hcl-rs` (source of truth)
2. **Formatting / in-place updates**: `hcl-edit` (tooling path)

This keeps the runtime path simple and fast while still enabling high-quality developer tooling.

## Dependency graph library decision

For project dependency resolution, Beskid uses **Daggy** (`daggy`) as the DAG implementation layer.

- Crate: `daggy`
- Why:
  1. DAG-first API with explicit cycle prevention on edge insertion.
  2. Backed by `petgraph` for mature graph operations when needed.
  3. Good fit for typed project-node and dependency-edge modeling.

Planned graph model:
- Node: project manifest identity + resolved source root metadata.
- Edge: dependency relation (`path` / `git` / `registry`) and alias metadata.
- Output: deterministic topological compile order for CLI and analysis pipelines.

## Project file

- File name: `Project.proj`
- Location: project root

See:
- `docs/guides/projects/manifest.md` for schema
- `docs/guides/projects/examples.md` for examples
- `docs/guides/projects/resolution.md` for graph/resolution rules
- `docs/guides/projects/build-workflow.md` for resolve/materialize/build lifecycle
- `docs/guides/projects/lockfile.md` for `Project.lock` behavior

## Finalized v1 scope

1. Dependency resolution is **source-only**.
2. Active provider in v1: `path`.
3. Provider infrastructure is designed to add `git` / `registry` later without changing the pipeline shape.
4. Build/run requires dependency materialization into `obj/beskid` before compilation.
5. `Project.lock` is generated automatically during resolve/build flows.
6. Unresolved external dependencies fail fast by default.

## Phase 2 migration plan (interop + projects)

This plan connects stdlib interop migration with the new HCL project system so `Std` can be built and consumed as a normal Beskid project.

### Stage 2.1: Project model introduction
1. Add `src/beskid_analysis/src/projects` as the canonical project system module with typed manifest model (`ProjectManifest`, `Target`, `Dependency`).
2. Parse `Project.proj` (HCL content) with `hcl-rs` into typed structs.
3. Add validation pass:
   - required fields
   - duplicate target names
   - unknown dependency source types
4. Keep project parsing/loading/resolution logic centralized in `beskid_analysis::projects` and consumed by CLI/LSP/engine pipelines to avoid duplicated implementations.

### Stage 2.2: CLI and workspace integration
1. Update CLI commands (`run`, `check`, `test`) to discover `Project.proj` from cwd upward.
2. Add explicit override flag (example: `--project <path>`).
3. Build dependency DAG from `dependencies` blocks and detect cycles (Daggy).
4. Introduce a shared `CompilePlan` model used by `run`, `clif`, and `check` so source discovery, target selection, and dependency resolution stay consistent.
5. Materialize graph-derived compile units in deterministic topological order under `obj/beskid`.

### Stage 2.3: Standard library as a project
1. Create `Std/Project.proj` with `kind = "Lib"` target.
2. Move std prelude/public wrappers into `Std` project sources.
3. Keep runtime `__interop_dispatch_*` internal to compiler/runtime.
4. Resolve standard-library imports (`IO.*`, `String.*`, etc.) through normal dependency graph rather than hardcoded injected modules.

### Stage 2.4: Interop phase-2 consolidation
1. Keep interop dispatch as an optional runtime ABI capability for language/runtime boundaries.
2. Remove legacy direct std builtin registrations (`sys_print*`, `str_len`) once runtime ABI parity is proven.
3. Route std-facing runtime/system calls through stable runtime ABI entrypoints.
4. Avoid compatibility fallback windows in strict refactor mode; remove fallback injection paths directly.

### Stage 2.5: Tooling and migration UX
1. Add migration command: convert `project.bd` -> `Project.proj` where possible.
2. Add diagnostics with actionable fixes.
3. Add `beskid fmt` support for `.proj` files using `hcl-edit`.

### Stage 2.6: LSP `.proj` implementation (`src/beskid_lsp`)
1. Extend file detection to recognize `*.proj` as HCL-backed project manifests.
2. Add diagnostics pipeline for manifest schema and dependency errors.
3. Add semantic completion for top-level blocks (`project`, `target`, `dependency`) and known keys.
4. Add hover and go-to-definition for dependency `path` targets where applicable.
5. Ensure formatter integration routes `.proj` buffers through `hcl-edit` based formatting.

### Stage 2.7: Hardening and release gates
1. Golden tests for manifest parsing and resolution.
2. End-to-end tests for `Std` as dependency (not injected by default).
3. Lock down naming conventions and public std API contracts.

## Current stage status

- Stage 2.1: **Done** (project manifest model, parser, validator in `beskid_analysis::projects`).
- Stage 2.2: **In progress** (CLI integration done; `obj/beskid` materialization and lockfile lifecycle pending).
- Stage 2.3: **In progress** (`Std` dependency path recognized; full project-based stdlib loading still in progress).
- Stage 2.4: **In progress** (feature-gated fallback present; final fallback removal pending).
- Stage 2.6: **Done (baseline)** (`.proj` detection + diagnostics + basic completion/hover/definition).
- Stage 2.8: **Done** (canonical CLI command name: `beskid`).

### Stage 2.8: Naming and CLI alignment
1. Set the canonical user-facing CLI command name to `beskid` and keep naming consistent across CLI surfaces.
2. Ensure diagnostics and docs consistently reference `Project.proj` and `.bd` sources.

## Success criteria

- `Std` is consumed as a normal dependency project.
- CLI resolves builds from `Project.proj` deterministically.
- CLI resolves dependencies into `obj/beskid` before build/run.
- `Project.lock` is created/updated automatically by resolve flows.
- Interop dispatch remains internal and stable.
- No user-facing reliance on legacy std builtin symbols.
