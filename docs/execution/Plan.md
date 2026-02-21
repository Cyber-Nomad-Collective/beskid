---
description: Pecan execution implementation plan
---
# Pecan execution implementation plan

## Phase 0 — Baseline scaffolding 

**Goal:** prepare crate structure and dependencies.

**Tasks**

1. Add new crates:
   - `pecan_codegen` (CLIF lowering)
   - `pecan_runtime` (builtins + GC hooks)
   - `pecan_engine` (JIT/AOT driver)
2. Add Cranelift dependencies:
   - `cranelift-frontend`, `cranelift-module`, `cranelift-jit`, `cranelift-object`, `cranelift-native`
3. Define shared types:
   - `SpanId`, `SymbolId`, `TypeId` (reuse existing definitions if present).

**Acceptance criteria**

- Workspace builds with new crates (empty stubs).
- CI (if any) passes.

---

## Phase 1 — HIR implementation (core semantic IR)

**Goal:** produce HIR and route analysis to it.

**Tasks**

1. Add `pecan_analysis::hir` module.
2. Implement AST → HIR lowering (symbols + spans).
3. Implement SymbolTable + ModuleGraph.
4. Update analysis rules to accept `HIRProgram`.

**Acceptance criteria**

- HIR for a simple function compiles.
- Analysis test runs on HIR.

---

## Phase 2 — Type system

**Goal:** deterministic typing.

**Tasks**

1. Implement constraint-based inference (HM‑lite).
2. Literal defaults (`i64`, `f64`).
3. Insert explicit `Cast` nodes.
4. Emit type diagnostics.

**Acceptance criteria**

- Unit tests: literal typing, casts, mismatch errors.

---

## Phase 3 — CLIF lowering (core execution)

**Goal:** HIR → CLIF lowering.

**Tasks**

1. Implement CLIF builder in `pecan_codegen` using `FunctionBuilder`.
2. Lower: literals, vars, calls, `if`, `while`, `return`.
3. Runtime calls for strings/arrays.

**Acceptance criteria**

- Generated CLIF validates for a simple program.
- CLIF diagnostics map to spans.

---

## Phase 4 — Module layer + JIT

**Goal:** execute code in process.

**Tasks**

1. Implement `pecan_engine` JIT driver using `JITModule`.
2. Declare/define functions via `Module`.
3. Add minimal runtime builtins in `pecan_runtime`.

**Acceptance criteria**

- CLI command `run` executes a simple `main.pn`.
- JIT returns expected values.

---

## Phase 5 — Runtime & GC hooks (Go‑style)

**Goal:** align runtime with GC spec.

**Tasks**

1. Implement allocation with type descriptor metadata.
2. Add runtime `panic`, `str_new`, `array_new`.
3. Add placeholder GC API surface (no full GC yet).
4. Wire write barriers at pointer stores (stub).

**Acceptance criteria**

- Builtins callable from CLIF.
- Heap objects carry type descriptors.

---

## Phase 6 — AOT support

**Goal:** emit object files.

**Tasks**

1. Add `ObjectModule` path to `pecan_engine`.
2. CLI command `build` emits `.o`.

**Acceptance criteria**

- Object file produced with exported `pub` symbols.

---

## Integration touchpoints

- **CLI**: add `run` and `build` commands.
- **Tests**: add HIR + CLIF lowering tests under `pecan_tests`.
- **Docs**: update execution docs as needed.
