---
description: Runtime builtins and host functions
---

# Runtime builtins and host functions

## Purpose
Provide foundational operations (alloc, string/array ops, IO) implemented in host code and called from CLIF.

## Typical builtin set
- `alloc(size, type_desc_ptr) -> ptr`
- `str_new(ptr, len) -> {ptr, len}`
- `str_len(str) -> i64`
- `array_new(elem_size, len) -> {ptr, len, cap}`
- `panic(msg_ptr, msg_len) -> never`

## GC scaffolding hooks
- `gc_register_root(ptr_addr) -> void`
- `gc_unregister_root(ptr_addr) -> void`
- `gc_write_barrier(dst_obj, value_ptr) -> void`
- `gc_root_handle(value_ptr) -> u64`
- `gc_unroot_handle(handle: u64) -> void`

**Handle semantics**
- Handles are opaque indices into the runtime root handle table (v0).
- Future implementation may back handles with `DynamicRootSet`.
- Host code must call `gc_unroot_handle` when the value is no longer needed.

## Integration strategy
- Declare builtins via `Module::declare_function`.
- Import them in CLIF with `declare_func_in_func`.
- Call builtins from lowered HIR nodes.
- Builtins that allocate or touch GC pointers require an active `Mutation` handle.
- Any heap pointer store must call `gc_write_barrier` (stubbed in v0).

## Notes
- Keep builtins minimal at first.
- Avoid direct syscalls in frontend; centralize in runtime.
- `panic` should abort the current JIT call and return an error to the host wrapper.
