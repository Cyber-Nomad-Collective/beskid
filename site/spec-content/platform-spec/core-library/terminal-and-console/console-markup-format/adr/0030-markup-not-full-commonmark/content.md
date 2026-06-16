---
title: Markup is not full CommonMark
description: Only the tested markup subset is normative.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TERM-0030
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Console.Format targets terminal styling, not a document renderer.

## Decision

| Rule | Detail |
| --- | --- |
| Scope | Tested sigils and markdown subset only |
| Non-goal | Full CommonMark compliance |

## Consequences

New syntax requires tests before Standard promotion.

## Verification anchors

`FormatMarkdownTests.bd`; `Format/Scan.bd`.
