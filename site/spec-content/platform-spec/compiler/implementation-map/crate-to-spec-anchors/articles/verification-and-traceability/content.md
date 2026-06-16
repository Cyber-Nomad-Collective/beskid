---
title: Verification and traceability
description: How `Crate-to-spec anchors` requirements map to tests and
  implementation anchors.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-29
---

## Verification strategy

- Unit-level checks validate local transformations.
- Integration tests validate crate-to-crate contracts.
- End-to-end fixtures validate user-visible behavior.

## Traceability map

- Spec requirement source: `/platform-spec/compiler/implementation-map/crate-to-spec-anchors/`.
- Core implementation anchors:
  - `beskid_analysis` -> parser/resolution/semantic leaves
  - `beskid_codegen` -> lowering contract leaves
  - `beskid_abi` and `beskid_runtime` -> execution ABI/runtime leaves
- Conformance anchor:
  - `beskid_tests` and `beskid_e2e_tests` -> conformance leaves
  - `beskid_tests/src/spine/` -> unified spine diagnostics parity (D-COMP-CONF-0007)
  - `beskid_codegen/tests/array_tests_linking.rs` -> `LinkPlan` / `validate_artifact` (D-COMP-IR-0010)
  - `compiler/corelib/ci/run_corelib_tests.py` -> full `corelib_tests` matrix via `beskid test`

## Review checklist

- Requirement text and test expectation describe the same boundary.
- Crate ownership updates are reflected in spec links.
- Newly introduced edge cases include at least one reproducible fixture.
