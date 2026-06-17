---
title: Resolver contract
description: Feature hub for the resolver contract in the reference compiler.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-05
---

This feature hub defines the normative contract for **resolver contract** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs` owns name resolution and scope lookup.
- `compiler/crates/beskid_analysis/src/resolve/symbol.rs` and `resolve/symbol_lookup.rs` own **SymbolRegistry** and package-prefixed identity.
- `compiler/crates/beskid_analysis/src/resolve/items.rs` resolves item-level references and stores `ItemInfo.symbol`.
- `compiler/crates/beskid_tests/src/analysis/resolve.rs` exercises resolver behavior in tests.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-SEM-0004` … `D-COMP-SEM-0016`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Resolver contract - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Resolver contract - Design model](./articles/design-model/)
- [Resolver contract - Examples](./articles/examples/)
- [Resolver contract - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Resolver contract - Flow and algorithm](./articles/flow-and-algorithm/)
- [Resolver contract - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
