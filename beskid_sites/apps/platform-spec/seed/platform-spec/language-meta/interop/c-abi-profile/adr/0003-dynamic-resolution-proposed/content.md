import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Some hosts want late binding; tier-1 reference path standardizes link-time.

## Decision

**Runtime `dlopen` / `dlsym` resolution** is **demoted** to the [dynamic resolution profile](/platform-spec/language-meta/interop/c-abi-profile/dynamic-resolution-profile/) (**Proposed** appendix, not Standard).

## Consequences

Documentation and conformance matrices must not require dlopen for Standard tier-1.

## Verification anchors

`compiler/crates/beskid_engine/src/engine.rs` (`extern_dlopen`, Proposed).
