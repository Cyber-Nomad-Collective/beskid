---
title: u8 array canonical buffer
description: Core.Bytes uses u8[] backed by BeskidArray.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-PRIM-0010
adrStatus: Accepted
adrDate: 2026-06-06
lastReviewed: 2026-06-06
---

## Decision

`u8[]` with `__array_new(1, len)` is the canonical byte buffer. No separate `Bytes` heap type in v1.

## Verification anchors

`Core.Bytes.Slice.New`, `compiler/crates/beskid_runtime/src/builtins/arrays.rs`
