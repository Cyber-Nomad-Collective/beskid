---
title: Stage ordering and lowering
description: Canonical ordering from resolved source through lowering into a
  backend-ready CodegenArtifact.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-29
---

This feature hub defines the stage ordering contract for parse, semantic gates, HIR/resolution/typing, and Cranelift lowering into `CodegenArtifact`.

## Implementation anchors
- `compiler/crates/beskid_pipeline/src/phases.rs` — canonical phase DAG and stage ordering
- `compiler/crates/beskid_analysis/src/services/` — pipeline orchestration across compiler stages
- `compiler/crates/beskid_codegen/src/services.rs` — lowering entry from HIR to `CodegenArtifact`

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-BUILD-0016` … `D-COMP-BUILD-0020`); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
