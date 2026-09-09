import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Mixing models breaks GC safepoints and scheduler invariants.

## Decision

| Rule | Detail |
| --- | --- |
| Forbidden | Fiber scheduler emulation via `Core.Threading` in corelib |
| Required | Use [Concurrency package](/platform-spec/core-library/concurrency/concurrency-package/) |

## Consequences

Documentation and examples steer authors to spawn/fiber APIs.

## Verification anchors

Concurrency integration tests; core-threading module docs.
