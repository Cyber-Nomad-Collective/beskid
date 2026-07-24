---
title: "Stock CLIF, ISLE Rules, and the Correctness Contract"
description: "The shift: instead of Rust handlers emitting machine code, ISLE rules emit stock Cranelift CLIF. No forking Cranelift. No custom opcodes. The same verifier that checks user code now checks the runtime."
date: 2026-07-11
blogStatus: released
release: Runtime
---

The gap discovered in June 2026 — green CI, wrong behavior, no way to detect it — demanded an answer. The answer was not "write better Rust handlers." It was not "add more code review." It was a boundary change.

## What ISLE rules are

ISLE is Cranelift's instruction selection and lowering DSL. It is a pattern-matching language: you write rules that match on IR patterns and emit lower-level IR or machine code. Cranelift uses ISLE to lower its own CLIF into machine code for each target architecture.

The insight: ISLE rules are not just for lowering. They can express **any** translation from one IR to another, as long as both sides are well-defined. And CLIF — Cranelift's intermediate representation — is very well-defined. It has a verifier.

## What stock CLIF means

"Stock CLIF" means standard Cranelift IR with no custom extensions. No bespoke opcodes. No forked Cranelift with a `beskid_gc_alloc` instruction bolted on. The same CLIF the compiler already generates for user functions — the same blocks, the same values, the same type system — is what the runtime handlers emit.

This matters for one reason: **the verifier**. Cranelift's CLIF verifier checks every instruction for type consistency, control flow validity, and ABI conformance. It runs on user code. If the runtime handlers emit stock CLIF, the same verifier runs on the handlers.

## The approved design (11 July 2026)

The ISLE runtime-port design defines a narrow, staged migration:

### beskid_isle crate

A new crate housing the ISLE rules and a `Context` implementation that drives them. The rules match on dispatch op identifiers — `BytesCompare`, `StrEq`, `TestBytesLen` — and emit verifiable stock CLIF. No Rust handlers. No opaque blobs. Every handler is a set of pattern-match rules the compiler can trace.

### Language handler registration

The registration pattern mirrors `beskid_host`: manifest metadata declares which handlers exist, generated wrappers bind them to dispatch sites, and `beskid_language_register_all()` wires them at startup. The difference: the generated code is not a Rust function call. It is a CLIF fragment the verifier checks.

### Cohort 1 vertical

The first cohort is intentionally minimal: `bytes_compare`, `str_eq`, `test_bytes_len`, `test_bytes_ptr`. Four operations. Parity tests against the existing Rust handlers (which remain available, gated behind a feature flag). If the ISLE rules produce identical results, the verifier has checked them and the tests confirm they match.

### Migration roadmap

Cohorts C1 through C5 map the remaining 77 dispatch ops into ISLE-land. Each cohort is a vertical slice — a group of related ops that can be migrated, verified, and parity-tested independently. The migration can stop at any boundary with zero user-visible impact, because the Rust fallbacks remain.

## What we are NOT doing

The design is narrow by intent:

- **No forking Cranelift.** Stock CLIF, stock verifier, stock lowering.
- **No custom opcodes.** If Cranelift doesn't have it, we don't need it.
- **No replacing general HIR lowering.** ISLE handles the dispatch ops, not the full compilation pipeline.
- **No porting kernel exports, fibers, channels, or GC.** Those are separate concerns with separate correctness arguments. The ISLE shift covers language-owned dispatch ops only.

## The correctness contract

This is the shift: from **trust** to **verify**. The Rust handlers trusted that the author read the spec correctly. The ISLE rules encode the spec directly, and the verifier checks that the encoding is valid CLIF.

The Book chapter [From source to runs](/book/14-from-source-to-runs/) traces the full pipeline: front-end, semantic pipeline, codegen, CLIF, JIT, AOT. The ISLE shift adds a proof step — not a new stage, but a guarantee that the stages before it are faithful to the spec.

The primitive handlers are not wrong because a human said so. They are not wrong because the verifier would catch it if they were. That is not a runtime. That is a **correctness contract**.
