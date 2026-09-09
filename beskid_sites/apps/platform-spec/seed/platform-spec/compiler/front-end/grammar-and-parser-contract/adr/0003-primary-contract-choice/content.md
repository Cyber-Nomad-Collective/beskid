import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

This feature hub defines the normative contract for **grammar and parser contract** and links newcomer-oriented reference articles.

## Decision

The reference compiler **must** implement Grammar and parser contract as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/beskid.pest`
- `compiler/crates/beskid_analysis/src/syntax/`
- `compiler/crates/beskid_analysis/src/syntax/items/parse_helpers.rs`
