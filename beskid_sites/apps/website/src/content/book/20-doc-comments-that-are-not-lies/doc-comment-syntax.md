---
title: "Doc comment syntax"
description: /// runs, Markdown bodies, and structured @ directives.
tableOfContents: true
---

A **documentation run** is consecutive lines starting with `///` where the third `/` is not followed by another `/`. Block comments and `//` lines are not API documentation—do not `@inheritdoc` your way around that.

Documentation attaches to top-level declarations and nested members (fields, variants, contract members, methods, parameters, and test-body statements where supported). Write Markdown in the body; use structured tags for machine-readable sections.

## A small authoring routine

1. State the declaration's purpose and any non-obvious precondition or consequence.
2. Add structured tags only where they clarify the callable API or link a reader onward.
3. Review the rendered or generated documentation with the declaration, not as a separate prose artifact.

This page is a guide to the workflow. The [documentation-comments feature](/platform-spec/language-meta/surface-syntax/documentation-comments/) owns the exact syntax and attachment rules.

## Normative spec

[Documentation comments](/platform-spec/language-meta/surface-syntax/documentation-comments/)

## Next

[@arg and cross-links](/book/20-doc-comments-that-are-not-lies/arg-and-cross-links/)
