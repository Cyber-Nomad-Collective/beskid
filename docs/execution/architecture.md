---
description: Beskid execution architecture (current codebase)
---

# Beskid execution architecture (current codebase)

This document describes the intended execution stack and how it maps to the **current** codebase structure under `src/`. It is aligned with the Cranelift-first execution docs in `docs/execution/`.

## Current modules (source tree)

### `src/beskid_analysis`
- **Parser & grammar**: `src/beskid_analysis/src/beskid.pest` and `parser.rs`
- **Parsing helpers**: `src/beskid_analysis/src/parsing/`
- **Syntax AST**: `src/beskid_analysis/src/syntax/`
- **Query API**: `src/beskid_analysis/src/query/`
- **Semantic analysis scaffolding**: `src/beskid_analysis/src/analysis/`

### `src/beskid_cli`
- CLI entrypoint and commands (`parse`, `tree`, `analyze`).
- Current execution is limited to parsing and analysis stubs.

### `src/beskid_tests`
- Tests for analysis scaffolding and parsing.

### `src/beskid_ast_derive`
- Derive macros for AST utilities.

## Target execution pipeline (Cranelift-first)

### 1) AST (existing)
- Source is parsed into AST nodes under `beskid_analysis::syntax`.
- This provides structured syntax nodes but not a semantic model.

### 2) HIR (to add)
- Lives in `beskid_analysis::hir` (new module).
- Responsibilities:
  - name resolution, type checking, desugaring.
  - phase-indexed shared-core structure so AST and HIR reuse canonical node families.
  - stable semantic structure for codegen.
- Output used directly by CLIF lowering.

### 3) CLIF lowering (to add)
- Lives in `beskid_codegen` (new crate).
- Uses `cranelift_frontend::FunctionBuilder` to emit CLIF from HIR.
- CLIF becomes the **only** executable IR (no custom MIR).

### 4) Module layer (to add)
- Uses `cranelift_module::Module` abstraction.
- Single frontend can target:
  - `cranelift_jit::JITModule` for execution.
  - `cranelift_object::ObjectModule` for AOT.

### 5) Runtime (to add)
- Implement minimal runtime functions used by CLIF.
- Expose runtime builtins through the module layer.
- Provide allocator + GC hook scaffolding to enable heap-backed aggregates.

## Mapping to planned crates/modules

**Final structure** (clean separation of concerns):
- `beskid_analysis` — parsing, syntax, query, HIR.
- `beskid_codegen` — CLIF lowering + module abstraction.
- `beskid_runtime` — host functions, allocator, and GC hook surface.
- `beskid_engine` — JIT/AOT drivers (CLI entrypoints call this), runtime symbol registration.

## Incremental path from current state
1. Add HIR module and minimal lowering from AST.
2. Add CLIF lowering for functions + literals.
3. Add module layer using `cranelift_module`.
4. Add JIT execution and AOT build integration to `beskid_cli` (new commands `run` and `build`).
5. Add runtime builtins for strings/arrays.

## Related docs
- `docs/execution/00-overview.md`
- `docs/execution/01-hir.md`
- `docs/execution/HIR/README.md`
- `docs/execution/02-clif-lowering.md`
- `docs/execution/03-module-layer.md`
- `docs/execution/04-jit-execution.md`
- `docs/execution/06-runtime-abi.md`
