import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

WinAPI/stdcall surfaces belong in platform packages with distinct conformance tiers.

## Decision

**WinAPI / stdcall** as a **stdlib** concern is **out of scope** for tier-1 **Standard** conformance; platform packages may document **Proposed** mappings separately.

## Consequences

[Platform tier matrix](/platform-spec/language-meta/interop/c-abi-profile/platform-tier-matrix/) records host-specific tiers.

## Verification anchors

/platform-spec/language-meta/interop/c-abi-profile/
