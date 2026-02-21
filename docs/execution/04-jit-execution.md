---
description: JIT execution with Cranelift
---

# JIT execution with Cranelift

## Purpose
Execute Pecan code in-process by compiling CLIF to native machine code using `JITModule`.

## Key APIs
- `JITModule::new(builder)`
- `finalize_definitions()`
- `get_finalized_function(func_id)`

Reference: https://docs.rs/cranelift-jit/latest/cranelift_jit/struct.JITModule.html

## Host ISA
- Use `cranelift_native::builder()` to get the host ISA builder.
  https://docs.rs/cranelift-native/latest/cranelift_native/fn.builder.html

## Runtime integration
- Register host runtime functions (alloc, string ops) as imports and call from CLIF.
- Keep function pointer retrieval behind a safe wrapper.

## Safety
- `free_memory()` invalidates function pointers; only use when safe.
