---
title: Specification over implementation notes
description: Platform-spec text supersedes informal crate comments for Extern
  import extraction contract.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-IR-0005
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Implementation crates accumulated informal notes that diverged from published contracts.

## Decision

Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

## Consequences

Engineers file spec/ADR updates when behavior changes; crate comments are non-authoritative for conformance arguments.

## Verification anchors

- `compiler/crates/beskid_abi/src/builtins.rs`
- `compiler/crates/beskid_runtime/src/builtins/mod.rs`
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs`
