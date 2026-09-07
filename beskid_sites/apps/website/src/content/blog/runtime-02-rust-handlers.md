---
title: "34 Kernel Exports, 77 Dispatch Ops, and One Registration Chain"
description: "When the compiler became its own repository, the runtime model solidified: hand-written Rust handlers, frozen kernel exports, soft dispatch ops, and a registration chain threading through every crate. It worked. For a while."
date: 2026-04-10
blogStatus: released
release: Runtime
---

When the compiler split from Pecan into its own repository at v0.1, the runtime needed a shape. Not a research spike — a real runtime that could execute corelib tests, pass CI on three platforms, and back every language feature in the Book.

The shape it took was the **Rust-first runtime**.

## The architecture

The pipeline was clean on paper:

```
runtime_manifest.bsol → beskid_manifest → beskid_abi
                                              ↓
                  beskid_runtime ← beskid_codegen ← beskid_analysis
```

The `runtime_manifest.bsol` declared what the runtime could do — 34 frozen **kernel exports** and 77 **soft dispatch ops**. `beskid_manifest` generated Rust tables from the manifest. `beskid_abi` consumed those tables as ABI contracts. `beskid_runtime` implemented every kernel export and dispatch op as a hand-written Rust handler in `beskid_runtime/src/builtins/*.rs`. `beskid_codegen` generated calls to those handlers.

The frozen kernel exports were the non-negotiable surface: `alloc`, `gc_*` family, `fiber_yield`, `interop_dispatch_*`. These were frozen because changing them meant changing the ABI, which meant recompiling every Beskid program that had ever been compiled.

The 77 soft dispatch ops were the negotiable surface: string operations, numeric conversions, bytes manipulation, type introspection. These could be extended, reordered, or deprecated across ABI versions — dispatched through envelopes that mapped op codes to handler functions.

## The registration chain

The registration chain was the thread that held it together. Every crate in the pipeline registered itself:

1. `runtime_manifest.bsol` registered the authority.
2. `beskid_manifest` registered the generated tables.
3. `beskid_abi` registered the contracts those tables encoded.
4. `beskid_runtime` registered the handler implementations.
5. `beskid_codegen` registered the dispatch sites.

If a crate tried to use a kernel export that wasn't in the manifest, the build broke. If a handler didn't match its ABI contract, the linker complained. The chain was a compile-time firewall.

## Why it worked

It worked because it was simple. Every handler was a Rust function. Every dispatch was a match arm. Every test ran against real code, not generated code. The corelib gate was green. CI passed on Linux, macOS, and Windows. For three months, this was the runtime.

The Book chapter [Fibers and spawn](/book/11-fibers-cheaper-than-threads/fibers-and-spawn/) explains what the runtime was supposed to do: spawn lowers to `fiber_spawn`, builtins align with the ABI spec, codegen must not invent alternate calling conventions. The Rust handlers did all of that.

## The early cracks

What they did not do was **prove** it.

The v0.3 integration weekend (May 2026) was supposed to land phase-B GC work — the next iteration of the `abfall` design that had grown out of the old `gc-arena` spike. It did not land. The runtime bridge — the seam between Beskid-managed memory and Cranelift-generated code — was not stable enough. The handlers emitted the right opcodes, but the GC needed stack maps, and the stack maps weren't reliable across all three platforms.

Rather than ship a broken GC and call it "experimental," we deferred. The pattern from `gc-arena` held: document, retreat, keep the scaffolding.

But a bigger crack was forming — one that wouldn't become visible until June.

Every Rust handler was an opaque blob to the compiler. The compiler could call the handler. It could not inspect it. If the spec said `bytes_compare` returned a signed integer and the handler returned an unsigned one, nothing in the pipeline would notice. The CI gate would stay green. The behavior would be wrong — silently.
