import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Early drafts considered alternate container keywords.

## Decision

The global registration block **must** be spelled **`registry`** (locked for v0.2+).

## Consequences

Parser, diagnostics, and docs use one keyword; no alias `container` in Standard conformance.

## Verification anchors

Grammar and semantic snapshots when composition lands.
