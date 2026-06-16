---
title: Canonical parse-to-lowering phase DAG
description: Pipeline ordering was fragmented across crates before
  `beskid_pipeline` phase ids.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-BUILD-0018
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Reference compiler **must** emit stable `beskid_pipeline` phase events from parse through `lower.ready` without reordering semantic gates relative to mod boundaries.

## Decision

Phase literals are defined in `compiler/crates/beskid_pipeline/src/phases.rs` and asserted by conformance tests; CLI/LSP observers rely on the same ids.

## Consequences

Reordering phases requires an ADR and registry updates.

## Verification anchors

- `compiler/crates/beskid_pipeline/`
- `compiler/crates/beskid_analysis/src/services/`.
