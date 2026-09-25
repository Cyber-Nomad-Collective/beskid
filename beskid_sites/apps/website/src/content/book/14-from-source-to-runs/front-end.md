---
title: "Front-end"
description: One grammar, one parser, a syntax tree with spans, and the diagnostics that come out before anyone asks what a name means.
tableOfContents: true
---

The grammar is a single `pest` file, `beskid.pest`, in `beskid_analysis`. It is the authority. If a construct is not in that file it is not Beskid, and if it is in that file the parser accepts it whether or not later stages know what to do with it. That split matters: `for x in array` parses today and fails at lowering, and the parser is not the stage that should know that.

## What parse produces

A syntax tree in which every node carries its source span. Spans are the currency of every diagnostic after this point; a type error in stage six points at a span the parser recorded in stage three. `beskid parse file.bd` prints the tree, `beskid tree file.bd` prints it as an ASCII diagram, and both are the fastest way to settle "did the parser see what I meant".

Parse also runs recovery. A missing semicolon does not abort the file; the parser records the error, resynchronizes at the next statement, and keeps going, so the language server can offer completions in a file that is mid-edit. The E115x band is syntax.

## Documentation is part of the tree

`///` comments are not stripped. They attach to the item that follows them as a documentation run, and `@arg`, `@ref`, and the other directives are parsed into structure. `beskid doc` reads them from the tree, not from a second pass over the text. Chapter 20.

## Before parse: assembly

The front-end does not start from a file. It starts from the set of roots a target reaches, computed by resolution from the manifest and the dependency graph. That is why a bare `beskid parse hello.bd` works for a syntax check but `beskid analyze` wants a project once your file imports anything: names cannot be resolved without knowing which packages are in the graph.

## Syntax mirror

The same grammar generates a Beskid-side mirror of the syntax tree, the `Beskid.Syntax` package in the compiler SDK, so mods can inspect and emit syntax in Beskid rather than through a foreign-function view of Rust structs. When the grammar changes, the mirror is regenerated, and a mod built against the old shape fails to compile rather than silently reading garbage. Chapter 15.

Contracts: [grammar and parser](/platform-spec/compiler/front-end/grammar-and-parser-contract/), [parser and AST](/platform-spec/compiler/front-end/parser-and-ast-contracts/), [HIR normalization and legality](/platform-spec/compiler/front-end/hir-normalization-and-legality/).
