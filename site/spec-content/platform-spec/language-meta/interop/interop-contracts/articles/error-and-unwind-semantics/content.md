---
title: Interop.Contracts — Error and unwind semantics
description: Divergence, traps, and cross-boundary panic policy for FFI (v0.3).
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

## Return-shape classes

| Shape | Foreign expectation | Beskid mapping |
| --- | --- | --- |
| **Value** | Normal C return | Primitive or interop view per profile |
| **Unit** | `void` | No return value |
| **Never** | Does not return | `Never` → trap/unwind per profile |

## Errors as values

Beskid **`Result`** types **must not** appear on FFI boundaries in v0.3.0. Authors map foreign error codes to Beskid `Result` **after** the call returns.

## Panics and unwinding

Across **user FFI** and **export** boundaries in v0.3 Standard:

- Beskid panic **must not** rely on foreign callers catching Rust/Beskid unwinds.
- The default policy is **abort or trap** at the boundary.
- Runtime syscalls and selected runtime exports may use **`extern "C-unwind"`** internally; that class is **not** implied for user `Extern` or `[Export]` without an explicit future profile.

## Foreign errors

Foreign functions that communicate failure via return codes or `errno` remain the caller’s responsibility to translate; the platform does not inject automatic `errno` threading in v0.3.
