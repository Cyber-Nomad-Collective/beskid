---
title: "Runtime fibers"
description: Cooperative scheduling, stacks, and why async/await is not the plan.
tableOfContents: true
---

Beskid uses **fibers** with cooperative scheduling. See [Fibers and spawn](/docs/standard/capabilities/language-meta--evaluation--fibers-and-spawn/). The runtime feature [Fiber scheduler and stacks](/docs/standard/capabilities/execution--runtime--fiber-scheduler-and-stacks/) is where stack growth, scheduling fairness, and shutdown behavior are specified.

The scheduler, channels, mutexes, wait groups, and hubs are Beskid runtime source under `compiler/runtime/beskid/src/Runtime` (`Fiber/Scheduler`, `Sync`, `PubSub`). The compiler lowers that source into the ABI-v5 runtime kit that every executable links. `corelib_concurrency` exposes the language-facing API. Confusing the two is how you open a PR that "fixes fibers" in the wrong place.

## Limits

The runtime has no fixed table sizes. Fibers, channels, mutexes, wait groups, hubs, poll tasks, and external waits live in chunked storage that grows on demand; records never move, so handles and registered GC roots stay valid while a table grows. Waiter lists and run queues are growable too. The only failure is the system allocator refusing memory: creation paths report it the way a full table used to (`-1`, null, `HubLimit`), and paths that cannot report it trap with `out_of_memory`.

Two environment variables set process-wide limits. Each takes a decimal byte count with an optional `k`, `m`, or `g` suffix (powers of 1024, either case):

| Variable | Default | Rule |
| --- | --- | --- |
| `BESKID_HEAP_MAX` | No cap | Caps the managed heap; must not be below the heap's committed or initial region size |
| `BESKID_FIBER_STACK_MAX` | 8 MiB | Per-fiber stack reservation; a whole multiple of the 64 KiB initial commit |

The runtime reads both at process init, so an executable, a library attach, and an embedding host all honor them the same way. An unparsable or rejected value stops the process with a trap that names the variable. Running out of heap is the existing `out_of_memory` trap.

```bash
BESKID_HEAP_MAX=512m BESKID_FIBER_STACK_MAX=1m ./my-app
```

Normative text: [Memory and GC runtime contract](/docs/standard/capabilities/execution--runtime--memory-and-gc-runtime-contract/) and [Fiber scheduler and stacks](/docs/standard/capabilities/execution--runtime--fiber-scheduler-and-stacks/).

## Spec

- [Channels and synchronization](/docs/standard/capabilities/execution--runtime--channels-and-synchronization/)
- [Fibers and spawn (language)](/docs/standard/capabilities/language-meta--evaluation--fibers-and-spawn/)

## Hub

[17. Execution](/book/17-execution-abi-host-runtime/)
