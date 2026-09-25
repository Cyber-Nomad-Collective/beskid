---
title: "What is a mod"
description: A compiler mod is a type: Mod package whose AOT artifact exports SDK contract implementations, discovered by the host at mod.load, never eval'd.
tableOfContents: true
---

A mod is a `type: Mod` package in the dependency graph whose compiled AOT artifact exports SDK contract implementations: generators, analyzers, rewriters, and the rest. It is not a script the CLI interprets, and it is not a Rust proc-macro living inside `beskid_analysis`; that is a host implementation detail a mod author never touches.

Two other things share vocabulary with mods and are not mods. A language `macro` item is a separate feature, expanded during parsing rather than scheduled as a compiled contract; see [Language macros](/platform-spec/language-meta/metaprogramming/macros/). A user type's `contract Disposable` lives in a completely different namespace from the mod SDK's `Collector`, `Generator`, `Analyzer`, and `Rewriter` contracts, even though both use the word `contract`; chapter 09 draws that line in detail. And `meta { }` blocks from earlier designs are gone. `Collector` owns scope now.

## Discovery

Nothing "attaches" to anything. During `mod.load` the host resolves the transitive `Mod` dependencies from the compile plan, loads the AOT artifact for the target triple and cache key, reads `mod.descriptor.json` or the equivalent export table, and schedules `(contractId, typeId, entrySymbol)` tuples for the phases that follow.

A duplicate registration is E1829, or one of E1851 through E1870, and it is caught before `collect` runs, not discovered mid-generation with half the program already rewritten. See [Compiler Mod SDK, contract discovery](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/#contract-discovery-normative).

## The compiler stays Rust

The reference compiler host is Rust, full stop. A mod extends what compilation does; it does not replace `beskid_analysis`, and there is no path where Beskid interprets Beskid to make a compile-time decision.
