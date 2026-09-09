import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Linking arbitrary `rlib` targets as user Extern would imply unstable Rust ABI across toolchains.

## Decision

This profile is **not** a promise that arbitrary Rust crates can be user **`Extern`** targets without shims. User-authored foreign code on the supported path **must** remain **[C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/)** until a future specification promotes additional Rust-native interop.

## Consequences

Embedding docs steer authors to C contracts + shims for Rust libraries.

## Verification anchors

/platform-spec/language-meta/interop/rust-abi-profile/ and [FFI and extern](/platform-spec/language-meta/interop/ffi-and-extern/).
