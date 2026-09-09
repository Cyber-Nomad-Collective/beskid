import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Export/callback rules were scattered between runtime and language-meta drafts.

## Decision

This feature hub **must** own normative MUST/SHOULD for Beskid **export** and **callback registration** (user interop).

## Consequences

Distinct from runtime builtin exports on Rust ABI profile.

## Verification anchors

/platform-spec/language-meta/interop/export-and-callbacks/
