---
title: Handler registration before user init
description: Corelib registers dispatch handlers before user static
  initialization in AOT and JIT.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-EXEC-ABI-0008
adrStatus: Accepted
adrDate: 2026-06-06
lastReviewed: 2026-06-06
---

## Context

v3 soft ops resolve through a handler table populated at process start. If user static initializers run before registration, dispatch calls observe empty or bootstrap-only tables.

## Decision

| Host | Rule |
| --- | --- |
| **AOT** | Emitted `runtime_init` **must** call corelib handler registration **before** user `main` and before user static init |
| **JIT** | Engine session **must** invoke registration once per process before executing user code |
| **Corelib** | `Runtime.Init` **must** call `beskid_register_handlers(version, table, count)` with manifest-aligned tags |
| **Version gate** | Registration **must** reject mismatched handler-table version bands (same policy as `beskid_register_callbacks`) |
| **Bootstrap** | Kernel exports may install static handlers for tags required before corelib init; corelib registration **must** supersede or complete the table |

User code **must not** rely on soft dispatch builtins before registration completes.

## Consequences

Codegen and link hosts emit an explicit init hook. Conformance tests assert handler registration precedes first soft dispatch from user code.

## Verification anchors

`compiler/crates/beskid_aot/src/run.rs`; `compiler/crates/beskid_engine/src/engine.rs`; `compiler/corelib/packages/runtime/src/Runtime/Init.bd`; `compiler/crates/beskid_runtime/src/interop/register.rs`.
