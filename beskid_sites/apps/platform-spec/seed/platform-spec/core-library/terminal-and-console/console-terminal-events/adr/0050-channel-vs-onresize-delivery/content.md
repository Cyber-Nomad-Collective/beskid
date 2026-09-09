import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Resize notifications must integrate with fiber concurrency without OS-thread callbacks.

## Decision

| Rule | Detail |
| --- | --- |
| Cross-fiber | `PollResize` → `` `Channel<ConsoleMessage>` `` |
| Same-fiber | `OnResize` event hub |

## Consequences

No separate OS-thread callback API in v1.

## Verification anchors

`ConsoleMessageChannelTests.bd`.
