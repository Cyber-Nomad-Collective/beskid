# M2 — Core Semantics A (Iterable `for in` detailed implementation plan)

## Goal
Implement **correct iterable `for in` semantics** end-to-end (typing, normalization, lowering, and runtime/codegen behavior), while keeping a fast path for recognized range iteration.

## Current state (codebase-grounded)

1. Syntax/HIR shape is already generalized (`iterable` expression exists).
   - `crates/beskid_analysis/src/syntax/statements/for_statement.rs`
   - `crates/beskid_analysis/src/hir/statement.rs`

2. Typing currently binds iterator to the iterable expression type directly (no iterator contract).
   - `crates/beskid_analysis/src/types/context/statements.rs`

3. Normalization currently preserves `ForStatement` as-is (no semantic lowering yet).
   - `crates/beskid_analysis/src/hir/normalize/statements/for_statement.rs`

4. Codegen currently rejects `ForStatement` as unsupported.
   - `crates/beskid_codegen/src/lowering/statements/statement.rs`

5. Resolver resolves iterable expression and loop scope, but does not enforce/prove iterable protocol shape.
   - `crates/beskid_analysis/src/resolve/resolver.rs`

---

## Phase 1 — Required refactors/enhancements (before semantics)

This phase is mandatory to avoid scattering iterable-loop semantics across typing/normalize/codegen.

### 1.1 Introduce iterable loop semantic helper layer in analysis
Create a dedicated helper module (single source of truth) to reason about iterable contracts.

- Add helper(s) in `types/context` (new file or internal module):
  - `resolve_iterable_item_type(iterable_expr) -> Result<ItemType, IterableTypeError>`
  - Contract check target: `iterable.Next() -> Option<T>` (or project-equivalent protocol shape).
- Centralize diagnostics for all iterable-loop typing failures in one place.

Why: `type_statement` in `types/context/statements.rs` should orchestrate, not encode protocol logic inline.

### 1.2 Refactor `for` normalization into strategy-based paths
Refactor `hir/normalize/statements/for_statement.rs` into explicit lowering strategies:

1. `range` fast-path strategy (when iterable is recognized `range(a,b)` form)
2. generic iterable strategy (`Next()/Option` state-machine lowering)

Suggested structure:
- `normalize_for_statement(...)`
- `try_normalize_range_fast_path(...) -> Option<Vec<Stmt>>`
- `normalize_generic_iterable(...) -> Vec<Stmt>`

Why: keeps fast-path optimization without mixing concerns with generic protocol lowering.

### 1.3 Add explicit internal lowering shape markers
Introduce clear internal markers/metadata to represent what normalization produced (range-fast-path vs generic iterator path), so later passes/debugging/tests can assert intended path.

Why: prevents silent regressions where range path accidentally falls back or vice versa.

### 1.4 Prepare codegen contract boundary
Define and document the invariant expected by codegen after normalization:

- Either `ForStatement` is fully eliminated before codegen, **or**
- codegen handles only normalized loop primitives and never raw iterable contracts.

Why: current behavior is explicit unsupported; this phase defines the handoff contract to avoid ambiguous implementation.

---

## Phase 2 — Iterable typing semantics

### 2.1 Implement iterable contract validation
- In `types/context/statements.rs`, replace current direct binding behavior with helper usage.
- Verify iterable has required protocol/member shape.
- Infer loop variable type from yielded item type (`T` from `Option<T>`).

### 2.2 Add diagnostics
- Add/extend issue kinds in `analysis/diagnostic_kinds.rs` (or existing diagnostics path):
  - non-iterable used in `for in`
  - invalid `Next` return shape
  - non-`Option` return from `Next`

### 2.3 Ensure iterator mutability semantics
- Keep iterator variable read-only unless language rule says otherwise.
- Validate compatibility with existing mutability rule visitors.

---

## Phase 3 — Iterable normalization semantics

### 3.1 Range fast path
- Detect `range(a,b)` call expression robustly in normalize step.
- Lower to optimized while-form loop with stable existing behavior/perf assumptions.

### 3.2 Generic iterable lowering
- Lower `for i in iterableExpr { body }` into loop state machine using iterator protocol:
  - initialize iterator state
  - call `Next()` each iteration
  - break on `None`
  - bind `i` to `Some` payload
  - execute body

### 3.3 Span and debug quality
- Preserve meaningful spans for desugared nodes for diagnostics and tooling.

---

## Phase 4 — Backend integration

### 4.1 Codegen compatibility
- Update lowering/codegen paths so normalized output from Phase 3 compiles in both JIT and AOT paths.
- Remove (or narrow) the current `for statement` unsupported error once invariants are satisfied.

### 4.2 Runtime/API alignment
- Ensure any iterator protocol runtime assumptions are shared and consistent across backends.

---

## Phase 5 — Tests and hardening

### 5.1 Analysis/type tests
- `crates/beskid_tests/src/analysis/types.rs`
  - valid iterable inference (`T` inferred correctly)
  - invalid iterable diagnostics
  - invalid `Next`/`Option` shape diagnostics

### 5.2 Normalization/lowering tests
- `crates/beskid_tests/src/analysis/lowering.rs`
  - range fast-path chosen for `range(a,b)`
  - generic iterable lowered to protocol state-machine shape

### 5.3 Codegen tests
- `crates/beskid_tests/src/codegen/lowering.rs`
  - end-to-end executable lowering for range and generic iterable loops
  - keep explicit failure tests only for truly unsupported constructs

### 5.4 Regression set
- nested loops, break/continue interaction, shadowing, iterator expression side effects, empty iterable.

---

## Acceptance criteria

1. `for i in range(...)` uses optimized lowering path and remains behaviorally stable.
2. `for i in iterableExpr` type-checks via iterable contract and lowers successfully.
3. Iterator variable type is inferred from yielded element type (not iterable container type).
4. Diagnostics for invalid iterable shapes are precise and span-correct.
5. JIT/AOT both pass iterable `for` integration tests.
