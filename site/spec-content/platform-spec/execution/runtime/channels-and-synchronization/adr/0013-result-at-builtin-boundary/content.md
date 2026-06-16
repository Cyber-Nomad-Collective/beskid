---
title: Channel builtins return Result not panic
description: Closed, full, and cancelled operations surface as Result/Option at
  the FFI boundary.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-EXEC-RT-0013
adrStatus: Accepted
adrDate: 2025-09-01
lastReviewed: 2026-05-22
---

## Context

Panicking on backpressure or closed channels makes cooperative code fragile and inconsistent with corelib `Result` types.

## Decision

| Operation | Runtime behavior |
| --- | --- |
| **Send** after **Close** | `Closed` in **Result** |
| **Receive** on closed empty | `Closed` |
| **TrySend** / **TryReceive** | `Option` for full/empty |
| **Cancel** | Parked ops wake with `Cancelled` after child `OnCancelled` |
| **Join** on cancelled child | `FiberError::Cancelled` |
| Panic | **Forbidden** for ordinary channel/hub/mutex errors |

Aligns with [D-CORE-CONC-0005](/platform-spec/core-library/concurrency/concurrency-package/adr/0005-result-not-panic-errors/).

## Consequences

Builtin implementations and corelib wrappers **must** share error enums. Duplicate **Close** is idempotent-safe.

## Verification anchors

[Contracts and edge cases](../contracts-and-edge-cases/); concurrency runtime tests.
