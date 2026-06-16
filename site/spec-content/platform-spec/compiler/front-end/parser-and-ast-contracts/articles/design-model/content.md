---
title: Design model
description: Mental model for how the front-end parser and syntax model are organized.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

The front-end is split into three layers:

1. **Grammar layer** (`beskid.pest`): token and production definitions.
2. **Parsing layer** (`src/parsing`): traversal helpers that map parse trees into typed syntax nodes.
3. **Syntax layer** (`src/syntax/items`, `src/syntax/types`): stable Rust structs/enums consumed by resolver, analysis, docs, and formatter paths.

For newcomers, the practical rule is simple: if a language construct changes, update grammar and syntax together, then confirm semantic passes still read the resulting nodes as expected.

## `extend type` in the module AST

**`extend type`** is a top-level module item for type extension (see **[extend type](/platform-spec/language-meta/program-structure/extend-type/)**). Parser responsibilities:

1. **Discovery order** — `Program.items` preserves source order; mod host discovery walks items deterministically.
2. **Merge semantics** — Generated `extend type` contributions merge with hand-authored extensions under host validation before semantic analysis.
3. **Legacy removal** — `MetaDefinition` AST nodes **must be removed** from parser output.

HIR lowering for `extend type` is documented in **[AST and HIR shape contract](/platform-spec/compiler/front-end/ast-hir-shape-contract/)**.
