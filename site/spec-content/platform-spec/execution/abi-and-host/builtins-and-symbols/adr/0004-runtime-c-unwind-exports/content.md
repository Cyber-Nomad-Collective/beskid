---
title: Runtime builtins use C-unwind exports
description: no_mangle extern C-unwind symbols implement the stable host surface.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-EXEC-ABI-0004
adrStatus: Accepted
adrDate: 2025-10-15
lastReviewed: 2026-05-22
---

## Context

Generated code calls runtime entrypoints across JIT relink and AOT link. Rust panics across the boundary must use the platform unwind ABI expected by Cranelift `call` sites.

## Decision

| Rule | Detail |
| --- | --- |
| Export attribute | Implementations use `#[unsafe(no_mangle)] pub extern "C-unwind"` in `beskid_runtime::builtins` |
| Registry | `RUNTIME_EXPORT_SYMBOLS` lists every export the linker/JIT registers |
| Layout types | `BeskidStr` `{ ptr, len }` and `BeskidArray` `{ ptr, len, cap }` are normative payload headers |
| Families | Allocation, GC, fibers, channels, interop dispatch, IO, and `panic` share one catalog |

## Consequences

Host tooling resolves imports by symbol name + `BUILTIN_SPECS` signature, not Rust mangling.

## Verification anchors

`compiler/crates/beskid_runtime/src/builtins/mod.rs`; `compiler/crates/beskid_runtime/src/lib.rs` re-exports.
