---
title: C ABI profile — Types and call conventions
description: Permitted C ABI representations for Beskid extern contract
  parameters and returns in the reference compiler.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-01
---

## Calling convention

For user **`contract`** calls lowered through the reference compiler path, parameters and returns are prepared for **System V AMD64** when targeting that platform. This matches the explicit `CallConv::SystemV` selection in the contract call lowering implementation.

Other targets must document their own mapping in a future revision of this article; until then, only the documented tier-1 mapping is normative for **Standard** conformance claims.

## Permitted value shapes (v0.3.0)

The C ABI profile instantiates **[Interop.Contracts](/platform-spec/language-meta/interop/interop-contracts/)** as follows:

- **Scalar** — `bool` as **`i8`**, `u8`, `i32`, `i64`, `f64`, `unit`.
- **Interop views** — **`CStringView`**, **`CBuffer`**, **`CArrayView`** per **[interop view types](/platform-spec/language-meta/interop/c-abi-profile/interop-view-types/)**.
- **Opaque handle** — pointer-sized slot or `i64` where documented.
- **`ref u8`** — narrow legacy slice start; prefer **`CBuffer`**.

Beskid **`string`** and **`T[]`** GC values **must not** appear on user `Extern` signatures in v0.3.0 Standard.

**`CLayout` structs** (primitive fields only) are **v0.3.1** — **[C layout types](/platform-spec/language-meta/interop/c-abi-profile/c-layout-types/)**. Nested complex types are **deferred** until basic FFI is implemented.

Types with unstable Beskid-only layout **must not** cross the boundary without an adapter or shim.

## Cranelift note

Beskid user code and bridge code are lowered with **Cranelift**; foreign libraries need only expose **C ABI** entrypoints compatible with the emitted calls. See also `/execution/runtime/ffi/` for additional lowering narrative.
