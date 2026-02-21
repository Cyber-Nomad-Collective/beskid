---
description: Lowering HIR to Cranelift IR (CLIF)
---

# Lowering HIR to Cranelift IR (CLIF)

## Goal
Translate HIR directly into Cranelift IR using the `cranelift_frontend` builder. CLIF is the execution IR used by both JIT and AOT paths.

## Primary tool
- `FunctionBuilder` + `FunctionBuilderContext` for building CLIF blocks and values.
  - Blocks must end with terminators.
  - Use `def_var`/`use_var` to map language variables to SSA values.

Reference: https://docs.rs/cranelift-frontend/latest/cranelift_frontend/struct.FunctionBuilder.html

## Core lowering rules
- **Functions** -> `Function` with signature.
- **Locals** -> `Variable` definitions via `def_var` and `use_var`.
- **If/While/Match** -> explicit blocks + `br`/`cond_br`.
- **Structs/records** -> `alloc` + field writes (or runtime calls).
- **Calls** -> `call` with signature registered in module.
- **Return** -> `return` terminator with values.

## Source locations
- Use `set_srcloc` to attach source locations for diagnostics.

## Notes
- CLIF is SSA-based; avoid mutable local semantics in lowering.
- Use block parameters for phi-like merges if needed.

## References
- Cranelift frontend builder: https://docs.rs/cranelift-frontend/latest/cranelift_frontend/struct.FunctionBuilder.html
- CLIF reference: `docs/execution/cranelift/ir.md`
