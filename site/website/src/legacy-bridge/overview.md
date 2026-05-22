---
title: "Beskid Language"
---


Beskid is a statically typed language designed to teach compiler construction. It draws inspiration from Rust (safety and explicit aliasing) and C# (readability). In v0.1, the priority is semantic clarity and a compact specification.

## Goals
- Readable syntax with strong static typing.
- No nulls: only Option<T>.
- A single type system (no reference/value split).
- Explicit references: ref T (and ref mut T planned).
- Garbage collector with an easy-to-understand memory model.

## v0.1 Scope
- Functions, types, enums, match.
- Basic control flow (if/while/for).
- Modules and visibility.
- Option/Result as the primary error types.
- First-class attributes (declarations + typed applications).

## Metaprogramming
- Compile-time **Mod SDK** contracts, `type: Mod` manifests, and the Rust **mod host** live in **platform-spec** (split across [Language meta / Metaprogramming](/platform-spec/language-meta/metaprogramming/), [Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/), and [Compiler Mods](/platform-spec/compiler/compiler-mods/)); older exploratory drafts are not authoritative.

## Documentation

The site has two documentation products:

- **[Platform specification](/platform-spec/)** — normative language and platform contracts (language-meta, compiler, execution, core library, tooling).
- **[The Beskid Book](/book/)** — informative tutorial and reference material (CLI, projects, LSP, workflows).

Legacy `/execution/` and `/corelib/` URLs redirect to the [legacy specification mapping](/platform-spec/legacy-spec-mapping/) hub when no direct replacement exists.
