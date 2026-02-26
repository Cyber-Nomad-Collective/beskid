---
description: Runtime and ABI design
---

# Runtime and ABI design

## Purpose
Define how values are represented and how functions exchange values between Beskid and Cranelift.

## Core decisions
- **Calling convention**: use Cranelift default for target ISA.
- **Value types**: map to Cranelift types (`i64`, `f64`, `b1`, `ptr`).
- **Aggregate types**: pass by pointer (no runtime handles).

## Heap object layout (v0)
- **Header**: single `type_desc_ptr` at offset 0 (no extra flags for v0).
- **Payload**: fields or enum payload follow header, aligned per descriptor.
- **Enum tag**: first field in payload, stored as `i32` at payload offset 0.

## ABI rules
- Decide struct layout and alignment.
- **Strings**: UTF-8 `{ptr, len}`.
- **Arrays**: `{ptr, len, cap}`.
- Define error signaling (return codes, tagged results, or runtime traps).
- **Chars**: Unicode scalar (`u32`), lowered as `i32`/`u32` in CLIF.

## Type descriptor encoding (v0)
```
#[repr(C)]
struct TypeDescriptor {
    size: usize,
    align: usize,
    ptr_count: u32,
    ptr_offsets: *const usize,
    name: *const u8,
}
```
- `ptr_offsets` is a static array of byte offsets from the object base.
- `name` is optional (null for anonymous types).

## Aggregate passing rules
- Primitives by value.
- Struct/enum values by pointer to heap object.
- Match lowering reads enum tag and branches; payload fields are loaded by offset.
- Parameter modifiers (`ref`/`out`) are rejected in lowering for now.

## gc-arena constraints
- Allocation and pointer access happen inside `Arena::mutate` with a `Mutation` handle.
- GC pointers must not escape the mutation callback; values crossing the host boundary must be rooted in the arena root object.

## Root object schema (v0)
- Root stores globals, dynamic roots, and runtime state needed across calls.
- Host-facing values are stored as handles into a `DynamicRootSet`.
- See `docs/execution/10-runtime-gc.md` for runtime integration lifecycle and host boundary rules.

## Write barriers
- Any store of a heap pointer into another heap object must call a write-barrier stub.
- The stub is a no-op until GC is enabled.

## References
- Module signatures: https://docs.rs/cranelift-module/latest/cranelift_module/trait.Module.html
- System V ABI (for reference): https://wiki.osdev.org/System_V_ABI
- x86 calling conventions: https://en.wikipedia.org/wiki/X86_calling_conventions
