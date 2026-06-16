---
title: Core.Threading is the OS-thread surface
description: Preemptive threads use Core.Threading exclusively in corelib.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-SYST-0001
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Cooperative and preemptive concurrency need distinct entry points.

## Decision

| Rule | Detail |
| --- | --- |
| API | `Core.Threading` is the only supported **preemptive** OS-thread module |
| Fibers | Cooperative APIs stay in the concurrency package |

## Consequences

User code must not implement fibers atop `Thread.Spawn`.

## Verification anchors

`packages/foundation/src/Core/Threading/` sources; runtime syscall docs.
