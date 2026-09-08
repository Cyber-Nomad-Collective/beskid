---
title: "Front-end"
description: Grammar, parser, typed syntax facts, and diagnostics in the current front end.
tableOfContents: true
---

The front-end turns text into a structured program representation—or gives you **actionable syntax diagnostics** instead of "error on line 1."

## Spec areas

- [Grammar and parser contract](/docs/standard/compiler/front-end/grammar-and-parser-contract/)
- [Parser and AST contracts](/docs/standard/compiler/front-end/parser-and-ast-contracts/)
- [Typed syntax and code-generation input](/docs/standard/compiler/build-pipeline/)

## Crates and modules

| Piece | Location |
| --- | --- |
| Lex/parse | `beskid_analysis::syntax`, `beskid_analysis::parser` |
| SyntaxMirror / facade | Tied to [Syntax domain model generation](/docs/standard/compiler/compiler-mods/syntax-domain-model-generation/), [Beskid compiler syntax facade](/docs/standard/compiler/compiler-mods/beskid-compiler-syntax-facade/) |

## Program assembly

Before parse, **effective roots** come from manifests and workspace resolution:

- [Program assembly](/docs/standard/compiler/build-pipeline/program-assembly/)
- [Workspace resolution](/docs/standard/compiler/resolution-and-projects/workspace-resolution-contract/)

## `beskid parse`

Exercises front-end slices without full codegen—useful for grammar work, insufficient for shipping.

## Next

[Semantic pipeline](/book/14-from-source-to-runs/semantic-pipeline/)
