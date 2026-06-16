---
title: extend type - Flow and algorithm
description: Step-by-step flow of extend type parsing, validation, and lowering
  in the Beskid compiler.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-05
---

## Compile pipeline placement

```mermaid
flowchart LR
    parse[parse]
    collect[collect extensions]
    resolve[resolve target type]
    access[check access]
    lower[lower to HIR]
    parse --> collect --> resolve --> access --> lower
```

## extend type algorithm (normative)

1. **Parse extension block** — `extend type T { methods }` becomes `ExtendTypeDefinition` with `target_type` and `methods`.
2. **Parse methods** — Each method is parsed with the target type as its implicit receiver type.
3. **Resolve target type** — The extended type name must refer to an in-scope type declaration.
4. **Index methods** — Add extension methods to the target type's member set for dispatch resolution.
5. **Check access rules** — `ExtendTypePrivateMemberAccess` (**E1511**) prevents access to private members of the extended type.
6. **Check visibility** — Extension sites must satisfy normal import and visibility rules.
7. **Lower to HIR** — Methods are lowered as ordinary function definitions with the receiver type bound.

## Method parsing with receiver

```mermaid
flowchart TB
    extend[extend type T]
    method[method definition]
    receiver[receiver type = T]
    body[method body]
    extend --> method --> receiver --> body
```

## Compiler mod generation

Mods may emit `extend type` blocks through `Generator` contracts:
1. Mod code constructs `ExtendTypeDefinition` nodes via the typed AST API.
2. The host merges generated contributions into the program.
3. Re-parse and re-resolve treat generated extensions the same as hand-authored ones.

## LSP / incremental

Re-run extension analysis when `extend type` blocks, target type definitions, or method signatures change.
