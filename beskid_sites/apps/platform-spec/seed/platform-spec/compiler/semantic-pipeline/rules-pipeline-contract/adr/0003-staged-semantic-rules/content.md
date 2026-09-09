import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Monolithic semantic passes blocked incremental invalidation.

## Decision

Semantic rules are grouped in `analysis/rules/staged/` with explicit stage boundaries wired through `services.rs` for CLI and LSP.

## Consequences

New rules declare their stage; cross-stage dependencies are documented in the hub articles.

## Verification anchors

- `compiler/crates/beskid_analysis/src/analysis/rules/`.
