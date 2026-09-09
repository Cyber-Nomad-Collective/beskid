import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

This feature hub defines the normative contract for **type-system pass contract** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement Type-system pass contract as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/analysis/`
- `compiler/crates/beskid_tests/src/analysis/pipeline/core.rs`
- `compiler/crates/beskid_tests/src/analysis/diagnostics.rs`
