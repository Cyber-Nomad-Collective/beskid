---
title: "Ownership preview"
description: What Beskid takes from ownership thinking without importing Rust's borrow checker wholesale.
tableOfContents: true
---

Rust's ownership story is brilliant **for Rust**. Beskid's story is **GC + static rules + spawn capture checks**: enough discipline to avoid the worst footguns without forcing `<'a>` on business logic.

## What we kept (ideas, not syntax)

| Idea | Beskid expression |
| --- | --- |
| Aliasing matters | `ref` / `out`, `mut` on bindings |
| Cross-thread/fiber safety | Channels only; `StackReferenceEscapesSpawn` diagnostic |
| Deterministic cleanup | Scoped `use` over `Disposable` |
| Boundaries are explicit | `extern`, manifests, ABI profiles |

## What we did not cargo-cult

- Move-only default for every value
- Lifetime parameters on every struct
- `unsafe` blocks in application code as a daily tool

The **compiler host** is Rust (`beskid_analysis`, `beskid_engine`, `beskid_aot`, …) and uses Rust's ownership internally. Your Beskid sources target the **language memory model**, not `rustc`'s borrow checker.

## Closures and captures

Closures capture environment values; the compiler roots captures for **GC** when lowering `spawn`. If a capture would let stack memory outlive its frame across fibers, you get a diagnostic (**E1225**, `StackReferenceEscapesSpawn`), not a silent segfault gift basket. See [fibers and spawn semantic rules](/platform-spec/language-meta/evaluation/fibers-and-spawn/).

## Deterministic cleanup without a borrow checker

The one place Beskid does ask you to think about lifetimes explicitly is the scoped `use Type name = expr;` statement: the bound value must conform to `Core.Disposable`, the enclosing function must return a `Result` so a failed `Dispose()` has somewhere to go, and bindings dispose in reverse order on every exit path, including an early `return` or `?`. That is deterministic cleanup, not garbage collection with extra steps, and it is covered in full in [contracts, effects, and other polite threats](/book/09-contracts-effects-and-polite-threats/effects-and-purity/).

## When you need Rust-level control

Put it behind **`extern`** / native libraries with a documented ABI profile, or contribute to `compiler/crates/`. Do not demand `unsafe` in Beskid because C# had `unsafe` and nobody learned anyway.

See also [memory and references](/platform-spec/language-meta/memory-model/memory-and-references/).
