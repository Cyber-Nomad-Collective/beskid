---
title: Documentation comments
description: Normative rules for /// doc comments, @ tags, and cross-references.
---

## Lexical form

Only **triple-slash line comments** (`///`) are documentation comments.

- A **doc run** is a maximal contiguous sequence of `///` lines (each line starts with optional horizontal whitespace, then exactly `///`, then optional body text to end of line).
- A doc run **attaches** to the **next** top-level item in the same file. If there is no following item, the run is ignored for attachment (implementations may emit a warning).
- **`////` and longer** prefixes are **not** documentation: they are ordinary line comments.
- **`//`** (exactly two slashes, not followed by a third) and **`/* … */`** are ordinary comments and **never** produce documentation AST.

## Body and DocAst

The **normalized body** of a doc run is formed by:

1. Taking each `///` line in order.
2. Stripping the leading `///` and, if present, a single **space** immediately after it (Rust-style strip), then the rest of the line including any further spaces.

That normalized string is the sole input to the **documentation command grammar** (Pest `beskid_doc.pest`). That grammar produces **DocAst**; no other source produces DocAst.

## @ commands

Inside the normalized body:

- A **block tag** starts at the beginning of a line (after normalization) with `@` followed by an identifier (e.g. `@param`, `@returns`, `@remarks`, `@deprecated`).
- **`@ref(`** … **`)`** denotes a **cross-reference** to another symbol. The inner text is a Beskid path (e.g. `MyModule.MyType` or `MyType.method_name`) resolved using the same rules as name resolution where possible.
- Unknown `@` tags are preserved in the AST but may be ignored by renderers; strict tooling may warn.

Use **`@ref(` … `)`** for links so `@` at line start can consistently mean a **tag**.

## Tooling

- **`beskid doc`** emits API reference including items **without** doc runs (stub prose).
- **LSP hover** may render resolved documentation as Markdown.
