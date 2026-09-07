---
title: "One Corelib, One Truth: The Nested Submodule Pattern"
description: "Besid v0.1 shipped the compiler's nested corelib submodule as the single source of truth for the standard library. No forks. No drift. One canonical corelib, and the compiler gate ran against exactly that version."
date: 2026-04-05
blogStatus: released
release: v0.1
---

Every language needs a standard library. Every standard library starts as a mess.

The mess is structural, not moral. You start with a few types you need — strings, arrays, a map type, some I/O primitives. You put them somewhere. The compiler needs to find them. Then you add more types. Then someone forks the standard library for a tool. Then the tool diverges. Then the compiler tests pass against one version of the standard library but the CLI ships with another. Then nobody knows which one is authoritative.

This is the **corelib conundrum**. Every language project hits it. Most of them paper over it with symlinks, submodules that drift, and a README that says "make sure these stay in sync" — as if documentation ever prevented drift.

## How Beskid v0.1 solved it

v0.1 shipped the compiler's nested corelib submodule as the **single source of truth** for standard-library code.

One canonical corelib. The compiler repository contained it as a nested submodule. Standalone compiler CI pulled it. CLI provisioning pulled it. The compiler gate ran against exactly that version — not "whatever happens to be on disk," not "the latest commit on main," but a deliberate, tested, pinned submodule reference.

There were no forks. There was no drift. There was one corelib, and the compiler gate said it was correct.

## The commit journey

The commit history from March–April 2026 tells the story in three acts:

**Act one**: "single corelib via compiler nested submodule." The initial decision: put the corelib inside the compiler repository as a submodule. One reference. One version. One truth.

**Act two**: "stdlib embed + corelib submodule." The discovery that the CLI needed the standard library embedded for distribution, not just referenced at build time. The submodule pattern held — the embed pulled from the same pinned commit.

**Act three**: "Limit CI submodule checkout." The optimization. CI does not need the full corelib history. It needs the pinned commit and nothing else. Shallow clones, faster builds, same guarantee.

The pattern is unmistakable: ship, discover the edge case, fix the edge case, ship again. No grand design. Just incremental honesty — and a refusal to let the corelib fragment.

## Compare to the .NET BCL

If you want to see what the alternative looks like, examine the .NET Base Class Library. You have `System`. You have `System.Core`. You have `Microsoft.Extensions.*` — a namespace so sprawling it needs its own taxonomy. You have layering designed by committees over two decades, with types that exist because removing them would break something, and nobody remembers what that something is.

The Beskid v0.1 corelib was tiny by comparison. A handful of types. A few primitives. Barely enough to write a non-trivial program.

It was also **correct** — or at least, the compiler gate said it was. That is more than most standard libraries can claim on their first release.

## Graph-based standard-library injection

Under the hood, v0.1's approach was not just "put files in a folder." The compiler injected the corelib into the module graph at a well-defined point — before user code, after the built-in primitives. This meant the corelib could use primitives but could not accidentally depend on user code. It meant the compiler knew exactly which symbols came from the corelib and which came from the user. It meant diagnostics could say "the corelib defines this" and mean it.

The Book chapter [Corelib: batteries with opinions](/book/06-corelib-batteries-with-opinions/) expands on this: a standard library is not just a collection of useful types. It is an **opinion** about what a language should provide by default. v0.1's corelib was a small opinion. But it was the right one, and it was the only one.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.1/version.json) — [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.1/article.md) — [delivery cutoff](https://github.com/Cyber-Nomad-Collective/beskid/commit/f777b79)
