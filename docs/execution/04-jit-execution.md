---
description: JIT execution with Cranelift
---

# JIT execution with Cranelift

## Purpose
Execute Beskid code in-process by compiling CLIF to native machine code using `JITModule`.

## Key APIs
- `JITModule::new(builder)`
- `finalize_definitions()`
- `get_finalized_function(func_id)`

Reference: https://docs.rs/cranelift-jit/latest/cranelift_jit/struct.JITModule.html

## Host ISA
- Use `cranelift_native::builder()` to get the host ISA builder.
  https://docs.rs/cranelift-native/latest/cranelift_native/fn.builder.html

## Runtime integration
### Builder setup
- Use `cranelift_module::default_libcall_names()` when creating `JITBuilder`.
- Select a memory provider (system allocator by default; arena provider optional).

### Symbol registration
- Register runtime builtins with `JITBuilder::symbol` before compiling.
- Declare builtins inside the module with `declare_function` so CLIF can import them.

### Lifecycle
- Declare all functions and data.
- Define functions (and data), then call `finalize_definitions()`.
- Retrieve function pointers with `get_finalized_function`.

### gc-arena integration
- JIT entrypoints must run inside `Arena::mutate`.
- Runtime builtins access the current `Mutation` via a thread-local handle set by the engine.
- Values passed across the host boundary must be rooted in the arena root object.
- See `docs/execution/10-runtime-gc.md` for arena lifecycle and host boundary rules.
- JIT calls must always go through the engine wrapper to guarantee mutation scope.

### Safety
- Keep function pointer retrieval behind a safe wrapper.
- `free_memory()` invalidates pointers; call only when it is safe.
- Engine wrapper must catch runtime `panic` and convert it into an error result.
- **IR Verification:** Always run `cranelift_codegen::verify_function` before defining a function in the module. This prevents opaque Cranelift panics caused by invalid generated IR.
- **Dynamic Signature Validation:** Before unsafely transmuting and invoking the entrypoint pointer, validate its signature against the expected ABI to prevent undefined behavior and hard crashes.

## Future Enhancements (Post-MVP)
- **Optimization:** The JIT module currently uses default settings. Future versions should support toggling optimization levels (e.g., `opt_level="speed"`).
- **Concurrency:** The GC mutation state relies on global/thread-local setters (`set_current_mutation`), making the JIT engine strictly single-threaded per process.
- **Incremental Compilation:** The JIT currently compiles the entire `CodegenArtifact` in a batch. Supporting a REPL will require incremental symbol definition and lookup capabilities.
