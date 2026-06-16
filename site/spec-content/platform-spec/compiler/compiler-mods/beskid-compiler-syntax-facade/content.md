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

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0004` … `D-COMP-MODS-0006`); use the reader **ADRs** tab for expandable detail.

- [Design model](./design-model/)
- [Flow and algorithm](./flow-and-algorithm/)
- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Examples](./examples/)
- [Verification and traceability](./verification-and-traceability/)
- [FAQ and troubleshooting](./faq-and-troubleshooting/)
