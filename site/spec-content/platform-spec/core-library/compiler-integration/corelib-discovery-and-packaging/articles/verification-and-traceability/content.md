---
title: Verification and traceability
description: How `Corelib discovery and packaging` requirements map to tests and
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

- Spec requirement source: `/platform-spec/core-library/compiler-integration/corelib-discovery-and-packaging/`.
- Core implementation anchors:
  - Canonical package root `compiler/corelib/beskid_corelib`
  - Canonical package identity `corelib` in `compiler/corelib/beskid_corelib/Project.proj`
  - Corelib path discovery in `compiler/crates/beskid_analysis/src/projects/graph/resolver.rs`
  - CLI embedding/install support in `compiler/crates/beskid_cli/build.rs` and `compiler/crates/beskid_cli/src/corelib_runtime.rs`
- Conformance anchor:
  - Integration checks in `compiler/crates/beskid_tests/src/projects/corelib`

CI anchors:

- Compiler corelib quality gate in `compiler/.github/workflows/ci.yml` (`corelib-quality`).
- Corelib publish authority and quality checks in `compiler/corelib/.github/workflows/ci.yml`.

## Review checklist

- Requirement text and test expectation describe the same boundary.
- Crate ownership updates are reflected in spec links.
- Newly introduced edge cases include at least one reproducible fixture.
