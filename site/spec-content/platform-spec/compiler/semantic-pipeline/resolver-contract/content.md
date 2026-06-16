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

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-SEM-0004` … `D-COMP-SEM-0007`, **`D-COMP-SEM-0016`** package-prefixed symbol identity); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
