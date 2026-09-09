import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

C and Rust profiles previously duplicated primitive definitions.

## Decision

This feature hub **must** own the language-agnostic **Interop.Contracts** vocabulary. Profile features **must** bind these primitives, not redefine them.

## Consequences

Articles under C/Rust ABI cite ownership, call shapes, and conformance from here.

## Verification anchors

/platform-spec/language-meta/interop/interop-contracts/
