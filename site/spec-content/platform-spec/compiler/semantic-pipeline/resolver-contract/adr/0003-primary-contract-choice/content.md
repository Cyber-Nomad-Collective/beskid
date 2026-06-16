---
title: Primary contract for Resolver contract
description: This feature hub defines the normative contract for **resolver
  contract** and links newcomer-oriented reference articles
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-SEM-0006
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

This feature hub defines the normative contract for **resolver contract** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement Resolver contract as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/resolve/resolver.rs`
- `compiler/crates/beskid_analysis/src/resolve/items.rs`
- `compiler/crates/beskid_tests/src/analysis/resolve.rs`
