---
title: Primary contract for Codegen artifact schema
description: This feature hub defines the normative contract for **codegen
  artifact schema** and links newcomer-oriented reference ar
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-IR-0003
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

This feature hub defines the normative contract for **codegen artifact schema** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement Codegen artifact schema as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_engine/src/jit_module.rs`
- `compiler/crates/beskid_tests/src/runtime/jit.rs`
- `compiler/crates/beskid_tests/src/abi/contracts.rs`
