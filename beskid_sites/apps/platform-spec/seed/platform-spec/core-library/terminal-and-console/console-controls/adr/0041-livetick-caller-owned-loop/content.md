import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Corelib should not embed a full UI framework inside controls.

## Decision

| Rule | Detail |
| --- | --- |
| Tick | `LiveTick` drives periodic redraw |
| Loop | Callers compose fibers/channels around tick |

## Consequences

Interactive samples pair LiveTick with concurrency package channels.

## Verification anchors

Console controls examples and tests.
