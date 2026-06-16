---
title: Silent resize Send failure
description: Failed resize Channel Send is silent in v1 poll loops.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TERM-0052
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

UI loops should not crash when consumers drop resize messages.

## Decision

| Rule | Detail |
| --- | --- |
| EVT-002 | Failed `Send` on resize is **silent** in v1 |
| Future | May gain diagnostics in a later ADR |

## Consequences

Poll loops continue after dropped resize notifications.

## Verification anchors

`ConsoleMessageChannelTests.bd`; EVT-002 traceability.
