---
title: "Ownership preview"
description: What Beskid takes from ownership thinking without importing Rust's borrow checker wholesale.
tableOfContents: true
---

Rust's ownership story is brilliant **for Rust**. Beskid's story is: **GC + static rules + spawn capture checks**—enough discipline to avoid the worst footguns without forcing `<'a>` on business logic.

## What we kept (ideas, not syntax)

| Idea | Beskid expression |
| --- | --- |
| Aliasing matters | `ref` / `out`, `mut` on bindings |
| Cross-thread/fiber safety | Channels only; `StackReferenceEscapesSpawn` diagnostic |
| Boundaries are explicit | `extern`, manifests, ABI profiles |

## What we did not cargo-cult

- Move-only default for every value
- Lifetime parameters on every struct
- `unsafe` blocks in application code as a daily tool

The **compiler host** is Rust (`beskid_analysis`, `beskid_runtime`, …) and uses Rust's ownership internally. Your Beskid sources target the **language memory model**, not `rustc`'s borrow checker.

## Closures and captures

Closures capture environment values; the compiler roots captures for **GC** when lowering `spawn`. If a capture would let stack memory outlive its frame across fibers, you get a diagnostic—not a silent segfault gift basket ([Fibers and spawn semantic rules](/platform-spec/language-meta/evaluation/fibers-and-spawn/)).

## When you need Rust-level control

Put it behind **`extern`** / native libraries with a documented ABI profile, or contribute to `compiler/crates/`—do not demand `unsafe` in Beskid because C# had `unsafe` and nobody learned anyway.

## Normative

[Memory and references](/platform-spec/language-meta/memory-model/memory-and-references/)

## Next

[Unsafe and extern preview](/book/10-memory-without-billion-dollar-mistake/unsafe-and-extern-preview/)
