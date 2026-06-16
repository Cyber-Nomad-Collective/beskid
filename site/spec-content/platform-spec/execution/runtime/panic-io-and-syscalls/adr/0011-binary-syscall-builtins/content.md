---
title: Binary syscall builtins
description: syscall_read_bytes and syscall_write_bytes for u8[] I/O.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-EXEC-RT-0011
adrStatus: Accepted
adrDate: 2026-06-06
lastReviewed: 2026-06-06
---

## Decision

Add `syscall_read_bytes` / `syscall_write_bytes` alongside existing string syscalls. Do not change existing `syscall_read` / `syscall_write` signatures.

## Verification anchors

`compiler/crates/beskid_runtime/src/builtins/panic_io.rs`, `beskid_abi/src/builtins.rs`
