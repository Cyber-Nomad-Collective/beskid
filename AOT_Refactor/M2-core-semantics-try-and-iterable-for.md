# M2 — Core Semantics A (`?` and iterable `for in`)

## Goal
Complete typing + normalization/lowering semantics for postfix try and generalized `for in`.

## Task list

### 1) `?` typing semantics
- Add type rule in expression typing:
  - `crates/beskid_analysis/src/types/context/expressions.rs`
- Rule: only `Result<T, E>` accepted; output `T`.
- Emit precise error when used on non-`Result` values.
- Add issue kinds/codes/messages if missing:
  - `analysis/diagnostic_kinds.rs`

### 2) `?` lowering/normalization
- Introduce explicit normalization rewrite for `expr?` to early-return control flow.
- Integrate into normalization passes while preserving span quality.
- Files likely touched:
  - `hir/normalize/*`
  - backend lowering consumption paths (JIT/AOT shared lowering contract)

### 3) Iterable `for in` typing
- Replace `type_range_expression` assumptions in statement typing:
  - `types/context/statements.rs`
- Add iterable contract checks (e.g., `Next() -> Option<T>` shape).
- Iterator variable type inference from yielded type.

### 4) Iterable `for in` resolve + normalize
- Resolve iterable expression (not only `RangeExpression`):
  - `resolve/resolver.rs`
- Normalization:
  - keep optimized range fast path for `range(a,b)`
  - lower generic iterable to protocol loop state-machine
  - `hir/normalize/statements/for_statement.rs`

## Acceptance criteria
- `expr?` works for valid `Result` paths and rejects invalid targets.
- `for i in range(...)` remains optimized and behaviorally stable.
- `for i in iterableExpr` lowers and type-checks via iterator contract.

## Test targets
- New parser/type/lowering tests for try operator in:
  - `crates/beskid_tests/src/parsing/expressions.rs`
  - `crates/beskid_tests/src/analysis/types.rs`
  - `crates/beskid_tests/src/codegen/lowering.rs`
- Extend control-flow parsing and lowering tests:
  - `parsing/control_flow.rs`
  - `analysis/lowering.rs`
  - `codegen/lowering.rs`
