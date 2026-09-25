---
title: "Corelib concurrency"
description: The corelib_concurrency package, what it wraps, and where to read when the wrapper is not enough.
tableOfContents: true
---

The language defines `spawn` and the capture rules. Everything you actually call is a package.

```text
corelib/packages/concurrency/src/Concurrency/
├── Fiber.bd            Fiber<T>: Join, Detach, Cancel
├── FiberError.bd       Cancelled, StackOverflow, Panicked
├── Channel.bd          Channel<T>: Create, Send, Receive, TrySend, TryReceive, Close
├── ChannelOptions.bd   bounded vs unbounded
├── ChannelError.bd
├── Mutex.bd            Mutex, Lock, TryLock, Unlock
├── MutexGuard.bd
├── WaitGroup.bd        Create, Add, Done, Wait
├── Hub.bd              Hub<T>: Register, Unregister, WaitReceive
├── HubReceiveResult.bd
├── TryResult.bd        Ok, Err, WouldBlock
└── Status.bd           runtime status codes mapped to typed errors
```

Every file is Beskid source over `__fiber_*`, `__channel_*`, `__mutex_*`, and `__wait_group_*` builtins. `Fiber.Join` is thirty lines you can read: call `__fiber_join_status`, map 0/1/2/3 to `Ok`, `Cancelled`, `Panicked`, `StackOverflow`, move the value out. There is no hidden runtime type that the source is a facade for.

## The three layers

| Layer | Owns | Where to read |
| --- | --- | --- |
| language | `spawn` syntax, `Fiber<T>` typing, capture diagnostics | [fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/) |
| runtime | stacks, scheduler, timers, owner-routed wakes, shutdown join | [fiber scheduler and stacks](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/) |
| corelib | the types on this page | [concurrency package](/platform-spec/core-library/concurrency/concurrency-package/) |

A bug in `Join` returning the wrong variant is a corelib bug. A bug in a fiber waking on the wrong scheduler is a runtime bug in `beskid_engine` or `beskid_runtime`. A bug in the compiler letting a stack reference through `spawn` is a language bug in `beskid_analysis`. Knowing which one you have is the difference between a one-line fix and a week of arguing in the wrong repository.

## Time

Sleeping and deadlines live in `Core.Time`, not in the concurrency package, because a deadline is a value and a sleep is a wait:

```beskid
use Core.Time;

match Time.Sleep(Time.FromMilliseconds(100_i64)) {
    Result::Ok(_) => (),
    Result::Error(TimerError::InvalidDuration()) => Assert.Fail("negative sleep"),
    Result::Error(_) => Assert.Fail("timer unavailable"),
};

Result<Deadline, TimerError> by = Deadline.After(Time.FromSeconds(5_i64));
```

Both return `Result` because a negative duration or an unavailable monotonic clock is an error the caller should see, not a silent zero.

## What the package does not have

No `select` statement; use `Hub`. No async iterators. No thread-affinity API, because there are no threads in the model. No `ConfigureAwait`. If you are looking for one of those, the thing you actually need is probably on the previous page.
