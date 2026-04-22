---
title: "03. Modules and Files"
description: Learn how file layout and `mod` declarations define Beskid's module graph.
---

Beskid uses a file-backed module model: one file corresponds to one module, and dotted paths map to nested directories.

## By the end of this chapter

- Declare modules with `mod` and understand lookup paths.
- Organize flat vs foldered module layouts.
- Decide what should stay internal vs public.

## Module declarations

- `mod net.http;` as the first top-level item declares a file-scoped module for the whole file.
- In a file-scoped module file, additional `mod` declarations are not allowed.
- Inline modules remain available in files that do not use file-scoped `mod`.
- Visibility defaults to private; `pub` exports a symbol to other modules.

## Module identity precedence

1. File-scoped declaration (`mod a.b;`) if present.
2. Otherwise, file path relative to source root.

This keeps module identity explicit when desired, while preserving convention-based layout for files without an explicit declaration.

## Practical tutorial pattern

1. Start a file with `mod domain.feature;`.
2. Keep all top-level items in that file under the declared module scope.
3. Re-export only stable contracts from boundary modules.

## Recommended structure

- Keep top-level module declarations short and explicit.
- Use `pub use` at module boundaries to define a stable public surface.
- Prefer cohesive module folders when domains grow (`query/`, `collections/`, `runtime/`).

## Deep dive in spec

- [Modules and Visibility](/spec/modules-and-visibility/)

## Next

Continue with [04. Imports and Names](/book/04-imports-and-names/).
