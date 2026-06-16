---
title: Lossy color downgrade
description: RGB downgrades through palette ladders automatically.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TERM-0022
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Callers should not manually pick CSI color modes per terminal.

## Decision

| Rule | Detail |
| --- | --- |
| Downgrade | RGB → indexed → basic is **lossy** |
| API | No per-sequence model selector on public helpers |

## Consequences

Styled output remains readable on Basic16 hosts without author branches.

## Verification anchors

`AnsiSgrGoldenTests.bd`; capability + SGR integration.
