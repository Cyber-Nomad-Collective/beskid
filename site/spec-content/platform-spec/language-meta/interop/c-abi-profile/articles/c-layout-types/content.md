---
title: C ABI profile — C layout types (v0.3.1)
description: repr(C) records for FFI after interop views ship; nested complex
  types deferred.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-05-20
---

> **Status: Proposed (v0.3.1)** — Normative text is stable for planning; reference compiler support **must** trail **[interop view types](./interop-view-types/)** (v0.3.0 Standard).

## Delivery order

1. **v0.3.0 Standard** — interop views, link-time import, export/callback registration.
2. **v0.3.1** — **`CLayout`** on Beskid `type` declarations for FFI-by-value structs with **primitive fields only**.
3. **Later** — nested records, enums with defined representation, arrays inside FFI structs, and WinAPI-specific calling conventions (not stdlib tier-1).

## `CLayout` attribute (planned)

```beskid
[CLayout(Align: 4)]
pub type WinSize {
    i32 ws_row,
    i32 ws_col,
    i32 ws_xpixel,
    i32 ws_ypixel,
}
```

| Rule | v0.3.1 |
| --- | --- |
| Field types | Primitives and other `CLayout` types only |
| Beskid `string` / `T[]` inside struct | **Forbidden** |
| Enums | **Forbidden** until discriminant/size rules exist |
| Alignment / pack | Explicit `Align` / `Pack`; default platform C rules |

## Complex types (explicitly later)

The platform **will** specify nested FFI structs, fixed-size array fields, and enum ABI **after** basic FFI (views + link + export) is implemented and covered by conformance tests. Until then, authors **must** use interop views, pointers as opaque `i64`, or thin C shims.

## Stdlib note

**WinAPI** and **stdcall** layouts are **out of scope** for standard library tier-1 packages. Windows-focused mappings may appear in optional platform packages under **Proposed** profiles, not as corelib **Standard** requirements.
