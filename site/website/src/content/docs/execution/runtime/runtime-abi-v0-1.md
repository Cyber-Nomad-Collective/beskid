---
title: "Runtime ABI (v0.1)"
description: Stable runtime symbols and contracts for v0.1.
---

Scope
- Stable symbols required by the JIT/backend to execute lowered Beskid programs
- Source of truth for names: compiler/crates/beskid_abi/src/symbols.rs
- Platform: Linux x86_64; pointer size = 64-bit

Symbols (selected)
- Allocation/GC hooks: alloc, gc_write_barrier, gc_root_handle, gc_unroot_handle, gc_register_root, gc_unregister_root
- Strings: str_new, str_len, str_concat
- Arrays: array_new (header-only by default; optional backing behind runtime feature `arrays_backing`)
- Events: event_subscribe, event_unsubscribe_first, event_len, event_get_handler
- IO/panic: sys_print, sys_println, panic, panic_str
- Interop: interop_dispatch_unit, interop_dispatch_ptr, interop_dispatch_usize
- Version: beskid_runtime_abi_version

String representation
- BeskidStr { ptr: *mut u8, len: usize } — immutable UTF-8; NUL allowed; length in bytes
- str_concat: allocates fresh buffer and header; traps on allocation failure or null handles

Events model
- Bounded storage allocated on first subscribe
- Duplicates allowed in v0.1; unsubscribe removes the first match; iteration is insertion order
- Owner-only invocation (enforced in typing rules; runtime provides helpers only)

Interop object layout (v0.1)
- Tag (discriminant) at offset +8 from header base
- Payload field at +16 for the current variants used by dispatch_table
- These offsets are stable in v0.1 and referenced by engine/runtime code; see interop_layout.rs

Extern policy (overview)
- See Extern policy (v0.1) page for dynamic linking rules, feature flag, and allowed FFI kinds

Notes
- No user-object GC tracing in v0.1: allocations are pinned via runtime root; gc_write_barrier is a no-op
- Future milestones may extend the ABI; additions will be documented and versioned

