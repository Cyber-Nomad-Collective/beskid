---
title: Beskid.Compiler.SyntaxMirror facade
description: Typed, allocation-bounded syntax node API exposed to compile-time
  Beskid modules.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-01
---

This feature hub defines the normative contract for **Beskid.Compiler.SyntaxMirror** and links detailed articles.

## Language alignment
Fluent **`Beskid.Compiler.Query`** plans (process phase) consume **Syntax** views. APIs must preserve immutability and identity stability required by **capture** keys in language-meta.

## Implementation anchors
- `corelib` package module `Beskid.Compiler.SyntaxMirror` (generated + hand-authored surface).
- `compiler/crates/beskid_analysis/src/syntax/` — authoritative internal model to mirror.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0004` … `D-COMP-MODS-0006`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Beskid.Compiler.SyntaxMirror facade - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Beskid.Compiler.SyntaxMirror facade - Design model](./articles/design-model/)
- [Beskid.Compiler.SyntaxMirror facade - Examples](./articles/examples/)
- [Beskid.Compiler.SyntaxMirror facade - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Beskid.Compiler.SyntaxMirror facade - Flow and algorithm](./articles/flow-and-algorithm/)
- [Beskid.Compiler.SyntaxMirror facade - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
