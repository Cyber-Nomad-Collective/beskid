## Question

Add the ISLE lowering rule for `ClifBlock` expressions — wire the new `NodeKind::ClifBlock` through the ISLE rule engine so it dispatches to a Rust constructor that emits CLIF.

## Scope

1. **ISLE rule**: Add a rule in `beskid_isle/isle/expressions.isle` that matches `(node_kind (NodeKind.ClifBlock))` and calls the `emit_clif_block` constructor
2. **Constructor declaration**: Add `(decl partial emit_clif_block (AstNodeKey) Value)` in `beskid_isle/isle/expressions.isle`
3. **ISLE extern**: Add `(extern constructor emit_clif_block emit_clif_block)`
4. **Statement variant** (optional for v1): Add `lower_statement` rule for ClifBlock in statement position calling `emit_clif_block_statement`

## Constraints

- The ISLE rule must be placed in `expressions.isle` alongside the other expression lowering rules
- The constructor takes the expression's `AstNodeKey` so it can access the block body via `NodeFacts`

## Files

- `compiler/crates/beskid_isle/isle/expressions.isle` — add rule + declaration + extern
- `compiler/crates/beskid_isle/isle/types.isle` — ensure `NodeKind` includes `ClifBlock` (done in ticket 01)

## References

- `beskid_isle/isle/expressions.isle` — existing expression lowering rules
- `beskid_isle/isle/dispatch.isle` — example of `(extern constructor emit_dispatch_call emit_dispatch_call)` pattern
- `beskid_isle/isle/binary.isle` — example of `(decl partial clif_enum_eq (AstNodeKey) Value)` pattern
