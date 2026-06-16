---
title: Primary contract for Build and run orchestration
description: This feature hub defines the normative contract for **build and run
  orchestration** and links newcomer-oriented referenc
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-BUILD-0006
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

This feature hub defines the normative contract for **build and run orchestration** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement Build and run orchestration as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_cli/src/commands/`
- `compiler/crates/beskid_engine/src/jit_module.rs`
- `compiler/crates/beskid_tests/src/runtime/jit.rs`
