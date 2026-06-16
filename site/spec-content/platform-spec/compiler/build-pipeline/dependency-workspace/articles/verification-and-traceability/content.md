---
title: Dependency workspace and lockfile - Verification and traceability
description: Source anchors and test evidence for compile-plan and lockfile behavior.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

Implementation anchors:

- `compiler/crates/beskid_analysis/src/projects/compile_plan.rs`
- `compiler/crates/beskid_analysis/src/projects/workflow.rs`
- `compiler/crates/beskid_cli/src/commands/fetch.rs`
- `compiler/crates/beskid_cli/src/commands/lock.rs`

Traceability expectation: each lock policy branch is covered by fixture-based tests.
