---
title: Verification and traceability
description: How `Test harnesses and fixtures` requirements map to tests and
  implementation anchors.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Verification strategy

- Unit-level checks validate local transformations.
- Integration tests validate crate-to-crate contracts.
- End-to-end fixtures validate user-visible behavior.

## Traceability map

- Spec requirement source: `/platform-spec/compiler/conformance/test-harnesses-and-fixtures/`.
- Core implementation anchors:
  - `compiler/crates/beskid_tests/src/analysis` fixture-driven semantic assertions
  - `compiler/crates/beskid_tests/src/runtime` runtime behavior checks
  - `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` source-to-runtime outcomes
- Conformance anchor:
  - `compiler/crates/beskid_tests/src/doc_tests.rs` docs-driven verification

## Review checklist

- Requirement text and test expectation describe the same boundary.
- Crate ownership updates are reflected in spec links.
- Newly introduced edge cases include at least one reproducible fixture.
