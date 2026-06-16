---
title: Fiber stack initial size and cap
description: Growable stacks with documented overflow behavior at Join.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-EXEC-RT-0002
adrStatus: Accepted
adrDate: 2025-09-01
lastReviewed: 2026-05-22
---

## Context

Fiber stacks must balance memory use against deep call chains from generated code and corelib. GC needs precise stack maps at safepoints on every fiber stack.

## Decision

| Parameter | Value |
| --- | --- |
| Initial size | **64 KiB** per fiber |
| Growth | Growable until cap |
| Maximum | **8 MiB** cap per fiber |
| Overflow | `FiberError::StackOverflow` at **Join** — no undefined behavior |
| Switching | Callee stacks ABI-aligned; callee-saved registers saved per platform ABI |
| GC | All fiber stacks enumerable at safepoints via compiler stack maps |

## Consequences

Documentation and corelib **must** cite these limits. Stack switching may use manual swap techniques documented in [design model](../design-model/).

## Verification anchors

Scheduler stack allocator; fiber spawn/join integration tests.
