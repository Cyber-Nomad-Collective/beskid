---
title: "Mod SDK"
description: compiler-sdk package, Beskid.Syntax mirror, Collector contract hierarchy, query pipeline.
tableOfContents: true
---

The **`compiler-sdk`** package is the Beskid-side API for mods—contracts and `Beskid.Syntax` operations, not string templates.

Full normative article: [Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/).

## Contract hierarchy

| Contract | Role |
| --- | --- |
| `Collector` | Declarative target collection and scope narrowing |
| `Generator` | Typed AST contributions (incremental by default) |
| `Analyzer` | Diagnostics + rewrite fixes on merged program |
| `Rewriter<TSource, TTarget>` | `Result<TTarget, FixError> Rewrite(...)` |
| `AttributeGenerator` | Exported attributes (e.g. serialization mods) |

## Beskid.Syntax

- **`Node`** is a contract; traversal uses **`NodeRef`** `{ syntaxGenerationId, nodeId }`
- **`Beskid.Compiler.Query`** + fluent DSL (`Select`, `WhereKind`, `Replace`, …)
- **No source text emission**—hosts merge typed trees, then re-parse under bounds

Generated mirrors come from `beskid_ast_reflect_gen`—Rust AST is canonical; SDK sources are not hand-duplicated parallel syntax.

## Rust host areas

Implementation specs under [Compiler mods](/platform-spec/compiler/compiler-mods/):

- [Mod host bridge](/platform-spec/compiler/compiler-mods/mod-host-bridge/)
- [Syntax domain model generation](/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/)
- [Incremental scheduling and determinism](/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/)

## Next

[Generator, Analyzer, Rewriter](/book/15-mods-plugins-with-consequences/generator-analyzer-rewriter/)
