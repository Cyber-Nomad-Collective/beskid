import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Rendered diagnostics drifted from semantic registry.

## Decision

Code-to-meaning mapping is normative in `SemanticIssueKind::code()` and `diagnostic_kinds.rs`, synchronized with trudoc verify scripts—not LSP presentation layers.

## Consequences

Renaming codes requires migration notes; new issues need unique codes before release.

## Verification anchors

- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- `packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs`.
