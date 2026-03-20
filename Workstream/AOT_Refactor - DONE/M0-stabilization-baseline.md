# M0 — Stabilization Baseline (Try Operator First)

## Goal
Ship a compile-stable, end-to-end **shape implementation** of postfix `?` so grammar support is no longer orphaned, without pulling in full `Result` semantics yet.

## M0 scope boundary
- In scope:
  - parser/AST/HIR/plumbing/traversal for postfix `?`
  - compile stability across analysis, normalize, and codegen dispatch
  - parser + syntax + lowering tests
- Out of scope (deferred to M2+):
  - `Result<T, E>` semantic validation and propagation typing
  - try-to-branch normalization/lowering semantics

## Design decisions (locked for M0)
1. Keep postfix syntax only (`expr?`).
2. Keep explicit `TryExpression` node in both AST and HIR.
3. For M0 typing, `TryExpression` forwards inner type (temporary plumbing behavior).
4. For M0 codegen, `TryExpression` is explicitly unsupported (clear error path), not silently dropped.

## File-level execution checklist

### A) AST/parser wiring
- [x] Integrate `TryExpression` into `Expression` enum and postfix parser branch:
  - `compiler/crates/beskid_analysis/src/syntax/expressions/expression.rs`
- [x] Expose module + re-export:
  - `compiler/crates/beskid_analysis/src/syntax/expressions/mod.rs`
  - `compiler/crates/beskid_analysis/src/syntax/mod.rs`
- [x] Keep `try_expression.rs` as canonical node (no orphan):
  - `compiler/crates/beskid_analysis/src/syntax/expressions/try_expression.rs`

### B) Query/node-kind and HIR shape wiring
- [x] Add `TryExpression` node kind entries:
  - `compiler/crates/beskid_analysis/src/query/mod.rs`
- [x] Add HIR `TryExpression` node + phase mapping:
  - `compiler/crates/beskid_analysis/src/hir/expression.rs`
  - `compiler/crates/beskid_analysis/src/hir/phase.rs`
  - `compiler/crates/beskid_analysis/src/hir/mod.rs`
- [x] Add syntax->HIR lowering for try:
  - `compiler/crates/beskid_analysis/src/hir/lowering/expressions.rs`

### C) Traversal compile stability
- [x] Resolver traverses try inner expression:
  - `compiler/crates/beskid_analysis/src/resolve/resolver.rs`
- [x] Type context handles try shape (forward inner expression type):
  - `compiler/crates/beskid_analysis/src/types/context/expressions.rs`
- [x] HIR legality validates try subtree and spans:
  - `compiler/crates/beskid_analysis/src/hir/legality.rs`
- [x] Normalizer visits try subtree:
  - `compiler/crates/beskid_analysis/src/hir/normalize/core.rs`
- [x] Codegen dispatcher handles try explicitly as unsupported in M0:
  - `compiler/crates/beskid_codegen/src/lowering/expressions/expression.rs`

### D) Tests
- [x] Parser test for postfix `?`:
  - `compiler/crates/beskid_tests/src/parsing/expressions.rs`
- [x] Syntax AST test for `Expression::Try` shape:
  - `compiler/crates/beskid_tests/src/syntax/expressions.rs`
- [x] Lowering test for `HirExpressionNode::TryExpression`:
  - `compiler/crates/beskid_tests/src/analysis/lowering.rs`

## Acceptance criteria
1. `foo()?` parses into AST `Expression::Try`.
2. Lowering produces HIR `TryExpression` (not dropped/rewritten unexpectedly).
3. All core traversals are exhaustive and compile.
4. Codegen fails explicitly (unsupported node) rather than silently mis-lowering.
5. Targeted test suites pass.

## Execution results (one-pass run)
- ✅ `cargo test -p beskid_tests parsing::expressions -- --nocapture`
- ✅ `cargo test -p beskid_tests syntax::expressions -- --nocapture`
- ✅ `cargo test -p beskid_tests analysis::lowering -- --nocapture`

## Deferred follow-up (M2)
- Type-rule gate: `?` valid only on `Result<T, E>`.
- Return-context compatibility checks for propagated errors.
- Normalize/lower `TryExpression` into early-return control flow.
