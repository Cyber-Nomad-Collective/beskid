---
title: "Corelib concurrency"
description: The corelib_concurrency package, covering Fiber, Channel, Join, and where to read normative API law.
tableOfContents: true
---

Language keywords define **`spawn`** and typing rules. **Standard library** types make handles usable without everyone reimplementing the same structs.

## Package

Normative hub: [Concurrency package](/docs/standard/capabilities/core-library--concurrency--concurrency-package/).

Expected surfaces (names per spec):

- **`Fiber<T>`**: spawn handle with `Join`, `Detach`, and `Cancel`
- **`Channel<T>`**: cross-fiber messaging
- **`Mutex`**, **`WaitGroup`**, **`Hub<T>`**: coordination
- **`Concurrency.Yield()`**: cooperative reschedule of the current fiber

Corelib lives in the **`corelib`** package identity (the `compiler/corelib` workspace), not a random Rust crate beside the compiler.

## Fibers share a core; isolates use the others

Fibers run on the scheduler of the isolate that spawned them, and they never leave it. Inside one isolate they interleave; they do not run in parallel. `Concurrency.ProcessorCount()` counts the mutators of the calling isolate, which is always 1, so it is not the number of cores. `Concurrency.HostProcessorCount()` is the number of logical processors the operating system reports. `SetProcessorCount` does nothing.

CPU parallelism comes from more isolates, not from more threads under one scheduler. `Parallel.Scope` in `Core.Parallel` runs each `Scope.Spawn` body on another isolate, which has its own heap, scheduler, and thread, and the scope joins every task before it returns. The process runs at most `BESKID_ISOLATES_MAX` isolates at once; the default is the host processor count. When the bound is reached, `Spawn` runs the body on the caller instead of waiting, so nested scopes cannot deadlock on the pool. A value crosses to another isolate only as a capture, a task result, or a `Port<T>` message, and only when its type is `Transferable`. [Move applies where a value crosses an isolate](/book/10-memory-without-billion-dollar-mistake/ownership-preview/) explains what that costs.

Use fibers for waiting and isolates for computing. A fiber that spins on arithmetic still holds its isolate's only mutator, and every other fiber in that isolate waits for it.

## Split of responsibility

| Layer | Owns |
| --- | --- |
| [Language meta: Fibers and spawn](/docs/standard/capabilities/language-meta--evaluation--fibers-and-spawn/) | `spawn` syntax, diagnostics, capture rules |
| [Execution: Fiber scheduler](/docs/standard/capabilities/execution--runtime--fiber-scheduler-and-stacks/) | Stacks, scheduler, shutdown join |
| [Core library: Concurrency package](/docs/standard/capabilities/core-library--concurrency--concurrency-package/) | User-facing structs and methods |
| [Core library: Isolates and parallel](/docs/standard/capabilities/core-library--concurrency--isolates-and-parallel/) | `Core.Parallel`: scopes, tasks, ports, parallel sequences |
| [Execution: Isolates and transit](/docs/standard/capabilities/execution--runtime--isolates-and-transit/) | Isolate creation, transit copy, the isolate bound |

## Workspace crates (implementation)

Lowering goes through `beskid_codegen` and `beskid_isle`; the scheduler, channels, and synchronization are Beskid runtime source under `compiler/runtime/beskid/src/Runtime`, linked as part of the ABI-v5 runtime kit. See [Crate-to-spec anchors](/docs/standard/capabilities/compiler--implementation-map--crate-to-spec-anchors/).

## Next chapter

[12. The normative bible (and why we bothered)](/book/12-the-normative-bible/)
