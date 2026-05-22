---
title: "Doc comment syntax"
description: /// runs, Markdown bodies, and structured @ directives.
tableOfContents: true
---

A **documentation run** is consecutive lines starting with `///` where the third `/` is not followed by another `/`. Block comments and `//` lines are not API documentation—do not `@inheritdoc` your way around that.

Documentation attaches to top-level declarations and nested members (fields, variants, contract members, methods, parameters, and test-body statements where supported). Write Markdown in the body; use structured tags for machine-readable sections.

## Normative spec

[Documentation comments](/platform-spec/language-meta/surface-syntax/documentation-comments/)
