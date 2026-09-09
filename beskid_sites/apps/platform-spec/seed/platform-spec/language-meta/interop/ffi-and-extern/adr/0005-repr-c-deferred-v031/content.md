import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Arbitrary Beskid record `repr(C)` needs layout rules beyond interop views.

## Decision

**`repr(C)`** on arbitrary Beskid types is **out of scope** for v0.3.0 Standard; **CLayout** primitive structs land in **v0.3.1** (Proposed) per [C layout types](/platform-spec/language-meta/interop/c-abi-profile/c-layout-types/).

## Consequences

v0.3.0 Standard ships interop view types and link-time import first.

## Verification anchors

[C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/).
