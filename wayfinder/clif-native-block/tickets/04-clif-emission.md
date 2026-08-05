## Question

Implement the `emit_clif_block` Rust constructor — the core codegen that takes a `clif { ... }` block body string, resolves `%N` references to function parameters/enclosing-scope values, and emits the corresponding CLIF instructions into the active `FunctionBuilder`.

## Scope

1. **Constructor signature**: `fn emit_clif_block(&mut self, key: AstNodeKey) -> Option<Value>` in `beskid_isle/src/lib.rs`
2. **Body extraction**: Read the block body string via a new `NodeFacts` method `fn clif_block_body(&self, key: AstNodeKey) -> Option<&str>` (returns the raw text between `{` and `}`)
3. **Parameter binding**: Parse `%0`, `%1`, ... references in the body and map them to the function's parameters. For v1, `%N` maps to the Nth function parameter.
4. **Instruction parsing**: Parse a simple CLIF instruction subset:
   - `call @symbol(%a, %b, ...)` — direct extern function call
   - `return %N` — return value (sets the block's result)
5. **CLIF emission**: For `call @symbol(...)`, import the extern function and emit a `call` CLIF instruction. For `return %N`, use the referenced value as the block's result.
6. **Extern import**: Use `ExternalName::user` with the symbol name to create the extern function reference — the module emission layer will handle JIT resolution

## Constraints

- The block body parser must be simple — no full CLIF text parsing, just the instruction subset above
- Parameter `%N` references must be validated (N must be < function param count)
- The constructor returns `Value` — the result of the `return %N` instruction
- Errors (invalid syntax, unknown symbol) produce `LoweringError` with the key

## Files

- `compiler/crates/beskid_isle/src/lib.rs` — `emit_clif_block` constructor
- `compiler/crates/beskid_codegen/src/isle_adapter/facts_node.rs` — `clif_block_body` NodeFacts impl

## References

- `beskid_isle/src/lib.rs:1746` — `emit_dispatch_call` constructor (similar pattern)
- `beskid_isle/src/lib.rs:1057` — `direct_call` function (extern call pattern)
- `beskid_isle/src/lib.rs:962` — `import_direct_call` (extern import pattern)
- `beskid_codegen/src/isle_adapter/facts_node.rs` — `NodeFacts` impl pattern
