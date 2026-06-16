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

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0007` … `D-COMP-MODS-0009`); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
