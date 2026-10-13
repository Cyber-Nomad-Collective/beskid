---
title: "Foreign libraries"
description: Import native libraries through tooling contracts, not random linker flags in a README footnote.
tableOfContents: true
---

Native dependencies enter through **foreign library import** tooling: manifest link entries, CLI import flows, and Standard contracts that keep Windows/Linux/macOS differences out of your application's soul.

## Start here

- [Foreign library import](/docs/standard/capabilities/taxonomy--tooling--foreign-library-import/)
- [Project link libraries](/docs/standard/capabilities/tooling--manifests-and-lockfiles--project-manifest-contract/)
- [CLI import-lib command](/docs/standard/capabilities/tooling--foreign-library-import--cli-import-lib-command/)

## Interop overlap

FFI *language* rules are chapter 21; this section is *packaging and linking* policy. Mixing them in one angry Slack thread is optional but not recommended.

## Next

[19. Public API that survives code review](/book/19-public-api-that-survives-review/)
