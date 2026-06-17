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
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0013` … `D-COMP-MODS-0015`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Syntax domain model generation - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Syntax domain model generation - Design model](./articles/design-model/)
- [Syntax domain model generation - Examples](./articles/examples/)
- [Syntax domain model generation - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Syntax domain model generation - Flow and algorithm](./articles/flow-and-algorithm/)
- [Syntax domain model generation - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
