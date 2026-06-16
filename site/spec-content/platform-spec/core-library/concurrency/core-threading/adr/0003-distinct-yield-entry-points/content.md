---
title: Distinct Thread.Yield and Concurrency.Yield
description: OS yield and fiber yield are separate APIs.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-SYST-0003
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Kernel scheduling differs from cooperative fiber reschedule.

## Decision

| Rule | Detail |
| --- | --- |
| `Thread.Yield` | OS-level yield |
| `Concurrency.Yield` | `fiber_yield` cooperative reschedule |

## Consequences

Names and docs must not alias the two yields.

## Verification anchors

Runtime tests distinguishing syscall vs fiber_yield.
