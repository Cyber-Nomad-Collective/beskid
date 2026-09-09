import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Parallel GC mutators require write barriers not ready for initial ship.

## Decision

| Phase | Rule |
| --- | --- |
| A (ship) | Many fibers, **one GC mutator**; `gc_write_barrier` no-op |
| B (documented) | Parallel mutators + real barriers; no corelib API break |

## Consequences

Scheduler and memory specs must stay consistent with phase A barriers.

## Verification anchors

Runtime GC tests; memory-and-gc-runtime-contract feature.
