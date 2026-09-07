---
title: "pub boundaries"
description: Keep most symbols private; export only what you intend to support.
tableOfContents: true
---

Default to **private**. Export with **`pub`** only when another compilation unit—or a human on the registry—should depend on the symbol.

## Practical API boundary pattern

- Keep most items private by default.
- Export stable contracts with `pub`.
- Re-export selected symbols from boundary modules with `pub use`.

This combines a C#-like focus on explicit public surface with Rust-like module tree composition.

## Example

```beskid
// net/mod.bd
mod http;
pub use http.Client;
```

Consumers import `net.Client`, while internal layout remains free to evolve.

## Spec

- [Modules and visibility](/platform-spec/language-meta/program-structure/modules-and-visibility/)
