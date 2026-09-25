---
title: "Panic vs contract"
description: Contract failures happen at compile time. Panics happen at runtime, once, and are not an error strategy.
tableOfContents: true
---

Two words that both mean "something is wrong", at opposite ends of the pipeline.

A **contract failure** is a compile-time diagnostic. Missing `Dispose()` on a type that claims `Disposable` is E1601 in the editor, not a stack trace in production. You fix the type and the build goes green.

A **panic** is a runtime trap. An invariant that the type system could not express was violated, the program has no correct state to continue from, and the runtime stops the fiber. The corelib panics when `Slice` is asked for a range that is provably impossible, when a runtime status comes back in a state the wrapper does not know, and when `Core.Output.Write` itself fails, since there is nowhere left to report that. Those are bugs, not conditions.

## What panic is for

| Mechanism | Use it for |
| --- | --- |
| `Result` and `?` | anything a caller could reasonably handle: a missing file, a refused connection, a malformed request |
| `test` assertions | expectations inside a test harness, reported through the runner |
| panic | a broken invariant, a corrupted handle, a state the code declares impossible |

If you find yourself wanting to catch a panic, the thing you wanted was a `Result`. There is no `catch` for panics in application Beskid, and that is deliberate. Java taught two generations of developers that `catch (Exception e) { log.warn(e); }` is a recovery strategy. It is a way to keep a process running after it has stopped being correct.

## Panics in fibers

A panic in a spawned fiber does not take the process down. It ends that fiber, and the parent finds out through the handle:

```beskid
Fiber<i64> worker = spawn Compute(input);
match worker.Join() {
    Result::Ok(value) => Output.WriteLine("got ${value}"),
    Result::Error(FiberError::Panicked(code, message)) => Output.WriteLine("worker died: ${message}"),
    Result::Error(FiberError::Cancelled(_, _)) => Output.WriteLine("worker cancelled"),
    Result::Error(FiberError::StackOverflow(limit, wanted)) => Output.WriteLine("stack: ${wanted} > ${limit}"),
};
```

The panic becomes a typed `FiberError::Panicked` with the message. That is the one place a panic is observable as a value, and it is observable because the fiber boundary is exactly where "this unit of work failed" is a meaningful fact for someone else to act on. Chapter 11.

## Panics at the FFI boundary

A panic must not unwind through a foreign frame. Native callers, and native code Beskid calls, do not know how to unwind a Beskid stack, and the reverse is also true. The ABI profile decides who translates a trap into an error envelope at the edge. Chapter 21 and the [error and unwind semantics](/platform-spec/language-meta/interop/interop-contracts/error-and-unwind-semantics/) feature.

## Analyzer mods do not panic into your build

A mod's `Analyzer` reports diagnostics and offers rewrites. It does not throw into the compiler process. If the host cannot apply a rewrite it fails closed with an E18xx diagnostic, and your build stops with a message instead of a crashed compiler. Chapter 15.

Runtime panic policy is in the standard's [panic, IO, and syscalls](/platform-spec/execution/runtime/panic-io-and-syscalls/) feature.
