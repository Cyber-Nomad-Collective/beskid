---
title: Incremental scheduling and determinism
description: Cache boundaries, invalidation keys, and replay guarantees for mod
  outputs and Mod SDK reads.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-01
---

This feature hub defines invalidation keys, cache boundaries, and replay for mod pipelines and **`Mod`** projects.

## Language alignment
Maps Collector scope strategies (narrow vs workspace-wide) to concrete dependency graph width and dirty-set propagation.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/` — precedent for staged invalidation.
- `compiler/crates/beskid_lsp/` — incremental document models and rescan triggers.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0007` … `D-COMP-MODS-0009`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Incremental scheduling and determinism - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Incremental scheduling and determinism - Design model](./articles/design-model/)
- [Incremental scheduling and determinism - Examples](./articles/examples/)
- [Incremental scheduling and determinism - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Incremental scheduling and determinism - Flow and algorithm](./articles/flow-and-algorithm/)
- [Incremental scheduling and determinism - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
