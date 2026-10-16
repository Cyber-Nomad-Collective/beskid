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

## One core at a time, for now

In 0.6.0 fibers interleave on one scheduler; they do not run in parallel. `Concurrency.ProcessorCount()` returns 1, and `SetProcessorCount` does nothing. Use fibers for I/O-bound concurrency. CPU parallelism through isolates is planned for the 0.6.1 to 0.6.5 releases. Nothing about its syntax or API is settled yet, so do not design around a guess.

## Split of responsibility

| Layer | Owns |
| --- | --- |
| [Language meta: Fibers and spawn](/docs/standard/capabilities/language-meta--evaluation--fibers-and-spawn/) | `spawn` syntax, diagnostics, capture rules |
| [Execution: Fiber scheduler](/docs/standard/capabilities/execution--runtime--fiber-scheduler-and-stacks/) | Stacks, scheduler, shutdown join |
| [Core library: Concurrency package](/docs/standard/capabilities/core-library--concurrency--concurrency-package/) | User-facing structs and methods |

## Workspace crates (implementation)

Lowering goes through `beskid_codegen` and `beskid_isle`; the scheduler, channels, and synchronization are Beskid runtime source under `compiler/runtime/beskid/src/Runtime`, linked as part of the ABI-v5 runtime kit. See [Crate-to-spec anchors](/docs/standard/capabilities/compiler--implementation-map--crate-to-spec-anchors/).

## Next chapter

[12. The normative bible (and why we bothered)](/book/12-the-normative-bible/)
