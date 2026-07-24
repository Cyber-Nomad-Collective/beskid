---
title: "The Runtime Bridge That Wasn't Ready"
description: "The abfall GC integration and runtime bridge tracks were the most honest failures of v0.3. The design was sound. The code existed. But the seam between Beskid-managed memory and Cranelift-generated code was not stable enough to ship."
date: 2026-05-24
blogStatus: released
release: v0.3
---

The runtime bridge was the seam between two worlds: Beskid-managed memory on one side, Cranelift-generated machine code on the other. Every allocation, every garbage collection cycle, every fiber yield crossed that seam. In v0.3, it was not ready — and we said so.

## What the bridge was

The bridge was not a single function. It was a protocol. When a Beskid program allocates a value, the compiler emits a call to the runtime allocator. When the garbage collector needs to scan roots, it walks the stack frames that Cranelift generated. When a fiber yields, the runtime must save the register state that Cranelift laid out.

Each of these operations required the compiler and the runtime to agree on everything: calling conventions, stack layout, root-set enumeration, safepoint placement. The bridge was the set of conventions — and the code — that made that agreement possible.

In v0.2, the bridge was a sketch. The runtime manifest (`runtime_manifest.bsol`) declared the shape of the runtime. The `beskid_manifest` crate parsed it. `beskid_abi` defined the calling conventions. `beskid_analysis` computed safepoints. `beskid_runtime` provided the Rust handler implementations. `beskid_codegen` wired them into Cranelift's IR.

Five crates. One chain. Every link had to be correct.

## What abfall GC integration required

Abfall was not a bolt-on. It was designed as a precise, moving, generational collector. To integrate it, the bridge had to support:

- **Write barriers.** Every pointer store into a heap object had to notify the collector. The compiler had to emit barrier code at every store site — not as an optional optimization, but as a correctness requirement.
- **Root-set enumeration.** The collector needed to know which registers and stack slots held live pointers at every safepoint. Cranelift does not natively expose this; the bridge had to reconstruct it from Cranelift's internal IR metadata.
- **Safepoint placement.** The collector could only run at safepoints — points where the root set was fully described. Placing safepoints too often killed performance. Too rarely, and GC latency spiked.

The design was sound. The `abfall` crate itself — the allocator, the color markers, the write barrier logic — was working. But the bridge code that connected abfall to Cranelift was fragile. It worked on the happy path. It broke under concurrency. It broke under specific register-allocation patterns. It broke in ways that took days to reproduce.

## Why it failed at the v0.3 cutoff

Three days was the integration weekend window. The GC track needed the bridge to be stable *before* the weekend started — the weekend was supposed to be for integration testing, not for debugging the bridge itself.

By Friday evening, it was clear: the bridge was not stable enough. We could have shipped it anyway. We could have merged the abfall integration behind a feature flag, marked it "experimental," and moved on. Many projects do exactly that.

We didn't.

## The decision not to ship a broken GC

"Experimental" is a word that rots. Once a feature is merged — even behind a flag — it becomes part of the project's surface area. Someone writes a blog post about it. Someone builds a prototype on it. Someone files a bug against it. The feature accrues expectations.

If the feature is broken, those expectations curdle into frustration. And the people who fix it — if anyone ever does — are not the people who shipped it. They inherit the design decisions, the rushed interfaces, the undocumented corner cases. They spend months unwinding choices made in a three-day weekend under a "ship it" mandate.

We deferred the GC track because we did not want to create that graveyard. We did not want the first question about Beskid's memory model to be answered with "well, it's experimental, but..."

## The pattern of honest deferral

This pattern — try, learn, document, retreat — was not new to v0.3. It started with the `gc-arena` research spike a year earlier, and it would become the project's default stance. When something is not ready, you say so. You record the gap in the tracker. You move on to the things that *are* ready. You do not pretend.

Two months later, the ISLE-native runtime migration would revisit the bridge from the other direction. Instead of Rust handlers emitting machine code through a fragile seam, ISLE rules would emit stock Cranelift CLIF — the same IR the compiler already verified for user code. The bridge problem did not disappear. It dissolved.

But that realization was not available in May 2026. The honest answer was "not yet." And that answer, at the time, was the right one.

Read more: [Memory without another billion-dollar mistake](/book/02-memory-without-another-billion-dollar-mistake/) — [Execution: ABI, host, and runtime](/book/05-execution-abi-host-and-runtime/) — [The ISLE-native runtime migration](/blog/isle-native-runtime-migration/)

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.3/version.json) — [Truncation cutoff](https://github.com/Cyber-Nomad-Collective/beskid/commit/aaddd32)
