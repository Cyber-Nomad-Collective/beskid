---
title: "Naming and style"
description: Names that survive grep, review, and api.json without folklore.
tableOfContents: true
---

Naming is not aesthetics—it is an API contract. Platform-spec [Code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/) is the normative baseline; this section is how you apply it without bike-shedding for three days.

## Case profiles (quick)

| Kind | Case | Example |
| --- | --- | --- |
| Types, enums, contracts, variants, functions, methods | **PascalCase** | `Hub`, `WaitReceive`, `IsOk` |
| Fields, parameters, locals | **lowerCamelCase** | `isTty`, `index`, `caps` |
| Module segments | **PascalCase** | `Core.Results` |
| Tests | **snake_case** | `hub_register_accepts_channel` |
| Macros | **lowerCamelCase** | `identity` |

Full rules: [Code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/).

## Review-friendly habits

- Name types for what they **are**, not what they were before the rewrite.
- Avoid leaking `Internal`, `Helper`, `Util` into **public** paths unless you enjoy support tickets.
- Align module names with folder layout (chapter 04)—surprises belong in fiction, not in `import`.
- Mismatched case is an API smell even when the compiler accepts it today—**W163x** warnings are coming.

## Spec

- [Code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/)
- [Name resolution](/platform-spec/language-meta/program-structure/name-resolution/)
