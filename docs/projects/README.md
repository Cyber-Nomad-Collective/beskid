# Pecan Projects (HCL-based)

Pecan project definition is moving to **HCL** syntax with a `.proj` file extension.

We are dropping `project.pn` as the project definition mechanism and replacing it with a declarative manifest (`Project.proj`) to keep project loading deterministic, tool-friendly, and IDE-friendly.

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
  - useful for `pecan fmt` / auto-migrations and editor tooling

### Decision

Use a two-layer approach:
1. **Loader/validator**: `hcl-rs` (source of truth)
2. **Formatting / in-place updates**: `hcl-edit` (tooling path)

This keeps the runtime path simple and fast while still enabling high-quality developer tooling.

## Project file

- File name: `Project.proj`
- Location: project root

See:
- `docs/projects/manifest.md` for schema
- `docs/projects/examples.md` for examples
- `docs/projects/resolution.md` for graph/resolution rules

## Phase 2 migration plan (interop + projects)

This plan connects stdlib interop migration with the new HCL project system so `Std` can be built and consumed as a normal Pecan project.

### Stage 2.1: Project model introduction
1. Add `pecan_project` crate/module with typed manifest model (`ProjectManifest`, `Target`, `Dependency`).
2. Parse `Project.proj` (HCL content) with `hcl-rs` into typed structs.
3. Add validation pass:
   - required fields
   - duplicate target names
   - unknown dependency source types

### Stage 2.2: CLI and workspace integration
1. Update CLI commands (`run`, `check`, `test`) to discover `Project.proj` from cwd upward.
2. Add explicit override flag (example: `--project <path>`).
3. Build dependency DAG from `dependencies` blocks and detect cycles.

### Stage 2.3: Standard library as a project
1. Create `Std/Project.proj` with `kind = "Lib"` target.
2. Move std prelude/public wrappers into `Std` project sources.
3. Keep runtime `__interop_dispatch_*` internal to compiler/runtime.
4. Resolve `Std.*` imports through normal dependency graph rather than hardcoded injected modules.

### Stage 2.4: Interop phase-2 consolidation
1. Keep `StdInterop` enum generation path (macro/manual) behind std project API.
2. Remove legacy direct std builtin registrations (`sys_print*`, `str_len`) once parity is proven.
3. Add compatibility fallback only for one release window, then remove.

### Stage 2.5: Tooling and migration UX
1. Add migration command: convert `project.pn` -> `Project.proj` where possible.
2. Add diagnostics with actionable fixes.
3. Add `pecan fmt` support for `.proj` files using `hcl-edit`.

### Stage 2.6: LSP `.proj` implementation (`src/pecan_lsp`)
1. Extend file detection to recognize `*.proj` as HCL-backed project manifests.
2. Add diagnostics pipeline for manifest schema and dependency errors.
3. Add semantic completion for top-level blocks (`project`, `target`, `dependency`) and known keys.
4. Add hover and go-to-definition for dependency `path` targets where applicable.
5. Ensure formatter integration routes `.proj` buffers through `hcl-edit` based formatting.

### Stage 2.7: Hardening and release gates
1. Golden tests for manifest parsing and resolution.
2. End-to-end tests for `Std` as dependency (not injected by default).
3. Lock down naming conventions and public std API contracts.

## Success criteria

- `Std` is consumed as a normal dependency project.
- CLI resolves builds from `Project.proj` deterministically.
- Interop dispatch remains internal and stable.
- No user-facing reliance on legacy std builtin symbols.
