---
title: Analysis, query, and diagnostics facades
description: Semantic queries, symbol handles, and diagnostic transport
  available inside meta execution.
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

This feature hub defines the normative contract for **`Beskid.Compiler.Query`** and **`Beskid.Compiler.Diagnostics`** (and related analysis facades) and links detailed articles.

## Language alignment
The **`process`** phase uses these modules for semantic questions and **compiler-native diagnostics**. Diagnostic shape and IDs must align with Rust analysis and LSP surfaces so **`Mod`** pipelines integrate with normal tooling.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/analysis/` — staged rules and semantic state.
- `compiler/crates/beskid_analysis/src/resolve/` — resolution products queryable from facades.
- `compiler/crates/beskid_lsp/src/diagnostics.rs` — diagnostic shaping for editor parity.

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0001` … `D-COMP-MODS-0003`, **`D-COMP-MODS-0019`** SharedResolution entry query); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
