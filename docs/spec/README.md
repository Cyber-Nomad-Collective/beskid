# Beskid Specification (v0.1)

Document index:
- 00-glossary-and-conformance.md
- 01-lexical-and-syntax.md
- 02-types.md
- 03-memory-and-references.md
- 04-enums-and-match.md
- 05-control-flow.md
- 06-modules-and-visibility.md
- 07-error-handling.md
- 09-contracts.md
- 10-name-resolution.md
- 11-type-inference.md
- 12-method-dispatch.md
- 13-code-style-and-naming.md
- 14-standard-library-api-shape.md
- 15-metaprogramming.md
- 16-events.md
- 17-lambdas-and-closures.md
- 18-ffi-and-extern.md

Note: v0.1 intentionally avoids complex features (async, runtime reflection, etc.).

Generator model and broader metaprogramming scheduling are tracked as drafts outside the v0.1 spec:
- `docs/guides/drafts/metaprogramming/08-metaprogramming.md`

Standard library module-level contracts are documented in `docs/standard-library/`.

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
