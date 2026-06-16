---
title: Human-readable {{ }} placeholders
description: Use {{symbolId}} delimiters in template text
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-TOOL-SCAFF-0002
adrStatus: Accepted
adrDate: 2026-05-21
lastReviewed: 2026-05-22
---

## Context

Template authors need delimiter syntax distinct from Beskid source.

## Decision

Text files **must** use **`{{symbolName}}`** placeholders; optional **`sourceName`** rewriting applies to paths and identifiers.

## Consequences

Editors can highlight unmatched braces; substitution tests stay deterministic.

## Verification anchors

Golden substitution tests under planned `beskid_tests` template fixtures.
