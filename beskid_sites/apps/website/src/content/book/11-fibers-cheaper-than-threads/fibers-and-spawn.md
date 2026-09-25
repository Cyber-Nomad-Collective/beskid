---
title: "Fibers and spawn"
description: "spawn returns a move-only Fiber<T>. Join takes the result once, Detach gives up the handle, Cancel asks nicely."
tableOfContents: true
---

```beskid
Fiber<i64> worker = spawn DoWork(42);
```

`spawn expr` schedules `expr` on a new fiber and returns a `Fiber<T>` where `T` is what the expression returns. The expression is a call or a closure. You do not get the `i64` from `spawn`; you get a handle, and the handle has three operations.

## The handle

```beskid
pub type Fiber<T> {
    i64 handle,

    pub Result<T, FiberError> Join() { ... }
    pub unit Detach() { ... }
    pub unit Cancel() { ... }
}
```

That is the entire type, from `corelib_concurrency`. The runtime does the work; the type is a thin, typed wrapper you can read in one screen.

**`Join`** waits for the fiber to finish and moves its result out. It consumes the handle. You cannot join twice, because there is one result and it has been moved.

**`Detach`** consumes the handle and waives the join. The fiber keeps running; nobody will collect its result; when `Main` returns the runtime will not wait for it.

**`Cancel`** requests cancellation and does not consume the handle. Calling it twice is the same as calling it once. The fiber sees the cancellation at its next blocking point, and `Join` on a cancelled fiber returns `FiberError::Cancelled`.

The handle is move-only. Assigning it to a second binding moves it; using the first afterwards is a diagnostic. A closure that consumes the handle cannot be a repeatable closure. This is the ownership discipline chapter 10 promised: not on every value, only on the ones where a double use is a real bug.

## What Join returns

```beskid
pub enum FiberError {
    Cancelled(i64 reason, i64 cancelerId),
    StackOverflow(i64 limitBytes, i64 requestedBytes),
    Panicked(i64 code, string message),
}
```

A child that panics does not crash the process. Its panic becomes `FiberError::Panicked` with the message, delivered to whoever joins. A child that blows its stack budget becomes `StackOverflow` with the numbers. This is the one place in the language where a panic is a value, and it is because the fiber boundary is exactly where "this unit of work died" is actionable.

## Shutdown

When `Main` returns, the runtime joins every fiber that was not detached. A forgotten `Fiber<T>` binding that was never joined or detached keeps the process alive until that fiber completes. If that is not what you meant, `Detach` it, or better, `Join` it and handle the result, since a fiber whose result nobody reads is usually a fiber whose error nobody reads either.

## Rules the compiler enforces

| Rule | What you see |
| --- | --- |
| stack reference captured across `spawn` | E1225 |
| handle used after `Join` or `Detach` | use-after-move diagnostic |
| closure that consumes a captured handle is called repeatedly | rejected at the closure |
| `async` or `await` anywhere | reserved-keyword error |

Cross-fiber data goes through channels, next page. Two fibers sharing a mutable record and hoping the scheduler interleaves them kindly is the pattern that already has a body count in every language that allowed it.

Language rules: [fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/). Runtime: [fiber scheduler and stacks](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/).
