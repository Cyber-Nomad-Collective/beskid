---
title: "Import syntax"
description: use declarations, aliases, and public re-exports in Beskid source."
tableOfContents: true
---

Beskid imports are explicit. The compiler will not guess that `Parser` obviously meant the one from that package you used once in 2023.

## Forms

```beskid
use net.http.Client;
use net.http.Client as HttpClient;
pub use net.http.Client;
```

- **Direct import** — bring a symbol into scope.
- **Alias** — local name differs from the original (`as`).
- **`pub use`** — re-export through the current module boundary.

## File-scoped modules

With `mod app.core;` at the top, imports resolve inside that module scope. Locals still beat imports. You cannot add sibling `mod` declarations in the same file.

## Style guidance

Prefer aliases when two imports collide (`AParser`, `BParser`) instead of "helpful" shortening that confuses readers.

## Standard reference (informative)

- [Name Resolution](/platform-spec/language-meta/program-structure/name-resolution/)
- [Modules and Visibility](/platform-spec/language-meta/program-structure/modules-and-visibility/)

## Next

[Name resolution](/book/05-names-nobody-agreed-on/name-resolution/)
