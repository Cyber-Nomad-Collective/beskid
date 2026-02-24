---
description: Lowering HIR to Cranelift IR (CLIF)
---

# Lowering HIR to Cranelift IR (CLIF)

## Goal
Translate HIR directly into Cranelift IR using the `cranelift_frontend` builder. CLIF is the execution IR used by both JIT and AOT paths.
Lowering input is `Spanned<HIRProgram>` produced by the phase-indexed shared-core AST/HIR model.

## Primary tool
- `FunctionBuilder` + `FunctionBuilderContext` for building CLIF blocks and values.
  - Blocks must end with terminators.
  - Use `def_var`/`use_var` to map language variables to SSA values.

Reference: https://docs.rs/cranelift-frontend/latest/cranelift_frontend/struct.FunctionBuilder.html

## Core lowering rules
- **Functions** -> `Function` with signature.
- **Locals** -> `Variable` definitions via `def_var` and `use_var`.
- **If/While/Match** -> explicit blocks + `br`/`cond_br`.
- **Structs/records** -> runtime `alloc` (gc-arena backed) + field writes.
- **Calls** -> `call` with signature registered in module.
- **Return** -> `return` terminator with values.
- **Aggregate params/results** -> pointers in CLIF signatures.

### Aggregate and match layout
- Enums are lowered with a tag at payload offset 0 and variant payload after.
- Member access uses codegen offsets derived from type descriptors.
- Storing heap pointers into heap objects must emit a `gc_write_barrier` call.

### Literal lowering
- `string` literals -> data object + `str_new(ptr, len)` builtin.
- `char` literals -> `iconst` Unicode scalar (`u32`/`i32`).

## Source locations
- Use `set_srcloc` to attach source locations for diagnostics.

## Notes
- CLIF is SSA-based; avoid mutable local semantics in lowering.
- Use block parameters for phi-like merges if needed.

## References
- Cranelift frontend builder: https://docs.rs/cranelift-frontend/latest/cranelift_frontend/struct.FunctionBuilder.html
- CLIF reference: `docs/execution/cranelift/ir.md`
