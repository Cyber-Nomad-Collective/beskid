---
title: Program assembly - Verification and traceability
description: Test and source anchors for ProgramAssembly and effective roots.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-20
---

Implementation anchors:

- `compiler/crates/beskid_analysis/src/projects/assembly/`
- `compiler/crates/beskid_analysis/src/services/front_end.rs`
- `compiler/crates/beskid_pipeline/src/phases.rs` (`program.assemble`)
- `compiler/crates/beskid_tests/src/projects/assembly.rs`

Tests **must** cover materialized root preference, import-closure loading of std modules (corelib_mvp fixture), pipeline phase order, and lowering without analyze-side diagnostic filtering.
