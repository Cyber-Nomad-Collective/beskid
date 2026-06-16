---
title: Diagnostics parity (CLI and LSP)
description: Contracts for diagnostic provenance and parity across CLI parse,
  lowering, and LSP analysis paths.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-29
---

This feature hub documents where diagnostics come from in CLI and LSP, and what differences are expected versus considered regressions.

## Implementation anchors
- `compiler/crates/beskid_pipeline/src/` — diagnostic gating and parity enforcement across paths
- `compiler/crates/beskid_lsp/src/diagnostics.rs` — LSP diagnostic production and snapshot invalidation
- `compiler/crates/beskid_cli/src/commands/` — CLI diagnostic emission from shared compilation spine

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-BUILD-0010` … `D-COMP-BUILD-0024`); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
