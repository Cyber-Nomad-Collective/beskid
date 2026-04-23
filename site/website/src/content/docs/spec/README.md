---
title: "Beskid Specification"
---


Document index:
- glossary-and-conformance.md
- lexical-and-syntax.md
- types.md
- memory-and-references.md
- enums-and-match.md
- control-flow.md
- modules-and-visibility.md
- error-handling.md
- contracts.md
- name-resolution.md
- type-inference.md
- method-dispatch.md
- code-style-and-naming.md
- corelib-api-shape.md
- metaprogramming.md
- events.md
- lambdas-and-closures.md
- ffi-and-extern.md

Note: v0.1 intentionally avoids complex features (async, runtime reflection, etc.).

Generator model and broader metaprogramming scheduling are tracked as drafts outside the v0.1 spec:
- `docs/guides/drafts/metaprogramming/metaprogramming.md`

Corelib module-level contracts are documented in `docs/corelib/`.

## Grammar coverage checklist
- [x] Comments: line `//` and block `/* ... */`
- [x] Keywords list (incl. `when`, `ref`, `out`)
- [x] Literals: int, float, string, char, bool, string interpolation
- [x] Modules: `mod`, `use`, `pub use`
- [x] Types: primitives, generics, references, arrays `T[]`
- [x] Type definitions (`type`) and struct literals (`Type { ... }`)
- [x] Enums and enum constructors (`Enum::Variant(...)`)
- [x] Contracts (`contract`) with embedded contracts, method signatures, and explicit conformance declarations (`type Type : ContractA, ContractB`)
- [x] Attributes: declaration (`attribute Name(...) { ... }`) and application (`[Name(arg: expr)]`)
- [x] Functions and methods (`impl Type { ... }`, implicit `this` receiver in methods)
- [x] Statements: let/mut, if/else, while, for-in expression (including range fast-path), return/break/continue
- [x] Expressions: precedence, calls, member access, match with `when` guard
