---
title: Verification and traceability
description: How `Lowering contract` requirements map to tests and implementation anchors.
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

- Spec requirement source: `/platform-spec/compiler/codegen-and-ir/lowering-contract/`.
- Core implementation anchors:
  - `beskid_codegen::lower_source` in `compiler/crates/beskid_codegen`
  - `CodegenArtifact` construction in `compiler/crates/beskid_codegen`
  - `JitModule` consumption in `compiler/crates/beskid_engine/src/jit_module.rs`
- Conformance anchor:
  - Runtime execution coverage in `compiler/crates/beskid_tests/src/runtime/jit.rs`

## Review checklist

- Requirement text and test expectation describe the same boundary.
- Crate ownership updates are reflected in spec links.
- Newly introduced edge cases include at least one reproducible fixture.
