---
title: Single pest grammar surface
description: Multiple parser entrypoints caused span drift.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-FRONT-0012
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Multiple parser entrypoints caused span drift.

## Decision

`beskid.pest` and `beskid_analysis::parsing` are the authoritative parse surface; AST contracts derive spans from this pipeline only.

## Consequences

Alternate parsers must not ship without an ADR and conformance fixtures.

## Verification anchors

- `compiler/crates/beskid_analysis/src/beskid.pest`
- `compiler/crates/beskid_analysis/src/parsing`.
