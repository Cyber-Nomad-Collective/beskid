---
title: "Visibility basics"
description: Private by default, pub exports, and not leaking every helper across the monorepo."
tableOfContents: true
---

Default visibility is **private**. If you wanted everything public, you already have JavaScript.

## `pub` means intentional surface

Mark items `pub` when other modules may depend on them. Keep helpers private unless you enjoy semver pain from accidental API growth.

## Module boundaries

Use boundary modules (`api.bd`, `mod service;` files) to:

- Hide experimental internals in private siblings
- Re-export a narrow surface with `pub use` (chapter [05](/book/05-names-nobody-agreed-on/))

## File-scoped modules tighten the story

When `mod domain.feature;` owns a file, everything top-level in that file shares the module scope—additional `mod` declarations are disallowed to prevent nested chaos.

## Smell table

| Smell | Fix |
| --- | --- |
| `pub` on every function | Delete `pub` from helpers |
| Cross-layer imports | Introduce boundary module + `pub use` |
| "Util" package imported everywhere | Split domain modules |

## Standard reference (informative)

- [Modules and Visibility](/platform-spec/language-meta/program-structure/modules-and-visibility/)
- [Code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/)

## Next

[Corelib layout](/book/04-where-does-this-file-go/corelib-layout/)
