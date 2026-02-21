---
description: Pecan execution architecture (current codebase)
---

# Pecan execution architecture (current codebase)

This document describes the intended execution stack and how it maps to the **current** codebase structure under `src/`. It is aligned with the Cranelift-first execution docs in `docs/execution/`.

## Current modules (source tree)

### `src/pecan_analysis`
- **Parser & grammar**: `src/pecan_analysis/src/pecan.pest` and `parser.rs`
- **Parsing helpers**: `src/pecan_analysis/src/parsing/`
- **Syntax AST**: `src/pecan_analysis/src/syntax/`
- **Query API**: `src/pecan_analysis/src/query/`
- **Semantic analysis scaffolding**: `src/pecan_analysis/src/analysis/`

### `src/pecan_cli`
- CLI entrypoint and commands (`parse`, `tree`, `analyze`).
- Current execution is limited to parsing and analysis stubs.

### `src/pecan_tests`
- Tests for analysis scaffolding and parsing.

### `src/pecan_ast_derive`
- Derive macros for AST utilities.

## Target execution pipeline (Cranelift-first)

### 1) AST (existing)
- Source is parsed into AST nodes under `pecan_analysis::syntax`.
- This provides structured syntax nodes but not a semantic model.

### 2) HIR (to add)
- Lives in `pecan_analysis::hir` (new module).
- Responsibilities:
  - name resolution, type checking, desugaring.
  - stable semantic structure for codegen.
- Output used directly by CLIF lowering.

### 3) CLIF lowering (to add)
- Lives in `pecan_codegen` (new crate) or `pecan_analysis::codegen` (new module).
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

## Mapping to planned crates/modules

**Final structure** (clean separation of concerns):
- `pecan_analysis` — parsing, syntax, query, HIR.
- `pecan_codegen` — CLIF lowering + module abstraction.
- `pecan_runtime` — host functions and value ABI.
- `pecan_exec` — JIT/AOT drivers (CLI entrypoints call this).

## Incremental path from current state
1. Add HIR module and minimal lowering from AST.
2. Add CLIF lowering for functions + literals.
3. Add module layer using `cranelift_module`.
4. Add JIT execution to `pecan_cli` (new command `run`/`exec`).
5. Add runtime builtins for strings/arrays.

## Related docs
- `docs/execution/00-overview.md`
- `docs/execution/01-hir.md`
- `docs/execution/02-clif-lowering.md`
- `docs/execution/03-module-layer.md`
- `docs/execution/04-jit-execution.md`
- `docs/execution/06-runtime-abi.md`
