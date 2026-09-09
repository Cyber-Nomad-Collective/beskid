import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Aligns with inception ADR D-INC-0008; avoids dual concurrency models in v1.

## Decision

| Rule | Detail |
| --- | --- |
| Keyword | `spawn` required for new fibers; no `go` alias in v1 |
| Reserved | `async` and `await` are **parse errors** (reserved, not implemented) |
| Data transfer | **Channel** only between fibers for data; **Mutex** / **WaitGroup** for coordination |
| Handles | `` `Fiber<T>` `` and `` `Channel<T>` `` are **move-only** |

## Consequences

Parser and semantic tests reject async/await; spawn lowering returns `` `Fiber<T>` ``.

## Verification anchors

Parser fixtures; [Fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/).
