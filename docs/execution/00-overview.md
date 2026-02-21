---
description: Execution pipeline overview (Cranelift-first)
---

# Execution pipeline overview (Cranelift-first)

This execution stack uses Cranelift from the start. The compiler produces Cranelift IR (CLIF) directly and executes it via the Cranelift JIT. This avoids maintaining a separate VM/bytecode pipeline.

## Goals
- Single lowering stack: AST -> HIR -> CLIF.
- CLIF is the execution IR and codegen IR.
- Reuse Cranelift infrastructure for CFG, register allocation, and code emission.
- Keep runtime minimal and explicit.

## Pipeline stages
1. **Parser/AST**
   - Already implemented.
2. **HIR (semantic IR)**
   - Name resolution, typing, and desugaring.
3. **CLIF lowering**
   - Emit Cranelift IR using `FunctionBuilder`.
4. **Module layer**
   - Declare/define functions and data using `cranelift_module`.
5. **Execution**
   - `cranelift_jit` for in-process execution.
6. **AOT output (optional)**
   - `cranelift_object` for object files.

## Key Cranelift crates
- Frontend IR builder: https://docs.rs/cranelift-frontend/latest/cranelift_frontend/
- Module abstraction: https://docs.rs/cranelift-module/latest/cranelift_module/
- JIT backend: https://docs.rs/cranelift-jit/latest/cranelift_jit/
- Object backend: https://docs.rs/cranelift-object/latest/cranelift_object/
- Host ISA detection: https://docs.rs/cranelift-native/latest/cranelift_native/
- CLIF reader (testing/debug): https://docs.rs/cranelift-reader/latest/cranelift_reader/

## Local references
- Cranelift IR notes: `docs/execution/cranelift/ir.md`
- Cranelift integration notes: `docs/execution/cranelift/index.md`
