import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Beskid rejects Rust-style `async`/`await` state machines at the language level ([D-INC-0008](/platform-spec/community/project-inception/adr/0008-fibers-not-async-await/)). The runtime must provide cooperative concurrency primitives consumed by `corelib_concurrency`.

## Decision

| Rule | Detail |
| --- | --- |
| Model | **M:N** — many **fibers** on a pool of **OS worker threads** |
| API surface | `fiber_*` builtins back `` `Fiber<T>` ``; no async lowering in compiler |
| Preemption | User fibers are **cooperative**; preemptive parallelism uses `System.Threading` (OS threads) |
| Work stealing | Per-worker run queues; work-stealing **permitted** |
| Parking | Fibers park on channel ops, join, cancel, and blocking syscalls |

## Consequences

Scheduler modules live under `beskid_runtime/src/scheduler/`. Deprecated `rt_yield` (`sched` feature) is superseded by `fiber_yield`.

## Verification anchors

`compiler/crates/beskid_runtime/tests/concurrency.rs`; corelib concurrency tests; git: `12ee673`, `76a58f5`.
