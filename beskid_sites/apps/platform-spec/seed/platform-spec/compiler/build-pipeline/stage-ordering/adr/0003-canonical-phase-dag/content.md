import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Reference compiler **must** emit stable `beskid_pipeline` phase events from parse through `lower.ready` without reordering semantic gates relative to mod boundaries.

## Decision

Phase literals are defined in `compiler/crates/beskid_pipeline/src/phases.rs` and asserted by conformance tests; CLI/LSP observers rely on the same ids.

## Consequences

Reordering phases requires an ADR and registry updates.

## Verification anchors

- `compiler/crates/beskid_pipeline/`
- `compiler/crates/beskid_analysis/src/services/`.
