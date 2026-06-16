---
title: Channel runtime delivery semantics
description: Multi-receiver/sender rules and close behavior.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-CONC-0009
adrStatus: Accepted
adrDate: 2025-08-01
lastReviewed: 2026-05-22
---

## Context

Authors need defined fan-in/fan-out and close idempotence.

## Decision

| Rule | Detail |
| --- | --- |
| Receivers | Multiple allowed; each message delivered to **exactly one** successful **Receive** (FIFO) |
| Senders | Multiple allowed unless **SingleWriter** hint (hint only v1) |
| Close | Any handle holder may **Close**; idempotent writer shutdown |
| void spawn | `` `Fiber<Unit>` `` when entry returns no value |

## Consequences

Close after drain returns `ChannelError::Closed` in `Result`.

## Verification anchors

Runtime concurrency.rs; corelib channel tests.
