---
title: HIR normalization and legality
description: Feature hub for the hir normalization and legality in the reference compiler.
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

This feature hub defines the normative contract for **hir normalization and legality** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/resolve/mod.rs` orchestrates normalization boundaries.
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs` enforces legality while resolving symbols.
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/definitions.rs` validates post-normalization invariants.

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-FRONT-0007` … `D-COMP-FRONT-0009`); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
