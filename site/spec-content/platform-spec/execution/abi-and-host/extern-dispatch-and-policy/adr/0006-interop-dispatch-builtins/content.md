---
title: Runtime interop_dispatch builtins for tagged values
description: Compiler thunks call stable dispatch entrypoints for
  language/runtime interop layouts.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-EXEC-ABI-0006
adrStatus: Accepted
adrDate: 2026-03-01
lastReviewed: 2026-05-22
---

## Context

Tagged interop values need runtime-known layout offsets. Per-site custom trampolines would fork ABI stability.

## Decision

| Builtin family | Role |
| --- | --- |
| `interop_dispatch_unit` | Unit-tagged dispatch |
| `interop_dispatch_ptr` | Pointer payloads |
| `interop_dispatch_usize` | Scalar bridge |
| Layout stability | Offsets are versioned with [ABI versioning](../abi-versioning-and-compatibility/) |
| Implementation | `beskid_runtime::interop` exports registered in `BUILTIN_SPECS` |

Lowering **must** route approved tagged calls through these builtins rather than ad-hoc host calls.

## Consequences

Interop layout changes require ABI bump or additive symbol policy per **D-EXEC-ABI-0002**.

## Verification anchors

`compiler/crates/beskid_runtime/src/interop/`; interop lowering tests.
