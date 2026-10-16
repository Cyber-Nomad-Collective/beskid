---
title: "What shipped and what is planned"
description: "Where Beskid concurrency stands in 0.6.0, which limits are gone, and what the planned isolate work is for."
tableOfContents: true
---

:::caution[Status page, not an API reference]
This page describes the state of the 0.6.0 release candidate, which is in release qualification. It is informative. The [Beskid Standard](/docs/standard/) defines behavior, and planned work below has no syntax or API until an accepted change says so.
:::

The 0.5 line built the foundations this chapter describes: a bindable `spawn`, typed `Fiber<T>` results, generic channels, owner-routed wakeups, deadlines, and `Core.IO`. Networking was built on top of them, through TLS, HTTP/2, WebSocket, QUIC, and HTTP/3 in 0.5.3. The roadmap that used to live on this page is history now. What follows is what changed for 0.6.0 and what comes next.

## What 0.6.0 changes

**The toy limits are gone.** The 0.5 runtime sized its scheduler and synchronization tables in source: 16 fibers, 64 channels, 32 mutexes, and similar numbers. A seventeenth fiber got `-1` from the runtime with nothing actually exhausted. In 0.6.0 every runtime table that hands out handles grows on demand, and records never move, so handles and GC roots stay valid while a table grows. The only way to run out is for the system allocator to refuse memory.

**Two limits you can set.** Both take a decimal byte count with an optional `k`, `m`, or `g` suffix (powers of 1024):

| Variable | Default | Effect |
| --- | --- | --- |
| `BESKID_HEAP_MAX` | No cap | Caps the managed heap |
| `BESKID_FIBER_STACK_MAX` | 8 MiB | Per-fiber stack reservation; must be a whole multiple of 64 KiB |

The runtime reads them when the process starts. A value it cannot parse or accept stops the process with a trap that names the variable, so a program never runs with a limit nobody asked for. The old `BESKID_HEAP_MAX_BYTES` is gone.

**No raw OS threads.** `Thread.Spawn` passed a null pointer where `pthread_create` expected somewhere to write, and nothing in Corelib called it. It was deleted along with `Thread.Join`. `Core.Threading.Thread.Yield` stays. Fibers are the concurrency model.

## What is planned

In 0.6.0, fibers interleave on one scheduler. `Concurrency.ProcessorCount()` returns 1. That is fine for I/O-bound work, which is what fibers are for, and useless for spreading CPU work over cores.

CPU parallelism is planned for the 0.6.1 to 0.6.5 releases, through **isolates**. The work is split into proposed OpenSpec changes, and none of them is accepted. That means no syntax, no API names, and no dates are promised here. When a change is accepted, the Standard will say what an isolate is; until then, treat any isolate example you find as a sketch.

## Where to look

- [Fibers and spawn](/docs/standard/capabilities/language-meta--evaluation--fibers-and-spawn/) for the language rules.
- [Fiber scheduler and stacks](/docs/standard/capabilities/execution--runtime--fiber-scheduler-and-stacks/) for scheduler and stack behavior.
- [Memory and GC runtime contract](/docs/standard/capabilities/execution--runtime--memory-and-gc-runtime-contract/) for the heap cap.

For the difference between a page like this and enforceable behavior, see [Informative vs normative](/book/12-the-normative-bible/informative-vs-normative/).
