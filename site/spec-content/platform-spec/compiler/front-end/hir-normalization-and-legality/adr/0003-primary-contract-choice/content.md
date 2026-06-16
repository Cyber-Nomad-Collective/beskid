---
title: Primary contract for HIR normalization and legality
description: This feature hub defines the normative contract for **hir
  normalization and legality** and links newcomer-oriented refer
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-FRONT-0009
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

This feature hub defines the normative contract for **hir normalization and legality** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement HIR normalization and legality as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs`
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/definitions.rs`
