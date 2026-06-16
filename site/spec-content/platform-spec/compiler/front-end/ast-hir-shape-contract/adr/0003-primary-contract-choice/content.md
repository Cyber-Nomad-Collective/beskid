---
title: Primary contract for AST and HIR shape contract
description: This feature hub defines the normative contract for **ast and hir
  shape contract** and links newcomer-oriented reference
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-FRONT-0003
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

This feature hub defines the normative contract for **ast and hir shape contract** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement AST and HIR shape contract as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/syntax/items/`
- `compiler/crates/beskid_analysis/src/resolve/items.rs`
- `compiler/crates/beskid_analysis/src/analysis/`
