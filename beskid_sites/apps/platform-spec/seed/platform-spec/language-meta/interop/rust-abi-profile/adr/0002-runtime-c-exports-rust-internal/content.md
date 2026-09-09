import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

JIT/AOT loaders need stable C symbol names while implementation remains Rust.

## Decision

The Beskid runtime **must** expose **stable C-compatible entrypoints** to loaders. **Rust-specific** implementation choices **must** remain **inside** the runtime crate boundary.

## Consequences

`beskid_abi` symbols and unwind bridges document the outward face only.

## Verification anchors

`compiler/crates/beskid_abi`; `compiler/crates/beskid_runtime`.
