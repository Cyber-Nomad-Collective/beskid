---
title: "Conclusion"
description: Why Beskid exists, synthesized—and where to go next.
tableOfContents: true
---

## The short version

Beskid exists because the mainstream stack taught us to **negotiate with runtimes and frameworks** instead of **writing software**.

We are not building:

- Another **enterprise-friendly** maze of containers and reflection.
- A **colossal framework stack** you must marry to ship a form.
- A **low-level religion** where closing a ticket requires understanding borrow checker poetry.

We are building:

- A language where **features are language features**—iterators, metaprogramming, compile-time truth—not ten layers of corelib indirection.
- **IoC in the compiler**, not IoC frameworks: explicit, verifiable, compiled—not injected because we can.
- **AOT-native output** without IL handcuffs and the stagnation tax that follows.
- Opinionated defaults that respect **daily driving** (Go's honesty) without accepting **large-codebase drift** (Go's convention vacuum).

## Receipts from the chapter

| Section | Takeaway |
| --- | --- |
| [1.2 Languages](/book/00-why-beskid-exists/current-state-of-languages/) | C#/Java ship business; Go daily-drives services; Rust/Zig own the machine. |
| [1.3 Principles](/book/00-why-beskid-exists/solid-dry-and-ddd/) | SOLID/DRY are fine; DDD often becomes mandatory abstraction theatre. |
| [1.4 Trauma](/book/00-why-beskid-exists/trauma-by-developers-for-developers/) | Designer elegance ≠ field deadlines; fractured ecosystems are the real tax. |
| [1.5 Giants](/book/00-why-beskid-exists/shoulders-of-giants/) | VMs and JIT bought reach; we pay in fog and workaround languages. |
| [1.6 Memory](/book/00-why-beskid-exists/segfault-or-not-to-segfault/) | GC + small runtime wins most apps; ownership solves memory, not management. |
| [1.7 Business](/book/00-why-beskid-exists/why-are-we-making-this-so-hard/) | Most products are rows with UI; stop billing cathedrals for spreadsheets. |

## Status

Opinionated language project. Not finished. Not apologizing.

If that sounds like your kind of problem, stop ranting and start tooling.

## Next

**Practical track:** [01. Tooling and Editors](/book/01-tooling-and-editors/)

**Normative rules:** [Platform specification](/platform-spec/)

**Compiler rant source of truth:** [beskid_compiler README](https://github.com/Cyber-Nomad-Collective/beskid_compiler)
