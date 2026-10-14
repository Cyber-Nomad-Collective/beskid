## Why

The grammar let a struct literal start at the path that ends an `if` or `while` condition, a `for` iterable or a `match` scrutinee. In `if a == b {}` the parser read `b {}` as a struct literal and then failed because no block followed. The same failure occurred for `while i < n {}`, `for x in xs {}` and `match x {}`. An author had to put a statement in the block or rewrite the condition. Rust has the same ambiguity and solves it with a "no struct literal" expression context; Beskid now uses that rule.

## What Changes

- A struct literal is not allowed at the top level of an `if` or `while` condition, a `for` iterable or a `match` scrutinee. The `{` after a path in these positions always opens the body.
- A struct literal in these positions must be in parentheses: `if (P { x: 1 }) == p {}`.
- Nested delimited positions allow struct literals again: parentheses, call and enum-constructor arguments, subscripts, array literals, blocks, match arms, macro arguments and string or code interpolations.
- **BREAKING** (source): a condition, iterable or scrutinee that ends in an unparenthesized struct literal followed by a block (`if p == P { x: 1 } { ... }`) no longer parses. No source in the repository uses that form; every existing `.bd` source keeps a byte-identical parse tree.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `compiler--front-end--grammar-and-parser-contract`: adds the struct literal restriction for condition, iterable and scrutinee positions.

## Impact

Compiler: `beskid_analysis` grammar (`beskid.pest`) carries the context on the pest stack, so no syntax node, rule or span changes. The grammar revision digest changes, so persisted syntax artifacts are rebuilt. Mod SDK syntax trees keep their shape. Reverting the grammar edit restores the old behavior.
