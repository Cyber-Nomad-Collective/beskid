---
title: Typed emitter and transforms
description: Construction of syntax nodes and declarative transforms without raw
  text printing.
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

This feature hub defines the normative contract for **`Beskid.Compiler.Emit`** (typed emitter and transforms) and links detailed articles.

## Language alignment
Only the **`emit`** phase may apply **typed** program contributions through this surface; the host validates merge against language rules.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/syntax/items/` — patterns for well-formed item emission.
- `compiler/crates/beskid_codegen/` — downstream expectations after merge.

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0016` … `D-COMP-MODS-0018`); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
