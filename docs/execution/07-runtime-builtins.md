---
description: Runtime builtins, interop, and host functions
---

# Runtime builtins and host functions

## Purpose
Provide foundational operations (alloc, GC hooks) and a scalable Interop Dispatcher for the Beskid Standard Library to call host (Rust) functions.

## Internal Builtins
These are low-level runtime hooks called directly by the codegen during lowering. They are not exposed to user code.
- `alloc(size, type_desc_ptr) -> ptr`
- `str_new(ptr, len) -> {ptr, len}`
- `array_new(elem_size, len) -> {ptr, len, cap}`
- `panic(msg_ptr, msg_len) -> never`

## GC scaffolding hooks
- `gc_register_root(ptr_addr) -> void`
- `gc_unregister_root(ptr_addr) -> void`
- `gc_write_barrier(dst_obj, value_ptr) -> void`
- `gc_root_handle(value_ptr) -> u64`
- `gc_unroot_handle(handle: u64) -> void`

**Handle semantics**
- Handles are opaque indices into the runtime root handle table.
- Host code must call `gc_unroot_handle` when the value is no longer needed.

## Standard Library Interop (Command Pattern)
Instead of declaring hundreds of individual standard library methods as external Cranelift functions, Beskid uses an **Interop Dispatcher** model.

### Architecture
1. **Stdlib Source Project:** Public std wrappers are authored in `standard_library` as normal Beskid code.
2. **Interop Source Generation:** `pekan_cli interop` generates interop wrappers/enum source used by stdlib (`Interop.generated.bd`).
3. **Typed Dispatcher Builtins:** Codegen calls typed dispatch builtins (`__interop_dispatch_unit`, `__interop_dispatch_usize`, `__interop_dispatch_ptr`) that accept an interop enum pointer.
4. **Rust Dispatchers:** Runtime exports typed dispatcher functions that decode the enum tag/payload and execute host logic.

### Benefits
- **Scalability:** Adding a new standard library method requires zero changes to the Cranelift codegen or JIT module registration.
- **Boundary Clarity:** Language/runtime pipeline depends on ABI/internal builtins, while `std` remains an external project dependency.

## Integration strategy
- Internal builtins and the Dispatcher are declared via `Module::declare_function`.
- Import them in CLIF with `declare_func_in_func`.
- Builtins that allocate or touch GC pointers require an active `Mutation` handle.
- Any heap pointer store must call `gc_write_barrier` (stubbed in v0).

## Notes
- Keep builtins minimal at first.
- Avoid direct syscalls in frontend; centralize in runtime.
- `panic` should abort the current JIT call and return an error to the host wrapper.
