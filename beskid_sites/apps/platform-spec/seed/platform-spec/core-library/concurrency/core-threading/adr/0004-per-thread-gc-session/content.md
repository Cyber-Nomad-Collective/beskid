import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Parallel OS threads require independent GC attachment rules in Phase A.

## Decision

| Rule | Detail |
| --- | --- |
| Entry | Thread start **must** establish runtime heap session |
| FFI | `extern "C"` stays pinned to calling OS thread for call duration |

## Consequences

Violations risk root loss or cross-thread heap corruption.

## Verification anchors

[Extern dispatch and policy](/platform-spec/execution/abi-and-host/extern-dispatch-and-policy/); GC phase ADRs.
