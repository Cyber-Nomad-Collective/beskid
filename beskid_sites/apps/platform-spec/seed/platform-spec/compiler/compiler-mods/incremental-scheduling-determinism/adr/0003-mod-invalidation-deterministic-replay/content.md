import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Incremental mod runs produced unstable ordering.

## Decision

Invalidation keys and dirty sets for mod pipelines **must** replay deterministically for identical inputs (Collector scope + syntax snapshot hashes).

## Consequences

LSP rescan triggers share the same keys as batch compile.

## Verification anchors

- `compiler/crates/beskid_lsp/`
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/`.
