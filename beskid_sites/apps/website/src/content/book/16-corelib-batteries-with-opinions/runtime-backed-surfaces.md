---
title: "Runtime-backed surfaces"
description: Which corelib functions are pure Beskid and which are thin wrappers over runtime builtins, and how to tell before you file the bug in the wrong repository.
tableOfContents: true
---

Open `Concurrency/Fiber.bd` and you find thirty lines of Beskid calling `__fiber_join_status`, `__fiber_join_value`, and `__fiber_detach`. Open `Core/Results/Results.bd` and you find enums and `match`. Both are the standard library. Only one of them can be understood without the runtime.

## The rule

A function whose body calls a `__double_underscore` builtin is runtime-backed. The builtin is a symbol the runtime kit exports; the Beskid wrapper validates arguments, maps status codes to typed errors, and returns. Everything else is pure Beskid and reads like application code.

| Runtime-backed | Pure Beskid |
| --- | --- |
| fibers, channels, mutex, wait group, hub | `Result`, `Option`, `TryResult` |
| `Core.Output`, `Core.Input`, `Core.Error` | `Core.String`, `Core.Text`, `Core.Encoding` |
| `Core.FS`, `Core.Time`, `Core.Process`, `Core.Environment` | `Core.Collections`, `Query` iterators |
| `Network` sockets and DNS | `Http` codec and wire format |
| `Core.Bytes.Slice` allocation | `Core.Math`, `Core.Random` |
| panic (`__panic`, `__panic_str`) | `Console.Format` markup |

`Http` is the instructive case. Parsing and serializing a message is pure Beskid in `Codec.bd` and `Wire.bd`. Moving the bytes is `IO.WriteAll` over a `TcpStream`, which is runtime-backed. The package boundary is drawn exactly there, which is why the codec has tests that never open a socket.

## Why it matters

A bug in a runtime-backed function has two possible homes. If `Fiber.Join` maps status `2` to the wrong variant, that is the wrapper and the fix is in `corelib/packages/concurrency`. If `__fiber_join_status` returns `2` when the fiber was cancelled, that is `beskid_runtime` and the fix is Rust. The wrapper is short enough to rule out in a minute, and you should, before opening a runtime issue.

The stability tiers are the other consequence. Runtime-backed surfaces change when the ABI changes, which is a versioned event with a kit to match. Pure Beskid surfaces change like any package. The `@tier` annotation on a declaration says which promise you are getting, and the standard's [stability and API shape](/platform-spec/core-library/stability-and-api-shape/) area says what each tier means.

## What is deliberately not runtime-backed

The garbage collector has no corelib surface. There is no `GC.Collect`, no finalizer registration, no weak reference type in `Core`. Cleanup is the `Disposable` contract and the scoped `use` statement, both of which the compiler can see. A finalizer is a callback the collector runs at a time nobody chose, on a thread nobody picked, and the languages that have them spend a decade documenting why you should not use them.

Contracts: [runtime-backed corelib surfaces](/platform-spec/core-library/stability-and-api-shape/runtime-backed-corelib-surfaces/).
