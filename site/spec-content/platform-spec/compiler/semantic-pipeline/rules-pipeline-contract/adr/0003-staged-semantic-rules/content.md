---
title: Staged semantic rules pipeline
description: Monolithic semantic passes blocked incremental invalidation.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-SEM-0012
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Monolithic semantic passes blocked incremental invalidation.

## Decision

Semantic rules are grouped in `analysis/rules/staged/` with explicit stage boundaries wired through `services.rs` for CLI and LSP.

## Consequences

New rules declare their stage; cross-stage dependencies are documented in the hub articles.

## Verification anchors

- `compiler/crates/beskid_analysis/src/analysis/rules/`.
