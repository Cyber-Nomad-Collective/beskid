---
title: Mutex TryLock and Lock cancellation
description: Mutex API for v1 coordination.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-CONC-0012
adrStatus: Accepted
adrDate: 2025-08-01
lastReviewed: 2026-05-22
---

## Context

TryLock supports non-blocking attempts; Lock parks with cancel path.

## Decision

| Rule | Detail |
| --- | --- |
| TryLock | **In v1** — returns `` `Option<MutexGuard>` `` |
| Lock | Parks until acquired or **Cancelled** |

## Consequences

No poison semantics in v1.

## Verification anchors

Mutex corelib tests.
