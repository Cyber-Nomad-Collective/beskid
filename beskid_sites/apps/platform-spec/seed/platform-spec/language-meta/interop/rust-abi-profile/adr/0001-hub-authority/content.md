import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Rust runtime exports were documented beside user C extern rules.

## Decision

This feature hub **must** own normative MUST/SHOULD for **Rust-hosted runtime** interop distinct from user **C ABI profile** libraries.

## Consequences

Builtin table and ABI version policy stay here; user `Extern` stays on C profile.

## Verification anchors

/platform-spec/language-meta/interop/rust-abi-profile/
