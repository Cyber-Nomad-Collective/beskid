---
title: "What shipped and what is planned"
description: "Where Beskid concurrency stands in 0.6.7: the limits that are gone, and the isolates that run CPU work in parallel."
tableOfContents: true
---

:::caution[Status page, not an API reference]
This page describes the state of the 0.6.7 release. It is informative. The [Beskid Standard](/docs/standard/) defines behavior.
:::

The 0.5 line built the foundations this chapter describes: a bindable `spawn`, typed `Fiber<T>` results, generic channels, owner-routed wakeups, deadlines, and `Core.IO`. Networking was built on top of them, through TLS, HTTP/2, WebSocket, QUIC, and HTTP/3 in 0.5.3. The roadmap that used to live on this page is history now. What follows is what changed in the 0.6 line.

## What 0.6.0 changes

**The toy limits are gone.** The 0.5 runtime sized its scheduler and synchronization tables in source: 16 fibers, 64 channels, 32 mutexes, and similar numbers. A seventeenth fiber got `-1` from the runtime with nothing actually exhausted. In 0.6.0 every runtime table that hands out handles grows on demand, and records never move, so handles and GC roots stay valid while a table grows. The only way to run out is for the system allocator to refuse memory.

**Two limits you can set.** Both take a decimal byte count with an optional `k`, `m`, or `g` suffix (powers of 1024):

| Variable | Default | Effect |
| --- | --- | --- |
| `BESKID_HEAP_MAX` | No cap | Caps the managed heap |
| `BESKID_FIBER_STACK_MAX` | 8 MiB | Per-fiber stack reservation; must be a whole multiple of 64 KiB |

The runtime reads them when the process starts. A value it cannot parse or accept stops the process with a trap that names the variable, so a program never runs with a limit nobody asked for. The old `BESKID_HEAP_MAX_BYTES` is gone.

**No raw OS threads.** `Thread.Spawn` passed a null pointer where `pthread_create` expected somewhere to write, and nothing in Corelib called it. It was deleted along with `Thread.Join`. `Core.Threading.Thread.Yield` stays. Fibers are the concurrency model.

## What 0.6.7 adds: isolates

The isolate work was planned for 0.6.1 to 0.6.5. None of those versions was released on its own, and neither was 0.6.6, so all of it ships in 0.6.7.

Fibers still interleave on one scheduler, but that scheduler belongs to an **isolate**, not to the process. An isolate is one runtime instance: its own heap, its own scheduler, its own thread, and exactly one mutator. `Concurrency.ProcessorCount()` returns 1 because it counts the mutators of the calling isolate. `Concurrency.HostProcessorCount()` returns the number of logical processors the operating system reports.

A process runs many isolates. `Core.Parallel` is how you get them:

| Surface | What it does |
| --- | --- |
| `Parallel.Scope` and `Scope.Spawn` | Fork-join: each task body runs on another isolate, and the scope joins every task before it returns |
| `Port<T>` | A bounded queue between isolates, with back-pressure, close, and drain |
| `ParallelSeq<T>` | Data-parallel `Map`, `Where`, `Reduce`, and `Collect` over chunks of a list or array, in order by default |

The process runs at most `BESKID_ISOLATES_MAX` isolates at once; the default is the host processor count. A value crosses to another isolate only as a capture, a task result, or a port message, and only when its type is `Transferable`. Shared values cross by pointer, copyable values are copied, and moved values are handed over. [Move applies where a value crosses an isolate](/book/10-memory-without-billion-dollar-mistake/ownership-preview/) has the rules. A panic in a task ends that task with a failure for its scope; it does not end the process.

One thing did not change: two mutators never share one heap. Parallelism comes from more heaps, not from more threads in one heap.

## What is planned

Nothing on this page is promised for a date. Planned language and runtime work starts as an OpenSpec change, and the Standard says what it means only after the change is accepted.

## Where to look

- [Fibers and spawn](/docs/standard/capabilities/language-meta--evaluation--fibers-and-spawn/) for the language rules.
- [Fiber scheduler and stacks](/docs/standard/capabilities/execution--runtime--fiber-scheduler-and-stacks/) for scheduler and stack behavior.
- [Isolates and parallel](/docs/standard/capabilities/core-library--concurrency--isolates-and-parallel/) for the `Core.Parallel` API.
- [Isolates and transit](/docs/standard/capabilities/execution--runtime--isolates-and-transit/) for isolate creation, transit copy, and `BESKID_ISOLATES_MAX`.
- [Memory and GC runtime contract](/docs/standard/capabilities/execution--runtime--memory-and-gc-runtime-contract/) for the heap cap.

For the difference between a page like this and enforceable behavior, see [Informative vs normative](/book/12-the-normative-bible/informative-vs-normative/).
