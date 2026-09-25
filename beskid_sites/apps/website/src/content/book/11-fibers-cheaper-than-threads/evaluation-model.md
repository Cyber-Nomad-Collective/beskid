---
title: "Evaluation model"
description: Functions, closures, and one scheduler. Why fibers instead of async, and what the compiler checks when a closure crosses a spawn.
tableOfContents: true
---

Beskid evaluates functions on a cooperative scheduler. A fiber runs until it blocks on something, a channel receive, a socket, a sleep, a join, and then the scheduler runs another one. There is no preemption and no kernel thread per fiber. A fiber is a stack and a program counter; on Linux x86-64 switching between them is a Cranelift tail transfer.

## Why not async

`async`/`await` splits a language in two. Async functions can only be awaited from async functions, so the color spreads upward until `Main` is async and every interface has an `Async` suffix twin. Libraries ship both `Read` and `ReadAsync`. The runtime rewrites every async body into a state machine and the debugger shows you `MoveNext` frames. And the underlying problem, that a blocked operation should not block a thread, was solved in 1970 by having more than one stack.

Beskid keeps the stacks. A function that blocks on a socket blocks its fiber, the scheduler runs something else, and the function's signature does not change. `Http.Client.Send` returns `Result<Response, HttpError>`, not a `Task`, and it is called from a fiber like every other function. The keywords `async` and `await` are reserved and rejected so the split cannot be reintroduced by a library.

The decision is recorded in the standard as [D-INC-0008](/platform-spec/community/project-inception/adr/0008-fibers-not-async-await/).

## Closures and capture

```beskid
Fiber<unit> serving = spawn (() => Serve(server));
```

`spawn` takes a call or a closure. A closure captures its environment, and when that environment crosses a `spawn` the compiler checks it. A reference to stack memory in the parent cannot escape into a fiber that may outlive the frame; that is E1225, "stack reference escapes spawn", and it is the diagnostic instead of the use-after-free. Managed values captured into a fiber are rooted for the collector so the child can hold them for as long as it runs.

A closure that consumes a captured `Fiber<T>` handle, by joining or detaching it, cannot be a repeatable closure. The compiler rejects it because the second call would use a moved handle.

## Waiting and time

A blocked fiber is woken by its owner. External completions from the operating system, a socket becoming readable or a timer firing, are routed to the scheduler that owns the waiting fiber through a mailbox, and exactly one completion wins. There is no shared run queue for other schedulers to steal from, and no wake-up delivered to the wrong stack.

Timers are absolute monotonic deadlines. `Core.Time.Sleep(Duration)` and `Deadline.After(Duration)` are the user-facing surface; both return a `Result` because a negative duration is an error, not a no-op.

## What runs where

| Layer | Owns |
| --- | --- |
| language (`spawn`, capture rules, E1225) | `beskid_analysis`, `beskid_queries` |
| lowering (`fiber_spawn`, stack maps) | `beskid_codegen`, `beskid_isle` |
| scheduler, stacks, timers, wake routing | `beskid_engine`, `beskid_runtime` |
| GC tracing across fiber stacks | `abfall` |
| `Fiber<T>`, `Channel<T>`, `Mutex`, `WaitGroup`, `Hub` | `corelib_concurrency`, written in Beskid |

The standard's [evaluation](/platform-spec/language-meta/evaluation/) area has the language rules and [fiber scheduler and stacks](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/) has the runtime ones.
