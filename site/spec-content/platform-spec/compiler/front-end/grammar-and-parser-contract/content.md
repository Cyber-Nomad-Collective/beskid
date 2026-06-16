---
title: Grammar and parser contract
description: Feature hub for the grammar and parser contract in the reference compiler.
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

This feature hub defines the normative contract for **grammar and parser contract** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/beskid.pest` defines the grammar tokens and precedence.
- `compiler/crates/beskid_analysis/src/syntax/` builds syntax items from parser output.
- `compiler/crates/beskid_analysis/src/syntax/items/parse_helpers.rs` contains shared parse helpers used by item parsers.

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-FRONT-0004` … `D-COMP-FRONT-0006`); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
