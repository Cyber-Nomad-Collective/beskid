import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Interop.Contracts primitives need a single C profile authority for tier-1 hosts.

## Decision

This feature hub **must** own normative MUST/SHOULD for **C-compatible** foreign libraries. Sibling articles add detail without redefining hub MUST tables.

## Consequences

Cranelift lowering and foreign library import tooling align to this profile.

## Verification anchors

/platform-spec/language-meta/interop/c-abi-profile/
