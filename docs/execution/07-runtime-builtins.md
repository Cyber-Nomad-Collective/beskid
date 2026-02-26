---
description: Runtime builtins, interop, and host functions
---

# Runtime builtins and host functions

## Purpose
Provide foundational operations (alloc, GC hooks) and a scalable Interop Dispatcher for the Pecan Standard Library to call host (Rust) functions.

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
Instead of declaring hundreds of individual standard library methods as external Cranelift functions, Pecan uses an **Interop Dispatcher** model.

### Architecture
1. **Rust Macro Definition:** A `define_stdlib!` macro in Rust defines the standard library API surface.
2. **Pecan Enum Generation:** The macro auto-generates a Pecan `enum` (e.g., `StdInterop`) where variants represent method calls and their arguments.
3. **Pecan Wrapper Generation:** The macro auto-generates Pecan wrapper functions (e.g., `std::io::println`) that construct the enum and pass it to an internal dispatcher builtin.
4. **Rust Dispatcher:** The JIT module registers a single `__interop_dispatch` symbol. This Rust function receives the enum pointer, decodes the tag and payload, and executes the requested host logic.

### Benefits
- **Scalability:** Adding a new standard library method requires zero changes to the Cranelift codegen or JIT module registration.
- **Type Safety:** The generated Pecan wrappers ensure type safety on the user side, while the Rust dispatcher unpacks the memory layout safely using generated offsets.

## Integration strategy
- Internal builtins and the Dispatcher are declared via `Module::declare_function`.
- Import them in CLIF with `declare_func_in_func`.
- Builtins that allocate or touch GC pointers require an active `Mutation` handle.
- Any heap pointer store must call `gc_write_barrier` (stubbed in v0).

## Notes
- Keep builtins minimal at first.
- Avoid direct syscalls in frontend; centralize in runtime.
- `panic` should abort the current JIT call and return an error to the host wrapper.
