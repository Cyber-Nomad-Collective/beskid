---
title: "FFI and C ABI specification"
description: FFI and C ABI specification
---


## Decision summary
- External calls use **C ABI**.
- FFI boundary types are restricted to primitives and explicit layout structs.

## Ownership split
- Language-level extern syntax and type diagnostics are defined in `docs/spec/ffi-and-extern.md`.
- This document defines runtime-side ABI mapping and call-boundary behavior.

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

## Runtime boundary rules
- JIT and AOT must bind extern calls through the same ABI-compatible signature surface.
- FFI behavior must not bypass runtime ownership for syscall/platform policy.
- FFI adaptation logic belongs in runtime and standard library layers, not semantic analysis.

## Notes
- FFI is optional in v0.1; standard library can wrap FFI when needed.

## Non-goals
- Defining language-level `Extern` attribute syntax.
- Defining backend packaging/link orchestration policy.
