import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

This feature hub defines the normative contract for **`Beskid.Compiler.Emit`** (typed emitter and transforms) and links detailed articles.

## Decision

The reference compiler **must** implement Typed emitter and transforms as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/syntax/items/`
- `compiler/crates/beskid_codegen/`
