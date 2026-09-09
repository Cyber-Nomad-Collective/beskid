import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Builtin shape changes break AOT/JIT link without version alignment.

## Decision

| Rule | Detail |
| --- | --- |
| Version | `beskid_runtime_abi_version` / `BESKID_RUNTIME_ABI_VERSION` must match |
| Change | Requires `beskid_abi`, runtime, and corelib updates together |

## Consequences

Link failures surface at build time, not lazy dlopen.

## Verification anchors

`beskid_abi/src/builtins.rs`; `abi/contracts.rs`.
