---
title: Channel and fiber errors use Result not panic
description: Error surfaces for channel, fiber join, and mutex operations.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-CONC-0005
adrStatus: Accepted
adrDate: 2025-08-01
lastReviewed: 2026-05-22
---

## Context

Panics as control flow for expected failure modes break contracts and LSP stability.

## Decision

| Surface | Rule |
| --- | --- |
| Channel | **Send** / **Receive** → `Result`; **TrySend** / **TryReceive** → `Option` |
| Fiber | **Join** → `` `Result<T, FiberError>` ``; stack overflow → ``FiberError::StackOverflow`` at **Join** |
| Mutex | **Lock** → `` `Result<MutexGuard, MutexError>` ``; **TryLock** → ``Option`` (``None`` = would block) |

## Consequences

v1: **Lock** may return `Cancelled` when fiber cancelled—no .NET-style poison.

## Verification anchors

Corelib API signatures; runtime integration tests.
