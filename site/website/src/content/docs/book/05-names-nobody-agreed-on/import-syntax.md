---
title: "Import syntax"
description: "use declarations, aliases, and public re-exports in Beskid source."
tableOfContents: true
---

Beskid imports are explicit. The compiler will not guess that `Parser` obviously meant the one from that package you used once in 2023.

## Forms

```beskid
use Core.Output;
use Network.Types as NetTypes;
pub use Core.Output;
```

- **Direct import**: bring a symbol into scope.
- **Alias**: local name differs from the original (`as`).
- **`pub use`**: re-export through the current module boundary.

## Where module paths come from

A module path comes from the file's location under its package source root. Your own modules have no prefix. Corelib modules keep their package roots (`Core.*`, `Testing.*`, `Concurrency.*`, `Beskid.Compiler.*`). The Corelib dependency label `Core` is a manifest name, not a path segment, and there is no `Std.` prefix.

You do not need a `use` to call a dependency through its full path: `Core.Output.WriteLine("hi")` works as written. See [Name resolution](/book/05-names-nobody-agreed-on/name-resolution/) for the shadowing and ambiguity rules.

## File-scoped modules

With `mod app.core;` at the top, imports resolve inside that module scope. Locals still beat imports. You cannot add sibling `mod` declarations in the same file.

## Style guidance

Prefer aliases when two imports collide (`AParser`, `BParser`) instead of "helpful" shortening that confuses readers.

## Standard reference (informative)

- [Name Resolution](/docs/standard/capabilities/language-meta--program-structure--name-resolution/)
- [Modules and Visibility](/docs/standard/capabilities/language-meta--program-structure--modules-and-visibility/)

## Next

[Name resolution](/book/05-names-nobody-agreed-on/name-resolution/)
