---
title: "HIR to CLIF lowering rules"
description: HIR to CLIF lowering rules
---


## Goals
- CLIF is the only executable IR.
- One lowering path for JIT and AOT.
- Lowering input is `Spanned<HIRProgram>` produced by the phase-indexed shared-core AST/HIR model.

## Function lowering
- Each `HIRFunctionDefinition` becomes one Cranelift `Function` with a signature from the HIR type.
- Parameters become CLIF block params in the entry block.

## Control flow
- `if`: entry -> then/else blocks -> merge block.
- `while`: loop header -> body -> backedge to header.
- `match`: chain of test blocks; later jump-table for enums.
- `for range(...)`: lowers through numeric fast-path.
- `for iterator_expr`: lowers through `Next()` loop until `Option::None`.

## Locals and variables
- Locals map to `Variable` in `FunctionBuilder`.
- `def_var` used at first assignment; `use_var` at reads.

## Aggregates
- Struct allocation: `alloc` builtin returns pointer; `field_set` via stores.
- Arrays/strings use runtime builtins (`array_new`, `str_new`).

## Calls
- Calls use `call` with signature registered via `Module::declare_function`.
- Runtime builtins are imported via `declare_func_in_func`.
- Lowering dispatches calls by typed call classification metadata (`MethodDispatch`, `ItemCall`, `CallableValueCall`).
- Method dispatch uses one canonical lowering path independent of source syntax shape.

## Returns
- Use `return` terminator with explicit values.

## Source locations
- Use `set_srcloc` for diagnostics mapping.
