---
title: "Scheduling and fibers"
description: Redirect and migration notes from v0.1 stubs to normative platform-spec concurrency.
---

> **Non-normative (legacy bridge).** This page is transitional documentation from the pre-`platform-spec` tree. **Canonical** execution contracts: [/platform-spec/execution/](/platform-spec/execution/). Full path mapping: [/platform-spec/legacy-spec-mapping/](/platform-spec/legacy-spec-mapping/).

> **Normative source:** use the platform specification, not this page, for contracts.
>
> - [Fiber scheduler and stacks](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/)
> - [Channels and synchronization](/platform-spec/execution/runtime/channels-and-synchronization/)
> - [Fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/)
> - [Concurrency package](/platform-spec/core-library/concurrency/concurrency-package/)
> - [System.Threading](/platform-spec/core-library/concurrency/system-threading/)

## v0.1 legacy (superseded)

v0.1 kept the process **single-threaded** for Beskid code and exposed optional **`sched`** feature stubs in `beskid_runtime`:

- `rt_yield()` — mapped to `std::thread::yield_now()` (not a fiber scheduler)
- `rt_now_millis()` — monotonic milliseconds

These symbols are **deprecated** in favor of **`fiber_yield`** and **`Concurrency.NowMillis()`** (runtime clock builtin) under **[Fiber scheduler and stacks](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/)** and **[Concurrency decisions record](/platform-spec/core-library/concurrency/concurrency-package/decisions-record/)**.

## v0.2 direction

- **Cooperative fibers** with **`spawn`** and **`Fiber<T>`** (corelib struct wrapping runtime builtins)
- **Channel&lt;T&gt;** with **Send** / **Receive** (full names); **Hub** for multichannel wait
- **Phase A:** many fibers, single GC mutator thread (documented)
- **Phase B:** parallel mutators + real write barriers (specified, not required for first ship)
- **Preemptive OS threads:** **`System.Threading`** only—not fiber preemption

Build experiment (legacy): `cargo check -p beskid_runtime --features sched` — do not use for new code.
