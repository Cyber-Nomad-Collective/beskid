---
title: "@arg and cross-links"
description: "@arg only on callable parameters; @ref for validated symbol links."
tableOfContents: true
---

Use **`@arg(name)`** only on **callable parameters**—functions, methods, and contract methods. Not on record fields. Not on type members. Not on mirrored SDK struct fields where the type already tells the story.

Cross-reference another symbol with **`@ref(Fully.Qualified.Name)`** so the compiler can validate the target against the same index that drives `api.json`.

## Write tags for the reader and the tool

Use a tag when it supplies information that is not already obvious from the declaration. `@arg` gives a parameter-specific explanation; `@ref` gives a navigable relationship. Keep the prose close to the declaration so a signature change prompts the same review as its documentation.

## Common warnings

The semantic pipeline reserves **W1610–W1625** for documentation issues—orphan `@arg`, duplicate tags, `@returns` on non-callables. Fix warnings before you call the docs "done."

## Spec

- [Diagnostic registry (doc warnings)](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/)
- [Documentation comments](/platform-spec/language-meta/surface-syntax/documentation-comments/)
- [api.json contract](/platform-spec/tooling/cli/api-json-contract/)

## Next

[Verify docs in CI](/book/20-doc-comments-that-are-not-lies/verify-docs/)
