import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Authors need defined fan-in/fan-out and close idempotence.

## Decision

| Rule | Detail |
| --- | --- |
| Receivers | Multiple allowed; each message delivered to **exactly one** successful **Receive** (FIFO) |
| Senders | Multiple allowed unless **SingleWriter** hint (hint only v1) |
| Close | Any handle holder may **Close**; idempotent writer shutdown |
| void spawn | `` `Fiber<Unit>` `` when entry returns no value |

## Consequences

Close after drain returns `ChannelError::Closed` in `Result`.

## Verification anchors

Runtime concurrency.rs; corelib channel tests.
