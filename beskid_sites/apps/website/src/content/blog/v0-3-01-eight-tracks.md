---
title: "Eight Tracks, Three Days: The Integration Weekend Plan"
description: "Besid v0.3 was supposed to land compiler-mod execution, native DI, export FFI, foreign-library import, phase-B GC, corelib tiering, tooling package kinds, and CI hardening — all in one weekend. Here is what each track was, what landed, and what didn't."
date: 2026-05-23
blogStatus: released
release: v0.3
---

The v0.3 integration weekend was not a sprint. It was a stress test. The question was not "can we build all of this?" — the question was "does the architecture hold when eight different concerns collide in the same codebase at the same time?"

Three days. Eight tracks. Four landed clean. Two landed partial. Two were deferred. Here is what each track meant, what actually happened, and why.

## Compiler-mod execution

Compiler-mod execution was the track that made macros real. Before v0.3, the compiler could parse and resolve module-level constructs — but it could not *execute* them during compilation. A macro defined in a `compiler_mod` block was syntax-checked but inert.

This track wired the compiler's HIR (High Intermediate Representation) lowering path through to Cranelift codegen at compile time. The result: macros that run *in the compiler process*, generating HIR nodes that get lowered alongside hand-written code. This is not procedural-macro-as-plugin. This is the compiler evaluating its own IR.

**Status: Landed, needed more stabilization.** The execution path worked for simple cases. Edge cases around recursive macro expansion and module ordering surfaced immediately. The architecture was correct; the implementation needed another pass.

## Native DI

Dependency injection at compile time sounds like an oxymoron — DI is supposed to be a runtime concern, wires and containers and `@Inject` annotations. Beskid's native DI track asked a different question: what if the compiler resolves dependency graphs before a single instruction executes?

The compiler already knows every type, every constructor, every module path. It can compute the injection graph statically. No reflection. No runtime overhead. No "missing bean" errors in production.

**Status: Landed, scaffold only.** The resolution algorithm shipped. The graph-walking logic worked. But the ergonomics — the syntax for declaring injectable constructors, the error messages for circular dependencies — were not ready. The scaffold proved the concept; the UX would follow in v0.4.

## Export FFI

Making Beskid functions callable from C is a table-stakes feature for any language that wants to be used. Without it, you cannot write a library that anyone else can link. You cannot replace a C module with a Beskid one. You are a toy.

The export FFI track required: a stable ABI definition for Beskid types at the C boundary, codegen for function prologues that marshal arguments from C calling conventions into Beskid's internal representation, and a syntax for marking functions `#[export]`.

**Status: Partial.** The ABI contract was defined and documented. The `#[export]` attribute shipped. But not all type combinations were exercised — strings, structs with heap fields, and error-return patterns needed more test coverage before we could call it done.

## Foreign-library import

The mirror of export FFI. If Beskid functions can be called from C, C libraries must be callable from Beskid. The import syntax landed: `foreign lib "libcurl" { fn curl_easy_init() -> *mut CURL; }`. The parser, resolver, and HIR nodes all worked.

**Status: Partial.** The syntax shipped. The linking step was gated behind a feature flag. Why? Because linking against system libraries requires knowing where those libraries live on every platform — Linux, macOS, Windows. The build-system integration (pkg-config lookups, framework paths, dylib resolution) was not done. The language feature existed; the toolchain feature did not.

## Phase-B GC

Abfall, the garbage collector designed alongside the language, had been brewing since v0.2. Phase-A — the allocator, the color markers, the write barrier — existed in the `abfall` crate. Phase-B was supposed to integrate it into the runtime such that every allocation in a Beskid program flowed through abfall's managed heap.

**Status: Deferred.** The integration point — the runtime bridge — was not stable enough. We will return to this in the next post.

## Corelib tiering

Not all standard library packages are equal. Some are required for the language to boot (core types, primitive operations). Some are expected by every program (collections, I/O). Some are domain-specific (crypto, networking, graphics).

Corelib tiering proposed a three-tier model: Tier 0 (always available, no import needed), Tier 1 (stdlib, imported explicitly), Tier 2 (contrib, opt-in). The concept was sound. The actual package split — deciding which symbols go where — was deferred.

**Status: Landed as concept; actual packages deferred.**

## Tooling package kinds

The `beskid lsp` command shipped. This was not a side project — it was the first concrete deliverable of the "package kinds" architecture, which classifies every Beskid package by its role (library, binary, tool, lsp-plugin, compiler-mod). The VS Code extension bootstrapped against it.

**Status: Landed.** The LSP spoke the Language Server Protocol against real Beskid files. Hover, go-to-definition, diagnostics. Not complete — but running.

## CI and docs hardening

ASan (AddressSanitizer) was wired into CI. trudoc — the documentation verification tool that checks every code sample compiles — ran on every push to main. Blog frontmatter was validated against a schema. The result: a green CI gate that meant something.

**Status: Landed.** `verify-all-on-main` evidence recorded. The CI pipeline was no longer aspirational.

## The tally

| Outcome | Tracks |
|---|---|
| Landed clean | Compiler-mod execution, Native DI (scaffold), Tooling package kinds, CI/docs hardening |
| Landed partial | Export FFI, Foreign-library import |
| Deferred | Phase-B GC, Corelib tiering (packages) |

Four clean. Two with asterisks. Two honest deferrals. In most projects, the partials would have been marked "done" and the deferrals would have been swept under the rug. Here, the tracker recorded every gap. The cutoff was hard. The next post explains why two of those deferrals were the most important decisions of the version.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.3/version.json) — [Truncation cutoff](https://github.com/Cyber-Nomad-Collective/beskid/commit/aaddd32)
