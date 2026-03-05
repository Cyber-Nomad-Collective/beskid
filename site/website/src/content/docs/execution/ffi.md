---
title: "FFI and C ABI specification"
description: FFI and C ABI specification
---


## Decision summary
- External calls use **C ABI**.
- FFI boundary types are restricted to primitives and explicit layout structs.

## Allowed FFI types (v0.1)
- `i64`, `f64`, `bool` (as `i8`), `ptr`, `unit`.
- `string` passed as `{ptr, len}`.
- `array` passed as `{ptr, len, cap}`.

## Ownership rules
- External functions do not take ownership of GC-managed pointers unless documented.
- Passing GC-managed pointers requires them to be pinned or protected during the call.

## ABI mapping
- Use Cranelift default calling convention for target ISA.
- All FFI function signatures declared via `cranelift_module::Module::declare_function`.

## Notes
- FFI is optional in v0.1; standard library can wrap FFI when needed.
