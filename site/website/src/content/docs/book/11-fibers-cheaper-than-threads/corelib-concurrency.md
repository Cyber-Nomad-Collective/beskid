---
title: "Corelib concurrency"
description: The corelib_concurrency package—Fiber, Channel, Join, and where to read normative API law.
tableOfContents: true
---

Language keywords define **`spawn`** and typing rules. **Standard library** types make handles usable without everyone reimplementing the same structs.

## Package

Normative hub: [Concurrency package](/platform-spec/core-library/concurrency/concurrency-package/).

Expected surfaces (names per spec):

- **`Fiber<T>`** — spawn handle, `OnCancelled`, join/cancel operations
- **`Channel<T>`** — cross-fiber messaging
- **WaitGroup**, **Hub** — structured coordination

Corelib lives in the **`corelib`** package identity (`compiler/corelib` / `beskid_corelib` workspace)—not a random Rust crate beside the compiler.

## Split of responsibility

| Layer | Owns |
| --- | --- |
| [Language meta — Fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/) | `spawn` syntax, diagnostics, capture rules |
| [Execution — Fiber scheduler](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/) | Stacks, scheduler, shutdown join |
| [Core library — Concurrency package](/platform-spec/core-library/concurrency/concurrency-package/) | User-facing structs and methods |

## Workspace crates (implementation)

Lowering and runtime tie to `beskid_codegen`, `beskid_engine`, `beskid_runtime`, and `abfall` for GC while fibers run—see [Crate-to-spec anchors](/platform-spec/compiler/implementation-map/crate-to-spec-anchors/).

## Next chapter

[12. The normative bible (and why we bothered)](/book/12-the-normative-bible/)
