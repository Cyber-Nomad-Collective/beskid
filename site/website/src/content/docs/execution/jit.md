---
title: "JIT backbone specification"
description: JIT backbone specification
---


## Purpose
The JIT is a thin development-time execution engine for fast feedback. AOT is the primary production path. Both use the same frontend, CLIF lowering, and runtime ABI boundary.

## Primary components
- `cranelift_jit::JITModule`
- `cranelift_module::Module` trait
- `cranelift_frontend::FunctionBuilder`

## JIT flow (per module)
1. Build target ISA via `cranelift_native::builder()`.
2. Create `JITModule` with a `JITBuilder`.
3. Declare function signatures and import runtime ABI symbols.
4. Lower HIR into CLIF and call `define_function`.
5. Call `finalize_definitions()`.
6. Retrieve function pointers with `get_finalized_function`.

## JIT scope and constraints
- The frontend emits CLIF once.
- The module abstraction is shared with AOT.
- JIT must not implement platform syscall policy or backend-specific execution behavior.
- JIT imports runtime builtins through the shared ABI manifest used by AOT.
- For AOT, replace `JITModule` with `ObjectModule`.

## Safety model
- All finalized function pointers remain valid until `free_memory()`.
- Do not hold or call pointers after memory is freed.

## Debug strategy
- Allow optional CLIF emission to files for testing.
- Use `cranelift_reader` to parse CLIF for golden tests.
- Keep JIT tests focused on smoke validation and parity with AOT/runtime ABI.
