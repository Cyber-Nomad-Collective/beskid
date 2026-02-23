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
2. Define phase markers and shared-core node families:
   - `AstPhase` and `HirPhase` marker types.
   - Shared core node families for `Program`, `Module`, `Item`, `Statement`, `Expression` with phase parameters.
   - Phase-associated metadata slots for resolved symbols and expression types.
3. Provide AST compatibility layer:
   - Type aliases for AST nodes backed by shared-core families.
   - Preserve parser output shape and `Spanned<T>` invariants.
4. Define HIR compatibility layer:
   - Type aliases for HIR nodes backed by shared-core families.
   - HIR-only semantic fields attached through the phase metadata.
5. Implement SymbolTable + ModuleGraph for resolution.
6. Implement AST → HIR lowering pipeline (symbols + spans):
   - Declaration collection.
   - Name resolution.
   - Early normalization (desugaring of syntactic sugar).
   - Emit explicit `CastExpression` nodes where required (stub until Phase 2 typing).
7. Add HIR legality validation helpers:
   - Check every node is `Spanned<T>`.
   - Check identifiers are resolved.
   - Check normalized control-flow forms.
8. Update analysis rules to accept `Spanned<HIRProgram>`.
9. Provide minimal HIR Query support (shared with AST) for rule traversal.

**Acceptance criteria**

- HIR for a simple function compiles.
- Analysis test runs on `Spanned<HIRProgram>`.
- Shared-core AST nodes continue to parse and traverse without regression.
- HIR lowering preserves spans for diagnostics and passes validation checks.

### Resolver implementation detail (Phase 1)

**Goal:** resolve names with minimal code while staying extensible.

**Dependency order**

1. **Module discovery (ModuleGraph)**
   - Map file paths → `ModuleId` and module path.
   - Store per-module item list and scope root.
   - Track `mod` declarations to link children.

2. **Item table pass (top-level only)**
   - Assign `ItemId` per item.
   - Insert into module scope; detect duplicates.
   - Record `ItemKind` (function, type, enum, contract, module, use).

3. **Local scope pass (block-level)**
   - Walk statements/expressions with a stack of scopes.
   - Add locals (`let`, params), produce `LocalId`.
   - Resolve `PathExpression` and `Type::Complex`.

4. **Resolution outputs (side tables)**
   - `ResolvedPathId` keyed by node/span (value/type namespaces split later).
   - `ItemId`/`LocalId` stored in tables (no HIR mutation yet).

**Maintainability hooks**
- Keep symbol namespaces separate (`values`, `types`) even if only one is used now.
- Implement resolver as a small pass in `pecan_analysis::resolve` (new module).
- Use helpers/macros for AST walking to minimize boilerplate.

**Acceptance criteria**
- Duplicate top-level names fail with spans.
- `PathExpression` resolves to correct `ItemId`/`LocalId`.
- `use`/`mod` hooks exist (even if minimal behavior at first).

**Current progress (handoff status)**
- `pecan_analysis::resolve` split into submodules: `ids`, `errors`, `items`, `resolver`.
- Top-level item collection implemented (`Resolver::resolve_program`) with duplicate detection.
- `ModuleGraph` added with per-module item scopes and module path tracking.
- Local scope stack + `LocalId` tracking implemented.
- `ResolutionTables` added for resolved values/types + locals.
- Path/type resolution and basic diagnostics (unknown value/type, duplicate local) implemented.
- Resolver/type diagnostics now emitted through analysis `builtin_rules` and CLI.

**Remaining work**
1. Extend diagnostics: shadowing warning + module-aware resolution.
2. Add resolver tests (duplicate top-level, locals, unknown path/type).

### Codebase evaluation (resolver + typing)

**Resolver status**
- Implemented: top-level item collection, module graph, local scopes, resolution tables, and path/type resolution.
- Missing: module-aware resolution (per-module symbol visibility), shadowing warnings, tests.

