---
title: "gc-arena: The Runtime Spike That Taught Us to Retreat"
description: "Before Beskid had a runtime, it had a research spike. The gc-arena crate asked: can we build a garbage collector out of Rust arena allocators? The answer was 'probably, but not yet' — and that pattern of honest retreat became the project's default stance."
date: 2026-02-24
blogStatus: released
release: Runtime
---

Before the project was called Beskid, before the compiler had its own repository, before there was a platform spec or a Book or a CI pipeline — there was Pecan. And in Pecan, there was `gc-arena`.

## What gc-arena was

The `gc-arena` crate was a research spike with a single question: can you build a garbage collector out of Rust arena allocators? Rust arenas — bump allocators that free everything at once when the arena is dropped — are fast, simple, and safe. A generational GC built on arenas would inherit that simplicity: allocate into a nursery arena, promote survivors to an older arena, collect by dropping the nursery. No tracing, no mark-sweep, no write barriers. Just arena lifecycle management dressed up as generational collection.

The crate was a workspace member. It had scaffolding. It had documentation. It had tests that sketched the API: `Gc<T>`, `GcCell<T>`, allocation in arena scopes, a root set, collection triggers. It looked plausible.

## What we learned

It was plausible but not ready. The gap between "arenas can approximate nursery collection" and "a correct GC for a language with fibers, channels, and FFI" was larger than the crate could bridge in a spike. Several specific problems emerged:

- **Arena lifetimes and GC roots**. A GC root can outlive any single arena scope — a global channel receiving a value from a fiber that has already collected its nursery. Arena-based collection works when lifetimes are stack-like; GC-managed heaps require the opposite.
- **Promotion precision**. Moving an object from nursery to tenured space requires knowing every pointer to it. Arena bump allocators give you allocation speed but not pointer maps.
- **Integration surface**. The GC has to know about stack maps from Cranelift, about fiber stacks, about what the ABI says is a root. An arena crate can't answer those questions alone — it needs the full compiler pipeline.

The commit message told the truth: "Add gc-arena workspace members and runtime GC scaffolding documentation." Scaffolding existed. Documentation existed. The claim did not. There was no "we have a GC." No "experimental GC available." Just: we looked at this, here is what we found, here is what's missing, moving on.

## The pattern that stuck

The decision to retreat from `gc-arena` was not failure. It was the first instance of a pattern that would define the project:

1. **Try something.** Build the spike, write the code, get it to compile.
2. **Document what you learned.** Not just what worked — what didn't, and why.
3. **Retreat if it's not ready.** No "experimental" labels, no half-finished features shipped to production.
4. **Keep the scaffolding.** The design notes and API sketches from `gc-arena` fed directly into the `abfall` GC design two months later.

This pattern — try, learn, document, retreat — became the default stance for every runtime decision after. It is why the v0.3 GC landing was deferred instead of shipped broken. It is why the ISLE shift in July 2026 was a boundary change, not a rewrite. It is why the project has a Book chapter called [Memory without another billion-dollar mistake](/book/10-memory-without-billion-dollar-mistake/) instead of a wiki page called "GC is hard."

## What survived

`gc-arena` the crate is gone from the workspace. But its design notes live in the `abfall` GC specification. Its API sketch — `Gc<T>`, root sets, collection scopes — shaped how the language-law GC model is documented. And its retreat set the expectation: Beskid does not ship runtime features it cannot prove correct.

The nursery lives in the design. The honesty lives in the process.
