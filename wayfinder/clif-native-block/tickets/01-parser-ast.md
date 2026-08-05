## Question

Add `clif { ... }` block syntax to the Beskid parser, AST, and node classification — making `ClifBlock` a recognized expression kind that the compiler can lower.

## Scope

1. **Grammar**: Add a `clif` keyword followed by a braced block body in the parser combinator grammar (`beskid_pest_gen` or `beskid_analysis/src/parsing/`)
2. **AST node**: Add `ClifBlockExpression` variant to the `Expression` enum and its definition in `beskid_analysis/src/syntax/expressions/`
3. **Node classification**: Add `ClifBlock` to `NodeKind` in `beskid_isle/src/lib.rs` and map it in `classify_syntax_node_kind()`
4. **ISLE types**: Add `ClifBlock` to `NodeKind` extern enum in `beskid_isle/isle/types.isle`

## Constraints

- The block body is a raw string — no CLIF parsing happens at this stage
- The AST node has one field: `body: String` (the text between `{` and `}`)
- Must not break existing syntax
- Children of the `clif` block expression in the AST are: none (the body is opaque)
- The `clif` keyword must be reserved

## Files

- `compiler/crates/beskid_analysis/src/parsing/` — parser grammar (custom combinator, not Pest)
- `compiler/crates/beskid_analysis/src/syntax/expressions/` — new `clif_block.rs` + register in `mod.rs`
- `compiler/crates/beskid_analysis/src/syntax/mod.rs` — export `ClifBlockExpression`
- `compiler/crates/beskid_isle/src/lib.rs` — `NodeKind::ClifBlock` + `classify_syntax_node_kind` arm
- `compiler/crates/beskid_isle/isle/types.isle` — `NodeKind` extern enum

## References

- `beskid_analysis/src/syntax/expressions/spawn_expression.rs` — example of a simple expression AST node
- `beskid_analysis/src/syntax/expressions/block_expression.rs` — example of a braced block
- `beskid_analysis/src/parsing/` — parser infrastructure
- `beskid_isle/src/lib.rs:48-77` — `node_kinds!` macro and `classify_syntax_node_kind`
