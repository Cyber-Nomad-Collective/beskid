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
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-BUILD-0010` … `D-COMP-BUILD-0024`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Diagnostics parity (CLI and LSP) - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Diagnostics parity (CLI and LSP) - Design model](./articles/design-model/)
- [Diagnostics parity (CLI and LSP) - Examples](./articles/examples/)
- [Diagnostics parity (CLI and LSP) - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Diagnostics parity (CLI and LSP) - Flow and algorithm](./articles/flow-and-algorithm/)
- [Diagnostics parity (CLI and LSP) - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
