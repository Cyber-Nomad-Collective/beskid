import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

This feature hub defines the normative contract for **hir normalization and legality** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement HIR normalization and legality as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/resolve/mod.rs`
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs`
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/definitions.rs`
