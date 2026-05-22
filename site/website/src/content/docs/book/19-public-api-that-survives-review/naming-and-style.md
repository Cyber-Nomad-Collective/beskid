---
title: "Naming and style"
description: Names that survive grep, review, and api.json without folklore.
tableOfContents: true
---

Naming is not aesthetics—it is an API contract. Platform-spec [Code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/) is the normative baseline; this section is how you apply it without bike-shedding for three days.

## Review-friendly habits

- Name types for what they **are**, not what they were before the rewrite.
- Avoid leaking `Internal`, `Helper`, `Util` into **public** paths unless you enjoy support tickets.
- Align module names with folder layout (chapter 04)—surprises belong in fiction, not in `import`.

## Spec

- [Name resolution](/platform-spec/language-meta/program-structure/name-resolution/)
