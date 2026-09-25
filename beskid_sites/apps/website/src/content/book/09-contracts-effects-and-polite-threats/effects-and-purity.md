---
title: "Effects and purity"
description: Where compile time ends and runtime begins, what the compiler proves about each, and the practical purity rules that do not need a monad.
tableOfContents: true
---

"Effects" here is not a monad tutorial. It is the question of what happens when, and which of it the compiler can see.

## Compile time: mods

Metaprogramming runs inside the compiler as AOT-compiled mod packages. A `Generator` emits typed syntax, an `Analyzer` reports diagnostics and proposes rewrites, the host merges the result and re-parses under a bounded number of rounds. All of it happens before lowering, and none of it exists at runtime. There is no reflection to inspect the generated code from inside the program, because there is nothing to inspect: after the merge it is ordinary source.

This is the replacement for Roslyn source generators, and the difference is that a mod is a Beskid package with a version, not a NuGet-delivered compiler component that has to match the SDK patch level on every machine in CI. Chapter 15.

## Runtime: I/O, fibers, native calls

Everything that touches the world goes through a documented surface:

- Console and files through `Core.Output`, `Core.Input`, `Core.FS`.
- Bytes through the `Core.IO` contracts (`Reader`, `Writer`, `Stream`, `Closer`).
- Sockets through the `Network` package, HTTP through `Http`.
- Concurrency through `spawn`, `Fiber<T>`, and `Channel<T>`.
- Native code through `extern` declarations with an ABI profile.

The language does not pretend `Output.WriteLine` is pure. It also does not track it in the type system. There is no `IO` monad and no effect annotation on functions. What there is instead is a set of structural rules the compiler does enforce:

| Rule | Diagnostic |
| --- | --- |
| A stack reference cannot be captured across `spawn` | E1225 |
| A closure that consumes a captured `Fiber<T>` cannot be called twice | rejected at the capture |
| A scoped `use` value must satisfy `Disposable` and live in a `Result`-returning function | E-band on the `use` |
| `async` and `await` are reserved and rejected | reserved-keyword diagnostics |

Each of those is a specific bug class with a specific rule, which is a different philosophy from "mark everything that does I/O and hope the annotation is honest".

## Purity, the pragmatic version

- Domain logic takes values and returns `Result`. No `Output`, no sockets, no clock. It is the code you unit-test with `test` items and nothing else.
- I/O lives at the edges, in functions whose names say so, behind `Result` types that say what can go wrong.
- Cross-fiber data moves through channels. Shared mutable state guarded by a `Mutex` is for invariants, not for passing messages.
- Native code lives behind one `extern` boundary per library, tested as an adversary.

You will not get a diagnostic for putting `Output.WriteLine` in the middle of a pricing function. You will get a pricing function nobody can test, which was true in every other language too. The compiler's job is to make the edges explicit; keeping them there is yours.

Runtime surfaces are specified across [evaluation](/platform-spec/language-meta/evaluation/), [execution](/platform-spec/execution/runtime/), and [core library](/platform-spec/core-library/); compile-time metaprogramming is in [metaprogramming](/platform-spec/language-meta/metaprogramming/metaprogramming/).
