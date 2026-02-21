---
description: Runtime builtins and host functions
---

# Runtime builtins and host functions

## Purpose
Provide foundational operations (alloc, string/array ops, IO) implemented in host code and called from CLIF.

## Typical builtin set
- `alloc(size) -> ptr`
- `str_new(ptr, len) -> {ptr, len}`
- `str_len(str) -> i64`
- `array_new(elem_size, len) -> {ptr, len, cap}`
- `panic(msg_ptr, msg_len) -> never`

## Integration strategy
- Declare builtins via `Module::declare_function`.
- Import them in CLIF with `declare_func_in_func`.
- Call builtins from lowered HIR nodes.

## Notes
- Keep builtins minimal at first.
- Avoid direct syscalls in frontend; centralize in runtime.
