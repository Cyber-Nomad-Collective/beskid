---
title: Scheduler and stack defaults
description: Processor count, stack sizes, and phase A arena policy.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-CONC-0008
adrStatus: Accepted
adrDate: 2025-08-01
lastReviewed: 2026-05-22
---

## Context

Hosts need predictable defaults without per-program scheduler tuning.

## Decision

| Setting | Default |
| --- | --- |
| `ProcessorCount` | Host logical CPU count at init |
| Stacks | 64 KiB initial, 8 MiB max |
| Arena | Phase A: **one process arena**; pool threads run Beskid mutator code under scheduler rules |

## Consequences

Fiber scheduler design model article details syscall parking.

## Verification anchors

[Fiber scheduler and stacks](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/).
