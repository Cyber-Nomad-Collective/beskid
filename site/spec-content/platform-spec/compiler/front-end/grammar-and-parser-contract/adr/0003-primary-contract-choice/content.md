---
title: Primary contract for Grammar and parser contract
description: This feature hub defines the normative contract for **grammar and
  parser contract** and links newcomer-oriented referenc
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-FRONT-0006
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

This feature hub defines the normative contract for **grammar and parser contract** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement Grammar and parser contract as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/beskid.pest`
- `compiler/crates/beskid_analysis/src/syntax/`
- `compiler/crates/beskid_analysis/src/syntax/items/parse_helpers.rs`
