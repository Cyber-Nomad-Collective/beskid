---
title: Dependency workspace and lockfile
description: Canonical compiler contract for compile plans, workspace
  materialization, lockfile policy, and dependency source trees.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-04-30
---

This feature hub specifies how manifests become prepared dependency workspaces and how `Project.lock` is synchronized under `--locked` and `--frozen`.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/projects/` — workspace materialization and dependency graph
- `compiler/crates/beskid_pipeline/src/phases.rs` — pipeline stage ordering gates
- `compiler/crates/beskid_cli/src/commands/` — lock policy flags (`--locked`, `--frozen`)

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-BUILD-0007` … `D-COMP-BUILD-0009`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Dependency workspace and lockfile - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Dependency workspace and lockfile - Design model](./articles/design-model/)
- [Dependency workspace and lockfile - Examples](./articles/examples/)
- [Dependency workspace and lockfile - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Dependency workspace and lockfile - Flow and algorithm](./articles/flow-and-algorithm/)
- [Dependency workspace and lockfile - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
