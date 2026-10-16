---
title: "What is a mod"
description: type Mod projects, artifact-driven discovery, and what mods are not.
tableOfContents: true
---

A **compiler mod** is a **`type: Mod`** package in the dependency graph whose compiled native artifact exports SDK **contract** implementations (generators, analyzers, rewriters), not random scripts the CLI `eval`s.

## Not these things

| Thing | Mod? |
| --- | --- |
| Rust proc-macro inside `beskid_analysis` | Host implementation detail |
| Language `macro` items | [Language macros](/docs/standard/capabilities/language-meta--metaprogramming--macros/), a parallel feature |
| User `contract Disposable` | Structural type contract, different namespace |
| `meta { }` blocks in old designs | Removed, `Collector` owns scope |

## Which Mods run

Manifest **`attachTo`** folklore is dead. A Mod works like a Rust procedural-macro crate: it contributes only to the packages that declare it. For one compilation, a Mod is **active** when it is a direct dependency of the host project, or of a package that has at least one source unit in the host's assembly. Every other Mod in the resolved graph is inactive: it is not discovered, built, loaded, or run.

Two consequences worth knowing:

- A Mod that only another Mod depends on belongs to that Mod's own build, never to a host that runs the outer Mod.
- The Corelib aggregate depends on `corelib_serialization`, which depends on the Serialization Mod. A program whose imports never reach `Core.Serialization` does not run it. A program that imports that surface, directly or through a package, does.

The CLI and the compiler decide this from the same inputs (the compile plan, the declared dependencies of the host and of each reached package, and the assembly), so they always agree on the set.

## Discovery

During **`mod.load`** the host, for each active Mod:

1. Finds a current native artifact for the host target, or builds one (see [beskid mod CLI](/book/15-mods-plugins-with-consequences/beskid-mod-cli/))
2. Validates its `mod.descriptor.json`
3. Runs the Mod in an isolated worker process (`beskid dev native-mod-worker`, a hidden command)
4. Schedules the contract implementations the artifact exports

Duplicates → **E1829** / **E1851–E1870** before collect runs ([Compiler Mod SDK: discovery](/docs/standard/capabilities/language-meta--metaprogramming--compiler-mod-sdk/)).

## Compiler never in Beskid

The reference compiler host is Rust. Mods are written in Beskid and extend compilation; they do not replace the compiler.

## Next

[Mod SDK](/book/15-mods-plugins-with-consequences/mod-sdk/)
