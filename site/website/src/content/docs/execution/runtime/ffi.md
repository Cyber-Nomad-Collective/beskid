---
title: "FFI and C ABI specification"
description: Runtime lowering notes for v0.3 FFI; pairs with language-meta interop platform-spec.
---

## Decision summary

- User foreign calls use the **C ABI profile** ([platform-spec](/platform-spec/language-meta/interop/c-abi-profile/)).
- **Link-time** resolution is the **Standard** path; runtime `dlopen` is **Proposed** only ([dynamic resolution profile](/platform-spec/language-meta/interop/c-abi-profile/dynamic-resolution-profile/)).
- **Runtime builtin** FFI is separate from **user `Extern`** ([Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/)).

## Ownership split

| Topic | Canonical platform-spec |
| --- | --- |
| Language `Extern` / `Export` | [FFI and extern](/platform-spec/language-meta/interop/ffi-and-extern/), [Export and callbacks](/platform-spec/language-meta/interop/export-and-callbacks/) |
| Abstract vocabulary | [Interop.Contracts](/platform-spec/language-meta/interop/interop-contracts/) |
| C types, linking, platforms | [C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/) |
| Manifest + CLI libraries | [Foreign library import](/platform-spec/tooling/foreign-library-import/) |
| This page | Cranelift lowering and runtime call-boundary behavior |

## Allowed FFI types (v0.3.0 user extern)

- Scalars: `bool` as `i8`, `u8`, `i32`, `i64`, `f64`, `unit`.
- **Interop views:** `CStringView`, `CBuffer`, `CArrayView` ([interop view types](/platform-spec/language-meta/interop/c-abi-profile/interop-view-types/)).
- Legacy: `ref u8` (prefer views).

**Not allowed on user extern in v0.3.0:** Beskid GC `string`, `T[]`, and arbitrary records. **`CLayout` structs** are v0.3.1 (Proposed). Nested complex types are deferred until basic FFI ships.

Embedding layouts `BeskidStr` / `BeskidArray` remain in `compiler/crates/beskid_abi/src/types.rs` for **runtime builtins**, not user-authored `Extern` signatures.

## Ownership rules

- External functions do not take ownership of GC-managed pointers unless documented.
- **Borrow** is the default parameter class; **`Transfer`** is opt-in per method.
- Foreign calls are **safepoints** for the active GC policy.

## ABI mapping

- Use Cranelift **System V** for tier-1 AMD64 user extern calls.
- Validate lowered signatures: pointer, `i64`, `i32`, `i8`, `f64` only (`validate_ffi_signature` in `beskid_codegen`).
- JIT and AOT **must** use the same signature surface for a given artifact.

## Runtime boundary rules

- Builtin imports use `beskid_abi::BUILTIN_SPECS` — not user `Extern`.
- Syscall/platform policy is not bypassed by user FFI.
- Adaptation shims belong in **corelib** / runtime, not semantic analysis.

## Dynamic resolution (non-default)

Legacy JIT **`extern_dlopen`** behavior is documented in [extern-policy-v0-1](/execution/runtime/extern-policy-v0-1/) and superseded for new work by [dynamic resolution profile](/platform-spec/language-meta/interop/c-abi-profile/dynamic-resolution-profile/).

## Non-goals

- Defining full `Extern` / `Export` attribute syntax (see language-meta interop).
- WinAPI as stdlib tier-1 ([platform tier matrix](/platform-spec/language-meta/interop/c-abi-profile/platform-tier-matrix/)).
- Automatic C header import (future tooling / mods).
