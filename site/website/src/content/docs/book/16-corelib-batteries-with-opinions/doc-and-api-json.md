---
title: "Doc and api.json"
description: Package documentation is driven by structured api.json—the compiler is the source of truth for signatures and links.
tableOfContents: true
---

`beskid doc` emits Markdown and **`api.json`** under `.beskid/docs/`. The JSON is not a parallel type system you maintain by hand: signatures, `typeRef` links, and member hierarchy are **compiler-derived**. Prose in `///` comments attaches to symbols; absence of prose does not remove the symbol from the API graph.

## Why this matters for pckg

Registry ingestion and the pckg docs UI treat **`api.json` as the primary contract**. If your package page looks empty, the fix is usually "run doc generation and publish," not "invent a second schema in YAML."

`beskid pckg pack` for library packages runs doc generation automatically — Markdown and `api.json` land under `.beskid/docs/` and ship inside the `.bpk` artifact. The pckg server indexes them on ingest.

## Authoring tie-in

- Write `///` on declarations you want explained.
- Use `@ref(Qualified.Name)` for cross-links the compiler can validate.
- Put `@arg` on **callable parameters only**—see [chapter 20](/book/20-doc-comments-that-are-not-lies/).

## See also

- [Packages without npm trauma](/book/18-packages-without-npm-trauma/) — how pckg registry ingests `api.json` and Markdown
- [The pckg CLI](/book/18-packages-without-npm-trauma/pckg-cli/) — `beskid pckg` tutorial and pack/doc flow
- [pckg command reference](/book/reference/cli/commands/pckg/) — automatic doc generation during `beskid pckg pack`
- [Publish your first package](/book/reference/publish-first-package/) — end-to-end publish with docs
- [Package public surface](/book/19-public-api-that-survives-review/package-public-surface/) — what registry consumers see from your API docs
- [api.json contract](/platform-spec/tooling/cli/api-json-contract/)
- [Documentation comments](/platform-spec/language-meta/surface-syntax/documentation-comments/)
