---
title: Semantic pipeline stage ordering
description: How semantic rule stages relate to lower-spine type checking in the
  reference compiler.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-16
---

This feature hub pins **where type checking runs** relative to staged semantic rules. End-to-end compile ordering (parse → mods → semantic → lower → codegen) remains under [Build pipeline / Stage ordering](/platform-spec/compiler/build-pipeline/stage-ordering/).

## Implementation anchors

- `compiler/crates/beskid_pipeline/src/phases.rs` — `lower.type_check` phase id
- `compiler/crates/beskid_analysis/src/services/lower.rs` — typed HIR spine (`typed_hir_from_lowered`, `type_check_lowered_hir`)
- `compiler/crates/beskid_analysis/src/hir/index.rs` — `index_program` before type checking
- `compiler/crates/beskid_analysis/src/types/checker/entry.rs` — `TypeChecker::check_entry` (surface → check → lowering prep)
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/type_checking.rs` — structural immutability only
- `compiler/crates/beskid_tests/src/analysis/type_check_diagnostics.rs` — diagnostic code conformance

- [Design model](./design-model/)
- [Verification and traceability](./verification-and-traceability/)
