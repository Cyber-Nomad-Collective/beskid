---
title: "Doc and api.json"
description: Package documentation is driven by structured api.json—the compiler is the source of truth for signatures and links.
tableOfContents: true
---

`beskid doc` emits Markdown and **`api.json`** under `.beskid/docs/`. The JSON is not a parallel type system you maintain by hand: signatures, `typeRef` links, and member hierarchy are **compiler-derived**. Prose in `///` comments attaches to symbols; absence of prose does not remove the symbol from the API graph.

## Why this matters for pckg

Registry ingestion and the pckg docs UI treat **`api.json` as the primary contract**. If your package page looks empty, the fix is usually "run doc generation and publish," not "invent a second schema in YAML."

## Authoring tie-in

- Write `///` on declarations you want explained.
- Use `@ref(Qualified.Name)` for cross-links the compiler can validate.
- Put `@arg` on **callable parameters only**—see [chapter 20](/book/20-doc-comments-that-are-not-lies/).

## Spec

- [api.json contract](/platform-spec/tooling/cli/api-json-contract/)
- [Documentation comments](/platform-spec/language-meta/surface-syntax/documentation-comments/)
