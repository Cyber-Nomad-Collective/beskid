---
title: Capability gating strips ANSI
description: Styled emission must respect ShouldEmitAnsi and non-TTY hosts.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TERM-0002
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Programs must not leak escapes to pipes, log files, or NO_COLOR environments.

## Decision

| Rule | Detail |
| --- | --- |
| Gating | User-visible styled output **must** pass `Ansi.Escape.WhenEnabled` |
| Tests | Ungated `Csi` remains for golden tests |

## Consequences

When `ShouldEmitAnsi()` is false, gated builders return empty strings.

## Verification anchors

`AnsiEscapeTests.bd`; console capability integration.
