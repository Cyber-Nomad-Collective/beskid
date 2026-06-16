---
title: Specification over implementation notes
description: Platform-spec text supersedes informal crate comments for
  Conformance evidence policy.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-CONF-0002
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Implementation crates accumulated informal notes that diverged from published contracts.

## Decision

Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

## Consequences

Engineers file spec/ADR updates when behavior changes; crate comments are non-authoritative for conformance arguments.

## Verification anchors

- `compiler/crates/beskid_tests/src/analysis/diagnostics.rs`
- `compiler/crates/beskid_tests/src/doc_tests.rs`
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs`
