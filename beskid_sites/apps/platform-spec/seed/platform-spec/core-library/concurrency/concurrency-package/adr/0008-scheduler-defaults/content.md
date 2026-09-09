import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Hosts need predictable defaults without per-program scheduler tuning.

## Decision

| Setting | Default |
| --- | --- |
| `ProcessorCount` | Host logical CPU count at init |
| Stacks | 64 KiB initial, 8 MiB max |
| Arena | Phase A: **one process arena**; pool threads run Beskid mutator code under scheduler rules |

## Consequences

Fiber scheduler design model article details syscall parking.

## Verification anchors

[Fiber scheduler and stacks](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/).
