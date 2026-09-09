import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

UI loops should not crash when consumers drop resize messages.

## Decision

| Rule | Detail |
| --- | --- |
| EVT-002 | Failed `Send` on resize is **silent** in v1 |
| Future | May gain diagnostics in a later ADR |

## Consequences

Poll loops continue after dropped resize notifications.

## Verification anchors

`ConsoleMessageChannelTests.bd`; EVT-002 traceability.
