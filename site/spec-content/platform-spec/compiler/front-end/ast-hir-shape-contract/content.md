---
title: AST and HIR shape contract
description: Feature hub for the ast and hir shape contract in the reference compiler.
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

This feature hub defines the normative contract for **ast and hir shape contract** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/syntax/items/` exposes AST-like syntax node shapes.
- `compiler/crates/beskid_analysis/src/resolve/items.rs` maps parsed items into resolved structures.
- `compiler/crates/beskid_analysis/src/analysis/` consumes those shapes for semantic passes.

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-FRONT-0001` … `D-COMP-FRONT-0003`); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
