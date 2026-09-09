import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

This feature defines how semantic rules are scheduled and how their findings map to stable diagnostic kinds. The primary implementation roots are `beskid_analysis/src/analysis`, staged rule modules under `analysis/rules/staged`, and services that expose diagnostics to CLI/LSP consumers.

## Decision

The reference compiler **must** implement Rules and diagnostics catalog as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/analysis`
- `compiler/crates/beskid_analysis/src/analysis/rules/staged`
- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
