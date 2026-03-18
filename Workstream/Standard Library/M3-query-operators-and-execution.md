# M3 — Query Operators + Execution

## Goal
Implement composable query operators and execution semantics.

## Status
✅ Completed (baseline)

## Completed in this batch
1. Aligned `Query.Contracts` and docs to parser-supported contract shape (`Option`, `Iterator`).
2. Updated `Query.Operators` to carry tracked first-value state and deterministic `Where/Select/Take/Skip/First` behavior.
3. Added baseline stdlib regression tests for query contracts/operator state shape in `compiler/crates/beskid_tests/src/projects/stdlib/compile.rs`.

## Remaining for M3
1. Replace placeholder/sample-driven result encoding with fully value-typed option semantics once generic contract syntax is supported by parser/type system.
2. Define iterator-backed transform composition for non-count-only execution paths.
3. Expand tests from contract-shape checks to behavior-level execution assertions.

## Scope
- `Query.Operators`
- `Query.Execution`

## Tasks
1. Add transforms: `Where`, `Select`, `Take`, `Skip`.
2. Add terminals: `Count`, `First`, `CollectArray`.
3. Keep execution predictable (loop/conditional lowering friendly).
4. Avoid hidden per-element heap allocations in baseline operators.

## Acceptance
- Query operator chains compile through generic wrappers.
- Execution behavior matches docs guarantees.
