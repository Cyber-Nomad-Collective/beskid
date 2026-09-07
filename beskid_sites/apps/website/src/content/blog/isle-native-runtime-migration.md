---
title: "Why We Changed Our Mind About the Runtime"
description: "The ISLE-native runtime migration is not just a technical decision -- it is a philosophical shift from claiming ownership to proving correctness."
date: 2026-07-11
blogStatus: released
release: Runtime migration
---

For most of Beskid's life, the runtime was Rust. Hand-written handlers in beskid_runtime/src/builtins/*.rs. 34 frozen kernel exports. 77 soft dispatch ops routed through interop_dispatch_* envelopes. A registration chain that started in runtime_manifest.bsol and threaded through beskid_manifest, beskid_abi, beskid_analysis, beskid_runtime, and beskid_codegen.

It worked. It was also wrong.

Not wrong in the "it crashes" sense. Wrong in the "this is not verifiable" sense. Every Rust handler was a manual implementation of a spec contract. Every change to a builtin meant auditing hand-written code against a document. The gap between "what the spec says" and "what the runtime does" was filled with hope and code review -- which is to say, it was not filled at all.

## The realization

The realization came in stages. You can trace it through the commit history:

- **June 2026.** Corelib test passes against hand-written Rust handlers. Green gates. Then a gap: a handler that passed CI but violated its spec contract because the spec had changed and nobody noticed. The handler was "correct" by the old spec. The gate was green. The behavior was wrong.

- **Late June.** The runtime bridge between Beskid-managed memory and Cranelift-generated code kept sprouting edge cases. Every new language feature that touched allocation or dispatch needed a matching Rust handler. The registration chain grew. The authority chain -- runtime_manifest.bsol to beskid_manifest to beskid_abi to beskid_analysis to beskid_runtime to beskid_codegen -- was intact but brittle.

- **Early July.** The question nobody wanted to ask: what if the handlers were not Rust? What if they were ISLE rules emitting stock Cranelift CLIF -- the same CLIF the compiler already generates for user code, the same CLIF Cranelift's verifier already checks?

The answer became the [ISLE Runtime Port Design](https://github.com/Cyber-Nomad-Collective/beskid/blob/main/docs/superpowers/specs/2026-07-11-isle-runtime-port-design.md). Approved on 11 July 2026. Not a rewrite. A **shift**.

## What the shift means

| Before | After |
|---|---|
| Rust handlers for every primitive | ISLE rules emitting stock Cranelift CLIF |
| Manual parity between handler and spec | CLIF verified by Cranelift's own verifier |
| One registration chain, many hand-offs | Same authority chain, compiler-generated handlers |
| "The handler matches the spec" (trust) | "The CLIF matches the spec" (verify) |

The key constraint: **no forking Cranelift. No custom opcodes.** The ISLE layer emits exactly the CLIF that Cranelift already understands. The verifier checks it. If the CLIF is wrong, the verifier catches it -- not a code reviewer, not a test, but the same verifier that checks every other piece of generated code.

## What we are NOT doing (yet)

The design explicitly excludes:

- Replacing general HIR-to-CLIF lowering with ISLE. That stays hand-written Rust in beskid_codegen.
- Porting kernel exports (alloc, gc_*, fiber_yield, interop_dispatch_*). Those stay Rust for now.
- Porting fibers, channels, GC, composition, syscalls, or host-owned operations.
- Self-hosted handler compilation. Cohort 1 uses Rust handlers; ISLE CLIF is the target, not the starting line.

This is not a "rewrite everything in ISLE" manifesto. It is a **staged rollout** with a hard constraint: every cohort must pass parity tests before the next one starts. Rust fallbacks remain available. The migration can be abandoned at any cohort boundary with zero user-visible impact.

## Why this matters beyond the compiler

The Book chapter [Execution: ABI, host, and runtime](/book/17-execution-abi-host-runtime/) explains the domain. Compilation is the part you can screenshot for LinkedIn. Execution is the part that actually runs -- and panics, schedules fibers, and talks to the OS without asking your permission.

The ISLE shift is about making execution **provably correct** at the boundary where language law meets machine code. If the spec says a builtin SHALL behave a certain way, the ISLE rules encode that behavior. The CLIF verifier checks it. The parity tests confirm it. There is no gap between "what the spec says" and "what the runtime does" because the same artifact -- the ISLE rule -- is both the spec and the implementation.

This is the pattern Beskid keeps rediscovering: if you want correctness, make the **compiler** the authority. The ISLE shift extends that pattern from the front-end (where diagnostics are compiler-verified) and the docs (where trudoc reads api.json from the compiler) to the runtime itself.

## The struggle is the point

If you read [Trauma -- by developers, for developers](/book/00-why-beskid-exists/trauma-by-developers-for-developers/), you know the thesis: language designers ship elegant minimal cores; developers need things that actually work. The ISLE shift is that thesis applied to the runtime. A hand-written Rust handler is elegant. A verifiable CLIF handler is correct. We chose correct.

The migration is in progress. Cohort 1 (bytes_compare, str_eq, test_bytes_len, test_bytes_ptr) is the first vertical. More cohorts will follow. The blog will update as each lands -- and will not pretend a cohort is done until the parity tests pass.

Next: [The Beskid Runtime -- From gc-arena to Stock CLIF, a Two-Year Honesty Arc](/blog/beskid-runtime-honesty-arc/)

## Provenance

[Approved ISLE runtime-port design](https://github.com/Cyber-Nomad-Collective/beskid/blob/main/docs/superpowers/specs/2026-07-11-isle-runtime-port-design.md) - [ABI builtins authority](/platform-spec/execution/abi-and-host/builtins-and-symbols/adr/0003-builtin-specs-sole-clif-source/) - [runtime registration authority](/platform-spec/core-library/compiler-integration/corelib-injection-and-resolution/adr/0010-runtime-registration-authority/)
