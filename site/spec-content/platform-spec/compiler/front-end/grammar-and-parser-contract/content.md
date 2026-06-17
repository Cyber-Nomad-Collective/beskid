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
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-FRONT-0004` … `D-COMP-FRONT-0006`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Grammar and parser contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Grammar and parser contract - Design model](./articles/design-model/)
- [Grammar and parser contract - Examples](./articles/examples/)
- [Grammar and parser contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Grammar and parser contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [Grammar and parser contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
