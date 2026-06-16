---
title: Syntax domain model generation
description: Contract for generating the immutable SyntaxMirror domain model
  consumed by Compiler Mod SDK facades.
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

This feature hub defines the normative contract for **syntax domain model generation** and links detailed articles.

## Language alignment
`Collector` contracts depend on immutable syntax snapshots and **stable node identities** produced here. `Generator` and `Rewriter` must not retain stale references across invalidation rounds.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/syntax/` — syntax item builders and node shapes.
- `compiler/crates/beskid_analysis/src/beskid.pest` — grammar surface feeding parse output.
- `compiler/crates/beskid_analysis/src/syntax/items/` — item-level parsers and metadata.

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0013` … `D-COMP-MODS-0015`); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
