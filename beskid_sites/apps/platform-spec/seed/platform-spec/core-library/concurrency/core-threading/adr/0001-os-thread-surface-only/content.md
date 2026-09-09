import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Cooperative and preemptive concurrency need distinct entry points.

## Decision

| Rule | Detail |
| --- | --- |
| API | `Core.Threading` is the only supported **preemptive** OS-thread module |
| Fibers | Cooperative APIs stay in the concurrency package |

## Consequences

User code must not implement fibers atop `Thread.Spawn`.

## Verification anchors

`packages/foundation/src/Core/Threading/` sources; runtime syscall docs.
