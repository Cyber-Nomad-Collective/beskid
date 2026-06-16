---
title: Hub WaitReceive uses round-robin fairness
description: Fair multiplexing across registered channels when multiple receives are ready.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-CONC-0003
adrStatus: Accepted
adrDate: 2025-08-01
lastReviewed: 2026-05-22
---

## Context

FIFO registration order starves late channels when an early channel is always ready.

## Decision

| Rule | Detail |
| --- | --- |
| Algorithm | **Round-robin** among channels with a ready **Receive** |
| Cursor | Per-`Hub` index advanced after each successful **WaitReceive** |
| v1 scope | **WaitReceive** only — no **WaitSend** |

## Consequences

Console hubs should keep registration count small (under 16 typical).

## Verification anchors

Hub integration tests in runtime and corelib suites.
