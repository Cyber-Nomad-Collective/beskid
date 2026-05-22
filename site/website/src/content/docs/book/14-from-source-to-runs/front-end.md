---
title: "Front-end"
description: Grammar, parser, AST/HIR contracts, and syntax diagnostics in beskid_analysis.
tableOfContents: true
---

The front-end turns text into a structured program representation—or gives you **actionable syntax diagnostics** instead of "error on line 1."

## Spec areas

- [Grammar and parser contract](/platform-spec/compiler/front-end/grammar-and-parser-contract/)
- [Parser and AST contracts](/platform-spec/compiler/front-end/parser-and-ast-contracts/)
- [AST/HIR shape contract](/platform-spec/compiler/front-end/ast-hir-shape-contract/)
- [HIR normalization and legality](/platform-spec/compiler/front-end/hir-normalization-and-legality/)

## Crates and modules

| Piece | Location |
| --- | --- |
| Lex/parse | `beskid_analysis::syntax`, `beskid_analysis::parser` |
| SyntaxMirror / facade | Tied to [Syntax domain model generation](/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/), [Beskid compiler syntax facade](/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/) |

## Program assembly

Before parse, **effective roots** come from manifests and workspace resolution:

- [Program assembly](/platform-spec/compiler/build-pipeline/program-assembly/)
- [Workspace resolution](/platform-spec/compiler/resolution-and-projects/workspace-resolution-contract/)

## `beskid parse`

Exercises front-end slices without full codegen—useful for grammar work, insufficient for shipping.

## Next

[Semantic pipeline](/book/14-from-source-to-runs/semantic-pipeline/)
