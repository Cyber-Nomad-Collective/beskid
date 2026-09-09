import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Decision

Add `syscall_read_bytes` / `syscall_write_bytes` alongside existing string syscalls. Do not change existing `syscall_read` / `syscall_write` signatures.

## Verification anchors

`compiler/crates/beskid_runtime/src/builtins/panic_io.rs`, `beskid_abi/src/builtins.rs`
