---
title: Rules pipeline contract
description: Feature hub for the rules pipeline contract in the reference compiler.
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

This feature hub defines the normative contract for **rules pipeline contract** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/analysis/rules/` defines staged rule groups.
- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs` classifies emitted diagnostics.
- `compiler/crates/beskid_analysis/src/services/` wires semantic services used by CLI/LSP.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-SEM-0010` … `D-COMP-SEM-0012`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Rules pipeline contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Rules pipeline contract - Design model](./articles/design-model/)
- [Rules pipeline contract - Examples](./articles/examples/)
- [Rules pipeline contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Rules pipeline contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [Rules pipeline contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
