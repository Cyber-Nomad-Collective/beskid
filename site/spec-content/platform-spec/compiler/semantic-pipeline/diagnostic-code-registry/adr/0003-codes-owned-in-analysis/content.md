---
title: Diagnostic codes owned in analysis sources
description: Rendered diagnostics drifted from semantic registry.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-SEM-0003
adrStatus: Accepted
adrDate: 2026-05-11
lastReviewed: 2026-05-22
---

## Context

Rendered diagnostics drifted from semantic registry.

## Decision

Code-to-meaning mapping is normative in `SemanticIssueKind::code()` and `diagnostic_kinds.rs`, synchronized with trudoc verify scripts—not LSP presentation layers.

## Consequences

Renaming codes requires migration notes; new issues need unique codes before release.

## Verification anchors

- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- `packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs`.
