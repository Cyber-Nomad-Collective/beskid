# LambdaExpression ISLE Lowering — CYB-173

**Agent:** Cursor
**Date:** 2026-07-31

## Status: Already Implemented

Contrary to the ISLE coverage audit snapshot, LambdaExpression ISLE lowering was already fully
wired across all required crates. The audit snapshot likely predates the implementation.

## Audit of Each Required Component

### 1. `NodeKind::LambdaExpression` — `beskid_analysis/src/syntax_query/mod.rs`
**Status:** Present (line 94)

The `node_kinds!` macro invocation includes `LambdaExpression` in the `NodeKind` enum.

### 2. `classify_syntax_node_kind` — `beskid_isle/src/lib.rs`
**Status:** Already `IsleLowered` (line 124)

```rust
Syntax::LambdaExpression => IsleLowered(NodeKind::LambdaExpression),
```

LambdaExpression is already classified as a production-supported ISLE form alongside
SpawnExpression.

### 3. ISLE rule — `beskid_isle/isle/expressions.isle`
**Status:** Present (lines 15-16)

```scheme
(rule (lower_expression key @ (node_kind (NodeKind.LambdaExpression)))
      (emit_lambda key))
```

### 4. `NodeKind` enum in types.isle — `beskid_isle/isle/types.isle`
**Status:** Present (line 5)

`LambdaExpression` is included in the `NodeKind` extern enum.

### 5. `emit_lambda` extern constructor — `beskid_isle/src/lib.rs`
**Status:** Implemented (lines 1814-1836)

The external constructor lowers a freestanding lambda expression to a closure value:
- Capture-free: returns the trampoline function pointer directly
- Capturing: allocates and populates an ABI-v5 closure environment via `emit_inline_closure_environment`,
  then returns the trampoline function pointer

### 6. `LambdaEntry` struct — `beskid_isle/src/lib.rs`
**Status:** Present (lines 424-427)

```rust
pub struct LambdaEntry {
    pub trampoline: DirectCallee,
    pub closure_environment: Option<InlineClosureEnvironment>,
}
```

### 7. `lambda_entry` trait method — `beskid_isle/src/lib.rs`
**Status:** Declared (line 761-763), default returns `None`.

### 8. `lambda_entry` fact implementation — `beskid_codegen/src/isle_adapter/facts_node.rs`
**Status:** Implemented (lines 500-533)

Provides closure environment facts including:
- Capture-free detection (`environment.captures.is_empty()`)
- Closure lowering authority with allocation request symbols, descriptor symbols,
  root slot indices, and per-capture field offsets with pointer map indices

### 9. `emit_closure_lambda_entry_with_call_importer` — `beskid_isle/src/lib.rs`
**Status:** Implemented (lines 2788-2828)

Emits the trampoline function that loads captures from the environment pointer and
executes the lambda body.

### 10. Test coverage — `beskid_isle/tests/rule_coverage.rs`
**Status:** Present (line 160)

```rust
(NodeKind::LambdaExpression, codegen_tests.join("parsed_project_isle_harness.rs")),
```

### 11. `UNSUPPORTED_TYPED_OPERATION_KINDS` roster
**Status:** LambdaExpression NOT listed (correct — it's production-supported)

## Changes Made

### Updated doc comment on `UNSUPPORTED_TYPED_OPERATION_KINDS`
**File:** `compiler/crates/beskid_isle/src/lib.rs` (lines 194-204)

- Removed stale reference: "freestanding lambda values are owned by W4.2 (`CYB-25`)"
- Added `LambdaExpression` alongside `MethodDefinition` and `SpawnExpression` in the list
  of production-supported IsleLowered forms outside the unsupported roster

## Unrelated Pre-existing Issues

### `BuiltinType::F64` non-exhaustive pattern in `beskid_queries`
**File:** `compiler/crates/beskid_queries/src/semantic_contract.rs:2953`

A `match` on `BuiltinType` does not cover the newly added `F64` variant, causing a
compile error. This is outside the scope of CYB-173 and `beskid_isle`.

## Verification

The `cargo check -p beskid_isle` fails due to the unrelated `F64` error in `beskid_queries`.
Once that is resolved, the existing test coverage should pass.

Relevant tests:
- `beskid_isle/tests/rule_coverage.rs::every_isle_lowered_kind_has_verified_clif_evidence`:
  verifies `(NodeKind::LambdaExpression, codegen_tests.join("parsed_project_isle_harness.rs"))`
- `beskid_isle/tests/rule_coverage.rs::expanded_syntax_catalogue_is_total_unique_deterministic_and_surjective`:
  verifies `classify_syntax_node_kind` maps LambdaExpression to IsleLowered
- `beskid_codegen/tests/parsed_project_isle_harness.rs`: CLIF evidence for LambdaExpression

## Conclusion

CYB-173 is effectively complete. The only change needed was updating the outdated doc comment
that still claimed LambdaExpression was "owned by W4.2 (CYB-25)".
