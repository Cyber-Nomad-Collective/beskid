import SpecPageHeader from '@beskid/beskid-ui/platform-spec/SpecPageHeader.astro';

<SpecPageHeader status="Standard" ownerName="Piotr Mikstacki" ownerEmail="pmikstacki@cybernomad.it" submitterName="Piotr Mikstacki" submitterEmail="pmikstacki@cybernomad.it" />

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
