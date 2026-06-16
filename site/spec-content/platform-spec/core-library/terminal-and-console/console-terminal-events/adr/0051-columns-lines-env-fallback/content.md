---
title: COLUMNS/LINES env fallback
description: Env size parsing is best-effort discrete table in v1.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TERM-0051
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Not all hosts expose Winsize ioctl; env vars are a portable fallback.

## Decision

| Rule | Detail |
| --- | --- |
| Order | Winsize ioctl then `COLUMNS`/`LINES` |
| Parse | Discrete table, not full integer grammar in v1 |

## Consequences

Odd env values may clamp or ignore per contracts article.

## Verification anchors

`Platform/Terminal.bd` tests.
