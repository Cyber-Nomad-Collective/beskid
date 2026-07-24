---
title: "ABI v5, Capturing Closures, and Why ABI Versioning Is the Most Political Decision in a Language"
description: "July 2026. Beskid's ABI hit v5. Capturing closures needed a runtime contract. Fiber spawn boundaries needed a convention. The current-root helper got migrated. ABI versioning is not engineering — it is diplomacy with consequences measured in linker errors."
date: 2026-07-21
blogStatus: released
release: Compiler
---

import { BlogIndex } from '../../../components/BlogIndex.astro';

If you want to start an argument in a language design meeting, propose an ABI change.

ABI — Application Binary Interface — is the contract that governs how compiled code talks to itself. How functions are called. How closures capture their environment. How fibers get spawned. How the stack is laid out. Break the ABI and every compiled artifact in existence stops working. Get it right and nobody notices. Get it wrong and the linker errors are your only feedback.

In July 2026, Beskid shipped ABI v5. It was the most politically charged change in the compiler's history — and also one of the most necessary.

## The five commits

ABI v5 didn't land in one commit. It landed in five, each addressing a different dimension of the contract:

- **[`2b81a5b3`](https://github.com/opencp/beskid/commit/2b81a5b3)** — "advance compiler ABI and syntax closure integration." The flag-day commit that bumped the version number and told the compiler to emit the new calling conventions.
- **[`9d9791a9`](https://github.com/opencp/beskid/commit/9d9791a9)** — "ABI-v5 capturing closure/spawn lowering tip." How closures are lowered when they cross a spawn boundary: the closure environment gets packed into a heap-allocated frame that the runtime can root for GC.
- **[`51d15056`](https://github.com/opencp/beskid/commit/51d15056)** — "ABI-v5 closure environment runtime contract." The runtime side: what the GC expects to find in a closure frame, how the rooting works, where the captured variables live.
- **[`dc5a57f8`](https://github.com/opencp/beskid/commit/dc5a57f8)** — "canonical ABI-v5 fiber spawn boundary." The spawn convention: when a fiber starts, what its initial stack frame looks like, how arguments are passed from the spawning fiber to the spawned one.
- **[`927a0218`](https://github.com/opencp/beskid/commit/927a0218)** — "current-root helper normative migration for 0.4." The `current-root` helper — the function that tells the runtime "this is the root of the current fiber's stack" — got a new calling convention. Every compiled program had to be rebuilt. CI caught the ones that weren't.

## What ABI versioning actually means

An ABI is a contract between three parties: the compiler, the runtime, and every compiled artifact. The contract specifies:

- **Calling conventions.** How arguments are passed (registers? stack? which registers?). How return values come back. Who cleans up the stack frame.
- **Closure layout.** How a closure stores its captured variables. Does it get a flat array? A struct with named fields? How does the runtime find the GC roots inside a closure?
- **Fiber spawning.** When a fiber is spawned, what does its initial stack look like? How are arguments transferred? Who owns the closure environment after the spawn?
- **Runtime helpers.** Functions like `current-root` that the compiler calls into the runtime. Their signatures, their calling conventions, their expectations about what's on the stack.

Change any of these and you've broken binary compatibility. Old compiled code won't link against a new runtime. New compiled code won't run on an old runtime. The only safe move is to rebuild everything — every package, every binary, every cached artifact.

## The closure environment runtime contract

The heart of ABI v5 was the closure environment. Before v5, closures stored captured variables inline in a compiler-determined layout. The runtime had to reverse-engineer the compiler's decisions to find GC roots — fragile, version-dependent, and a source of subtle memory bugs.

The v5 contract made the layout explicit. A closure frame is now a heap-allocated structure with a fixed header that the runtime can inspect. The header says: "here are the GC roots, here's how many, here's the type of each." The compiler guarantees the layout. The runtime trusts it. The contract is in the ABI version number — if the layout changes, the version bumps.

The spawn boundary got the same treatment. Before v5, spawning a fiber with a capturing closure was an implicit operation — the compiler lowered it however it wanted, and the runtime had to cope. After v5, the spawn boundary is a documented ABI surface: the closure frame gets packed into a spawn descriptor, the runtime unpacks it on the other side, the GC roots are registered before the fiber starts executing.

## Why this is political

ABI changes break things. They break downstream packages that haven't been rebuilt. They break cached build artifacts. They break tooling that assumes a stable binary format. They break debugging workflows that know the old calling conventions.

So every ABI change is a negotiation. The compiler team wants to fix design debt — the old closure layout was a hack, the old spawn convention was implicit and fragile. The infrastructure team wants stability — every rebuild costs CI minutes, every cache invalidation slows down development. The package ecosystem wants compatibility — if an ABI bump means every package needs a new release, that's coordination overhead measured in days or weeks.

You can't skip ABI changes. The old ABI accumulates design debt the same way code does — every workaround, every implicit convention, every "the runtime will figure it out" assumption is interest you'll pay later. But you can't ship them lightly either. Each one is a flag day.

The `current-root` helper migration is the perfect example. It's a single function with a single purpose: tell the runtime which stack frame is the root of the current fiber. Changing its calling convention was a one-line diff in the compiler. But it meant that *every compiled program* had to be rebuilt. Every CI pipeline had to be flushed. Every developer had to `cargo clean` and rebuild. The one-line change cascaded into weeks of coordination.

## The Book chapters

Two Book chapters are essential reading here. ["Execution: ABI, host, and runtime"](https://opencp.org/book/execution/abi-host-runtime) covers the contract in detail — what the ABI specifies, how the host interacts with compiled artifacts, what the runtime expects. ["Fibers and spawn"](https://opencp.org/book/execution/fibers-and-spawn) covers the spawn boundary specifically — how fibers are created, how arguments cross the boundary, what happens to the closure environment when a fiber starts executing.

Together they make the case that ABI design is infrastructure design. It's not the fun part of language work. It's the part where you make promises and keep them, sometimes for years, until the cost of keeping the promise exceeds the cost of breaking it.

## The discipline

ABI versioning is not about clever engineering. The clever engineering is in the closure layout, the spawn convention, the GC rooting strategy. The versioning is about having the discipline to break things when the alternative is worse — and the discipline to coordinate the breakage so that downstream consumers don't get surprised.

ABI v5 was the right break at the right time. The closure layout was accumulating hacks. The spawn boundary was implicit and fragile. The `current-root` helper was a legacy convention that didn't match the new fiber model. Waiting would have made the eventual break worse. Shipping it meant weeks of rebuilds — but the alternative was years of design debt.

That's the political calculus. That's why ABI versioning matters. And that's why, the next time someone proposes an ABI bump in a language design meeting, you should listen carefully — because the technical arguments are the easy part. The hard part is everything else.

<BlogIndex />
