---
title: Program assembly
description: Multi-module program composition from CompilePlan and materialized
  source roots, shared by analyze, lowering, LSP, and backend-agnostic front-end
  paths.
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

This feature hub defines how the reference compiler turns a resolved **`CompilePlan`** plus **effective (materialized-first) source roots** into a **`ProgramAssembly`**: discovered `.bd` units, a shared **`ModuleIndex`** for cross-module resolution, and a single front-end spine consumed by CLI, LSP, analyze, and codegen. JIT and AOT backends consume **`CodegenArtifact`** only and do not re-run assembly.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/services/front_end.rs` — program assembly entry point and spine construction
- `compiler/crates/beskid_analysis/src/projects/assembly/` — unit discovery and `ModuleIndex` assembly
- `compiler/crates/beskid_pipeline/src/` — pipeline integration of assembly into compile spine

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-BUILD-0013` … `D-COMP-BUILD-0023`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Program assembly - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Program assembly - Design model](./articles/design-model/)
- [Program assembly - Flow and algorithm](./articles/flow-and-algorithm/)
- [Program assembly - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
