import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Authors need one abstract model with two concrete ABI bindings.

## Decision

**Interop.Contracts** **does not** prescribe a single calling convention. **[C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/)** and **[Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/)** **must** bind symbols, layouts, linking, and unwind rules to these primitives.

## Consequences

Syntax for `Extern` contracts remains under FFI and extern; profiles add ABI tables.

## Verification anchors

/platform-spec/language-meta/interop/interop-contracts/ and profile hubs.
