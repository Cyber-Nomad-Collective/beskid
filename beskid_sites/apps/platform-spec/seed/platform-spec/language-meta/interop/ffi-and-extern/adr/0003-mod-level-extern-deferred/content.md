import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Header-style `Extern` on `mod` was considered for v0.3 but increases parser and ABI ambiguity.

## Decision

**`Extern` on `mod`** is **not** part of v0.3 Standard. Authors **must** use **`contract`** blocks with method signatures ending in **`;`**.

## Consequences

Future promotion requires a dedicated ADR and profile conformance tests.

## Verification anchors

/platform-spec/language-meta/interop/ffi-and-extern/ v0.3 scope section.
