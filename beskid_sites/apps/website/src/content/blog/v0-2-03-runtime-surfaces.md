---
title: "Fibers, Channels, and abfall: The Runtime Declarations of v0.2"
description: "v0.2 surfaced runtime work that had been brewing since Pecan: fibers, channels, GC integration, the pipeline/services split. These were not finished features. They were declarations of intent — the compiler would verify what the spec said."
date: 2026-05-15
blogStatus: released
release: v0.2
---

v0.2 was not supposed to be a runtime release. It was a documentation release — the platform-spec cutover, trudoc, the Book split. But the runtime work that had been brewing since Pecan surfaced anyway, in a single commit that touched every major compiler domain.

## The commit

The commit that landed fibers, channels, abfall GC integration, and the pipeline/services split was not a clean, atomic change. It touched the assembly pipeline, the DI hub, macros, and submodule bumps all at once. It was not polished. It was not fast. But it compiled, and the CI gate was green.

These were not finished features. They were **declarations of intent**.

## Fibers and spawn

Fibers are the concurrency primitive: user-space, cooperatively scheduled, lighter than OS threads. The `spawn` keyword declares a new fiber. The compiler knows about fibers at the semantic level — it can verify that fiber boundaries are explicit, that shared state is visible, that the scheduler has enough information to make decisions.

In v0.2, fibers were a spec declaration and a compiler stub. The actual scheduler did not exist yet. The runtime support was minimal. But the compiler knew fibers existed, and the spec said what they would do. That is more than most language projects have at this stage: a **verified contract** between the language semantics and the compiler's understanding of them.

## Channels

Channels are the communication primitive between fibers. The spec declared typed, bounded, compiler-verified channels. Send and receive operations with explicit blocking semantics. The compiler knew the types, the bounds, the blocking points.

Again: not implemented. Declared. The distinction matters. A declaration says "this will exist and here is the contract." An implementation says "here is how it works today." By separating them, v0.2 locked in the contract before the implementation. If the implementation changes later, the spec does not drift — the compiler gate catches it.

## abfall GC integration

abfall is Beskid's garbage collector. v0.2 declared the GC integration points: where allocation happens, where roots are traced, where collection can trigger. The compiler knew about GC at the IR level — it could verify that allocation sites were annotated, that root sets were complete, that the stack map was correct.

This was not a working GC. It was a **compiler-aware GC contract**. The spec said what GC would do. The compiler verified that code followed the contract. The runtime implementation came later — but when it came, it had a compiler that already understood the rules.

## Pipeline/services split

The pipeline/services split separated the compiler's assembly pipeline from its dependency injection hub. Before the split, they were coupled — changing how a pass was scheduled might break how services were resolved, and vice versa. The split declared that pipelines transform code and services provide capabilities, and they should not share a configuration system.

This was a **compiler architecture** decision that surfaced as a runtime declaration. It said: the compiler's own internals should follow the same discipline we demand of user code. Explicit boundaries. Single responsibility. Verified contracts.

## Declarations, not features

If you read v0.2 expecting a working concurrency runtime, you will be disappointed. These were not finished features. They were the scaffolding: the spec says X, the compiler verifies X, the runtime will implement X. The contract came first. The implementation came later.

If you want to see where those declarations led, skip ahead to [the ISLE runtime migration](/blog/isle-native-runtime-migration/). The path from v0.2's "fibers and channels" to v0.4's "stock Cranelift CLIF for primitive handlers" is not a straight line. It is a story of discovering that the most honest runtime is the one that does the least.

Read [Fibers: cheaper than threads](/book/14-from-source-to-runs/) and [Memory without another billion-dollar mistake](/book/14-from-source-to-runs/) in the Book for the full runtime story.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.2/version.json) - [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.2/article.md) - [delivery cutoff](https://github.com/Cyber-Nomad-Collective/beskid/commit/f57377a)
