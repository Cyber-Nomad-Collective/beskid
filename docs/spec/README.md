# Pecan Specification (v0.1)

Document index:
- 01-lexical-and-syntax.md
- 02-types.md
- 03-memory-and-references.md
- 04-enums-and-match.md
- 05-control-flow.md
- 06-modules-and-visibility.md
- 07-error-handling.md
- 08-metaprogramming.md
- 09-contracts.md
- 10-name-resolution.md
- 11-type-inference.md
- 12-method-dispatch.md
- 13-code-style-and-naming.md
- 14-standard-library-api-shape.md

Note: v0.1 intentionally avoids complex features (async, macros, runtime reflection, etc.).

## Grammar coverage checklist
- [x] Comments: line `//` and block `/* ... */`
- [x] Keywords list (incl. `when`, `ref`, `out`)
- [x] Literals: int, float, string, char, bool, string interpolation
- [x] Modules: `mod`, `use`, `pub use`
- [x] Types: primitives, generics, references, arrays `T[]`
- [x] Type definitions (`type`) and struct literals (`Type { ... }`)
- [x] Enums and enum constructors (`Enum::Variant(...)`)
- [x] Contracts (`contract`) with embedded contracts and method signatures
- [x] Functions and methods (`ReturnType Type.method(...)`)
- [x] Statements: let/mut, if/else, while, for-in range, return/break/continue
- [x] Expressions: precedence, calls, member access, match with `when` guard
