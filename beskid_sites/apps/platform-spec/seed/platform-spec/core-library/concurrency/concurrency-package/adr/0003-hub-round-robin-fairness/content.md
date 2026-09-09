import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

FIFO registration order starves late channels when an early channel is always ready.

## Decision

| Rule | Detail |
| --- | --- |
| Algorithm | **Round-robin** among channels with a ready **Receive** |
| Cursor | Per-`Hub` index advanced after each successful **WaitReceive** |
| v1 scope | **WaitReceive** only — no **WaitSend** |

## Consequences

Console hubs should keep registration count small (under 16 typical).

## Verification anchors

Hub integration tests in runtime and corelib suites.