**Type system status**
- Implemented: `TypeId` + `TypeTable` with primitives and named types (`ItemId`-backed) only.
- Missing: type context wiring, expression typing pass, statement typing, diagnostics, and cast handling.

### Continuation plan (resolver → type checking)

1. **Resolver: module graph + scope layout**
   - ✅ `ModuleGraph` maps module paths/files → `ModuleId`, per-module item lists.
   - ✅ Per-module scope table wired to item insertion.
2. **Resolver: local scope pass**
   - ✅ Scope stack (block + function) interns locals (`LocalId`).
   - ✅ Resolve `PathExpression` and `Type::Complex` into side tables keyed by span.
3. **Resolver: outputs + diagnostics**
   - ✅ `ResolutionTables` holds resolved values/types + locals.
   - ✅ Unknown symbol/type + duplicate local diagnostics.
   - ⏳ Shadowing warnings (still needed).
4. **Type system: typing context setup**
   - Add a `TypeContext` that references `ResolutionTables` + `TypeTable`.
   - Seed `TypeTable` with primitives + all named types from resolution.
5. **Type system: expression typing pass**
   - Walk expressions/statement bodies and assign `TypeId` via a side table.
   - Provide literal defaults and enforce `let` annotations when inference is not allowed.
6. **Type system: validation + diagnostics**
   - Validate operators, calls, returns, and control-flow joins.
   - Record cast intents (or insert explicit cast nodes) for safe coercions.
7. **Testing + diagnostics**
   - Add resolver tests (duplicate top-level, locals, unknown path).
   - Add typing tests (literals, mismatches, call arity/type errors, returns).

---

## Phase 2 — Type system

**Goal:** deterministic typing.

**Tasks**

1. **Type identity layer**
   - `TypeId` table for primitive + named types.
   - Map resolved `ItemId` to named type IDs.
2. **Typing context + structure**
   - `TypeContext` stores `TypeTable`, expression type map, local type map, and signatures.
   - Split typing logic into focused modules:
     - `context.rs` for shared state and entrypoints.
     - `helpers.rs` for seed/utility helpers.
     - `items.rs` for item-level typing and signature capture.
     - `statements.rs` for statement typing.
     - `expressions.rs` for expression typing.
     - `types.rs` for type lookup/mapping.
3. **Minimal typing (no inference)**
   - Require explicit type annotations for `let`.
   - Literal defaults (`i64`, `f64`, `bool`, etc.).
4. **Expression + statement typing pass**
   - Assign `TypeId` to expressions via side tables.
   - Validate operators, returns, conditions (`if`, `while`, `for`).
5. **Call typing + signatures**
   - Record `FunctionSignature` for functions/methods.
   - Validate call arity and argument types; yield return type.
6. **Structured types**
   - Validate struct/enum literals (field presence and types).
   - Validate member access once field info is modeled.
7. **Match typing**
   - Enforce consistent arm types and return type propagation.
8. **Casts and diagnostics**
   - Insert explicit cast nodes (or record cast intents) when safe.
   - Emit span-based errors for mismatch/missing type.

**Acceptance criteria**
- Unit tests: literal typing, call arity/type errors, mismatch errors, return typing.
- Typing pass produces expression type table for simple programs.

**Current progress (handoff status)**
- `pecan_analysis::types` module split; `TypeId`, `TypeInfo`, `TypeTable` in `types/table.rs`.
- Typing context split into `context`, `helpers`, `items`, `statements`, `expressions`, `types` modules.
- `TypeContext` seeds primitive/named types and produces expression/local type tables.
- Function signatures recorded and used for call typing (arity + argument types).
- Tests added: literal typing, mismatch, non-bool condition, return mismatch, call arity.
- Type/resolution errors now surfaced via analysis diagnostics and CLI.

**Remaining work**
1. Extend typing for member access, struct/enum literals, and match expressions.
2. Add cast insertion or cast intent table for safe coercions.
3. Add diagnostics for signature lookup failures and missing fields when struct typing lands.
4. Expand tests for match typing, struct literals, and member access.

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
