---
title: "06. Public API Idioms"
description: Build stable package-facing APIs with `pub` and `pub use`.
---

Beskid organization works best when you treat modules as internal implementation units and explicitly choose what becomes public.

## By the end of this chapter

- Design clear public boundaries for package consumers.
- Use `pub use` to provide stable import paths.
- Keep refactors internal without breaking public APIs.

## Practical API boundary pattern

- Keep most items private by default.
- Export stable contracts with `pub`.
- Re-export selected symbols from boundary modules with `pub use`.

This combines a C#-like focus on explicit public surface with Rust-like module tree composition.

## Example pattern

```beskid
// net/mod.bd
mod http;
pub use http.Client;
```

Consumers import `net.Client`, while internal layout remains free to evolve.

## API checklist

- Export only symbols you want to support long-term.
- Keep internal modules private unless they are intended extension points.
- Prefer one public boundary file per subsystem.

## Deep dive in spec

- [Modules and Visibility](/spec/modules-and-visibility/)
- [Code Style and Naming](/spec/code-style-and-naming/)
- [Name Resolution](/spec/name-resolution/)

## Next

Finish with [Appendix: Spec Map](/book/appendix-spec-map/).
