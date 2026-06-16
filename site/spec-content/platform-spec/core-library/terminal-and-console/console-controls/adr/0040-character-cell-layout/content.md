---
title: Character-cell layout only
description: Console controls operate on cell grid, not pixels.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TERM-0040
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Terminal UI in corelib targets TTY character grids.

## Decision

| Rule | Detail |
| --- | --- |
| Coordinates | Rows/columns in character cells |
| Graphics | Pixel graphics are out of scope |

## Consequences

Layout helpers align with `Console.ConsoleSize` and resize events.

## Verification anchors

Console control tests under `packages/console`.
