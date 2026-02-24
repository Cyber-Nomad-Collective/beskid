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
- Keep HIR and AST aligned through a phase-indexed shared-core model, while still allowing HIR-only semantic normalization.

## Pipeline stages
1. **Parser/AST**
   - Already implemented.
2. **HIR (semantic IR)**
   - Name resolution, typing, and desugaring.
   - Built from shared phase-indexed node families so common syntax structure is not duplicated between AST and HIR.
3. **CLIF lowering**
   - Emit Cranelift IR using `FunctionBuilder`.
4. **Module layer**
   - Declare/define functions and data using `cranelift_module`.
5. **Execution**
   - `cranelift_jit` for in-process execution.
6. **AOT output (optional)**
   - `cranelift_object` for object files.

## Runtime dependency
- Heap-backed aggregates (struct/enum) depend on runtime allocation + GC hooks.
- JIT execution registers runtime builtins (alloc, panic, string/array ops) as symbols.
- With gc-arena, all allocation and GC pointer access must happen inside `Arena::mutate`.
- Host-visible values must be rooted in the arena root object.

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
