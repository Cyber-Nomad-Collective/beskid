## Question

Implement ISLE lowering rules for LambdaExpression (CYB-173).

The ISLE coverage audit confirmed LambdaExpression is one of only two real ISLE lowering gaps for v0.4. Freestanding lambda values are already preserved through AST→HIR lowering but classified as `UnsupportedTypedOperation` at the ISLE boundary.

## Constraints

- Requires closure environment/allocation facts — likely depends on CYB-25 (closure/lambda type system)
- Must lower through the canonical pipeline: TypedProgram → CodegenInput → ISLE → CLIF
- ISLE rule coverage tests in `compiler/crates/beskid_isle/tests/rule_coverage.rs` must be updated

## References

- `compiler/crates/beskid_isle/src/lib.rs` — `classify_syntax_node_kind()` classification
- `compiler/crates/beskid_isle/isle/expressions.isle` — candidate rule file
- CYB-25 — freestanding lambda values (W4.2 milestone)
