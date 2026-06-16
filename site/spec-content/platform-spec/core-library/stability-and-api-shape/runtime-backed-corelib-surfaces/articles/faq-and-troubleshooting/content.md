---
title: FAQ and troubleshooting
description: FAQ for runtime-backed corelib surfaces.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Link error for missing builtin symbol

Rebuild with matching `beskid` and runtime objects; verify `BESKID_RUNTIME_ABI_VERSION` alignment between CLI and cached AOT artifacts.

## I/O works in JIT but not AOT

Confirm AOT link includes `beskid_runtime` with the same feature set (e.g., platform I/O stubs).

## Should I add syscalls to `IO.bd`?

No—split across `Core.Input` / `Core.Output` / `Core.Error` and keep ANSI in `corelib_console`.

## Where is the authoritative builtin list?

`compiler/crates/beskid_abi/src/builtins.rs` plus re-exports in `beskid_runtime/src/builtins/mod.rs`.

## Doc drift vs implementation

Update Beskid sources and `compiler/corelib/beskid_corelib/docs/` together; run `beskid doc` before publishing packages with API browser content.
