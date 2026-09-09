import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Dynamic resolution complicates reproducible builds and CI conformance.

## Decision

v0.3 **Standard** tier-1 conformance **must** use **link-time** library binding ([link-time linking](/platform-spec/language-meta/interop/c-abi-profile/link-time-linking/)).

## Consequences

Engine may retain Proposed `extern_dlopen` paths separately from Standard claims.

## Verification anchors

`compiler/crates/beskid_codegen`; [Foreign library import](/platform-spec/tooling/foreign-library-import/).
