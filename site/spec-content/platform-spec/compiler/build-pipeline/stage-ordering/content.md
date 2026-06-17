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
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-BUILD-0016` … `D-COMP-BUILD-0021`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Stage ordering and lowering - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Stage ordering and lowering - Design model](./articles/design-model/)
- [Stage ordering and lowering - Examples](./articles/examples/)
- [Stage ordering and lowering - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Stage ordering and lowering - Flow and algorithm](./articles/flow-and-algorithm/)
- [Unit artifact cache schema](./articles/unit-artifact-cache/)
- [Stage ordering and lowering - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
