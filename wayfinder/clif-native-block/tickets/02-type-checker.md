## Question

Implement type checking for `ClifBlock` expressions — the block is opaque to the type checker; it trusts the declared return type of the enclosing function or the explicit type annotation.

## Scope

1. **Type checker integration**: In `beskid_analysis/src/types/checker/expressions.rs`, add a handler for `Expression::ClifBlock` that returns the function's declared return type (for expression-position blocks) or `Unit` (for statement-position blocks)
2. **ClifBlock classification**: The block is an expression, so it participates in type checking like any other expression — it just doesn't have internal type checking

## Constraints

- The type checker never inspects the block body — it's opaque
- No type inference from the block — the type must come from context
- In expression position (e.g., `return clif { ... }`), the type is the function's return type
- In statement position (e.g., `clif { ... };`), the type is `Unit`

## Files

- `compiler/crates/beskid_analysis/src/types/checker/expressions.rs` — add `ClifBlock` arm
- `compiler/crates/beskid_queries/src/semantic_contract.rs` — add to `node_type_tracked` or `abi_type_tracked`

## References

- `beskid_analysis/src/types/checker/expressions.rs` — see how `SpawnExpression` is handled for the opaque pattern
- `beskid_queries/src/semantic_contract.rs:1337` — `node_type_tracked` function
- `beskid_isle/src/lib.rs:88-185` — `classify_syntax_node_kind` (ensure ClifBlock is `IsleLowered`, not `UnsupportedTypedOperation`)
