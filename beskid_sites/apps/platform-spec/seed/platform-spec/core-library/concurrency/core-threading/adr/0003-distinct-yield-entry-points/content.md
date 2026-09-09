import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Kernel scheduling differs from cooperative fiber reschedule.

## Decision

| Rule | Detail |
| --- | --- |
| `Thread.Yield` | OS-level yield |
| `Concurrency.Yield` | `fiber_yield` cooperative reschedule |

## Consequences

Names and docs must not alias the two yields.

## Verification anchors

Runtime tests distinguishing syscall vs fiber_yield.
