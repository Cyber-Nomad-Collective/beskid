---
title: "@arg and cross-links"
description: "@arg only on callable parameters; @ref for validated symbol links."
tableOfContents: true
---

Use **`@arg(name)`** only on **callable parameters**: functions, methods, and contract methods. Not on record fields. Not on type members. Not on mirrored SDK struct fields where the type already tells the story. A field is not an argument, and tagging it like one is the kind of thing that survives three code reviews and then confuses a linter author for a week.

Cross-reference another symbol with **`@ref(Fully.Qualified.Name)`** so the compiler can validate the target against the same index that drives `api.json`. A reference to a renamed or deleted symbol is a build-time doc error, not a dead link someone reports six months later.

## Write tags for the reader and the tool

Use a tag when it supplies information that is not already obvious from the declaration. `@arg` gives a parameter-specific explanation; `@ref` gives a navigable relationship. Keep the prose close to the declaration, so a signature change forces the same review as its documentation.

## Common warnings

The semantic pipeline reserves **W1610–W1625** for documentation issues: orphan `@arg`, duplicate tags, `@returns` on non-callables. Fix warnings before calling the docs done.

## Spec

- [Diagnostic registry (doc warnings)](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/)
- [Documentation comments](/platform-spec/language-meta/surface-syntax/documentation-comments/)
- [api.json contract](/platform-spec/tooling/cli/api-json-contract/)
