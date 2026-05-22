---
title: "Language meta map"
description: User-visible Beskid law—syntax, types, contracts, memory, evaluation, interop.
tableOfContents: true
---

[Language meta](/platform-spec/language-meta/) is **language law**: what valid programs mean, independent of which Rust crate happens to implement it today.

## Major areas (reading order for newcomers)

| Area | You learn |
| --- | --- |
| [Program structure](/platform-spec/language-meta/program-structure/) | Modules, names, imports, `extend` |
| [Type system](/platform-spec/language-meta/type-system/) | Types, generics, conformances |
| [Contracts and effects](/platform-spec/language-meta/contracts-and-effects/) | `contract`, `Result`, testing |
| [Memory model](/platform-spec/language-meta/memory-model/) | Locals, `ref`, heap, GC rules |
| [Evaluation](/platform-spec/language-meta/evaluation/) | Closures, **fibers and spawn** |
| [Interop](/platform-spec/language-meta/interop/) | `extern`, ABI profiles |
| [Metaprogramming](/platform-spec/language-meta/metaprogramming/) | Mod SDK surface (Beskid-side) |
| [Conformance](/platform-spec/language-meta/conformance/) | Glossary, normative vocabulary |

## Articles vs hubs

- **Area** pages index **features** (tiles).
- **Feature** hubs bundle articles, ADRs, optional graphs.
- **Articles** (`specLevel: article`) carry the MUST/SHOULD prose.

## Linking from the book

When this book says "the compiler will reject that," the receipt is usually a language-meta diagnostic band (e.g. **E16xx** contracts, spawn capture rules)—not a blog post.

## Next

[Compiler domain map](/book/13-reading-the-law/compiler-domain-map/)
