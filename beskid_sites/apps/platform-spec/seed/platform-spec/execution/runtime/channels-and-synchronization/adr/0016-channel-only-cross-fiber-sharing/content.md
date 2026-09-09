import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Shared mutable stacks across fibers would break GC stack maps and the memory model. The runtime must align with language channel-only rules.

## Decision

| Rule | Detail |
| --- | --- |
| Mechanism | **Channels** are the **only** approved cross-fiber data transfer at runtime |
| Happens-before | Successful **Send** *happens-before* **Receive** that observes the value |
| Values | Copied or heap handles with GC tracing — **no** stack pointer transfer |
| Builtins | `channel_*`, `mutex_*`, `wait_group_*` implement queues and coordination |
| Compiler | **Must not** lower cross-fiber stack sharing |

Corelib policy: [D-CORE-CONC-0009](/platform-spec/core-library/concurrency/concurrency-package/adr/0009-channel-runtime-semantics/).

## Consequences

New sync primitives require spec + ABI + corelib trifecta before export.

## Verification anchors

`beskid_runtime` channel tests; git `12ee673`.
