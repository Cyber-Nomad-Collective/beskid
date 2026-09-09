import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Implementers need a spec-first schedule when codegen trails text.

## Decision

| Band | Content | Status |
| --- | --- | --- |
| **v0.3.0** | Interop views, link-time import, symbol overrides | Standard (spec; impl may trail) |
| **v0.3.1** | `CLayout` primitive structs | Proposed |
| **Later** | Nested FFI structs, enum ABI, foreign-thread entry | Planned |

## Consequences

Articles tag Proposed vs Standard explicitly; CI strict mode can gate premature Standard claims.

## Verification anchors

/platform-spec/language-meta/interop/c-abi-profile/ and child articles.
