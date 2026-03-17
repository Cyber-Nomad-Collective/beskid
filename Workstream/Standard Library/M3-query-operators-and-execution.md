# M3 — Query Operators + Execution

## Goal
Implement composable query operators and execution semantics.

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
