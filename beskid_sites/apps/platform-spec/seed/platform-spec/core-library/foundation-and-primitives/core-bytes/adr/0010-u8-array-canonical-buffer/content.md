import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Decision

`u8[]` with `__array_new(1, len)` is the canonical byte buffer. No separate `Bytes` heap type in v1.

## Verification anchors

`Core.Bytes.Slice.New`, `compiler/crates/beskid_runtime/src/builtins/arrays.rs`
