---
title: "What is a mod"
description: type Mod projects, artifact-driven discovery, and what mods are not.
tableOfContents: true
---

A **compiler mod** is a **`type: Mod`** package in the dependency graph whose compiled AOT artifact exports SDK **contract** implementations—generators, analyzers, rewriters—not random scripts the CLI `eval`s.

## Not these things

| Thing | Mod? |
| --- | --- |
| Rust proc-macro inside `beskid_analysis` | Host implementation detail |
| Language `macro` items | [Language macros](/platform-spec/language-meta/metaprogramming/macros/) — parallel feature |
| User `contract Disposable` | Structural type contract—different namespace |
| `meta { }` blocks in old designs | Removed—`Collector` owns scope |

## Discovery

Manifest **`attachTo`** folklore is dead. During **`mod.load`** the host:

1. Resolves transitive `Mod` dependencies from `CompilePlan`
2. Loads AOT artifact for target triple + cache key
3. Reads `mod.descriptor.json` / export table
4. Schedules `(contractId, typeId, entrySymbol)` tuples

Duplicates → **E1829** / **E1851–E1870** before collect runs ([Compiler Mod SDK — discovery](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/#contract-discovery-normative)).

## Compiler never in Beskid

The reference compiler host is Rust-only. Mods extend compilation; they do not replace `beskid_analysis`.

## Next

[Mod SDK](/book/15-mods-plugins-with-consequences/mod-sdk/)
