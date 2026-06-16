---
title: Channel vs OnResize delivery
description: Cross-fiber resize uses Channel; same-fiber uses OnResize hub.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TERM-0050
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Resize notifications must integrate with fiber concurrency without OS-thread callbacks.

## Decision

| Rule | Detail |
| --- | --- |
| Cross-fiber | `PollResize` → `` `Channel<ConsoleMessage>` `` |
| Same-fiber | `OnResize` event hub |

## Consequences

No separate OS-thread callback API in v1.

## Verification anchors

`ConsoleMessageChannelTests.bd`.
