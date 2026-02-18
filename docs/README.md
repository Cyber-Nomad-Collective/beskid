# Pecan Language

Pecan is a statically typed language designed to teach compiler construction. It draws inspiration from Rust (safety and explicit aliasing) and C# (readability). In v0.1, the priority is semantic clarity and a compact specification.

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

## Documentation
- Specification lives in `docs/spec`.
- Each topic is documented in its own file.

See: `docs/spec/README.md`.
