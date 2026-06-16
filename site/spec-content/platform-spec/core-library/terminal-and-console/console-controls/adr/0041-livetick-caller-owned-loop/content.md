---
title: LiveTick caller-owned redraw loop
description: Periodic redraw uses LiveTick; callers own fiber/channel loops.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TERM-0041
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Corelib should not embed a full UI framework inside controls.

## Decision

| Rule | Detail |
| --- | --- |
| Tick | `LiveTick` drives periodic redraw |
| Loop | Callers compose fibers/channels around tick |

## Consequences

Interactive samples pair LiveTick with concurrency package channels.

## Verification anchors

Console controls examples and tests.
