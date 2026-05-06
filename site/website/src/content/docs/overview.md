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
- The canonical **`meta` block** and compile-time **Mod SDK** contracts live in **platform-spec** (split across [Language meta / Metaprogramming](/platform-spec/language-meta/metaprogramming/) and [Compiler / Metaprogramming Mod SDK](/platform-spec/compiler/metaprogramming-mod-sdk/)); older exploratory drafts are not authoritative.

## Documentation
- `docs/book` — guided learning path for language and project organization.
- `docs/platform-spec/language-meta` — language semantics and typing rules (normative).
- `docs/execution` — runtime, ABI, lowering, and backend contracts (normative).
- `docs/corelib` — corelib contracts (normative).
- `docs/guides` — drafts, tooling notes, and project workflow guides (informative).

See: `docs/platform-spec/index.mdx`.
