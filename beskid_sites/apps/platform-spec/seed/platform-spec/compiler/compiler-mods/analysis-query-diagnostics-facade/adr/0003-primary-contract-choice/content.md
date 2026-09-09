import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

This feature hub defines the normative contract for **`Beskid.Compiler.Query`** and **`Beskid.Compiler.Diagnostics`** (and related analysis facades) and links detailed articles.

## Decision

The reference compiler **must** implement Analysis, query, and diagnostics facades as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/analysis/`
- `compiler/crates/beskid_analysis/src/resolve/`
- `compiler/crates/beskid_lsp/src/diagnostics.rs`
