---
title: Beskid.Compiler.SyntaxMirror facade - Verification and traceability
description: Typed, allocation-bounded syntax node API exposed to compile-time
  Beskid modules.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-04-30
---

This article documents **verification and traceability** for **Beskid.Compiler.SyntaxMirror facade**.

## Traceability matrix
- Anchor: `corelib` package module `Beskid.Compiler.SyntaxMirror` (generated + hand-authored surface).
- Anchor: `compiler/crates/beskid_analysis/src/syntax/` — authoritative internal model to mirror.

## Verification expectations
- Contract tests in `compiler/crates/beskid_tests` assert ordering, diagnostic codes, and merge behavior once implemented.
- Golden incremental traces (optional) validate invalidation when syntax edits move spans tied to meta registrations.

## Review cadence
- Update this bundle whenever public `Beskid.Compiler.*` shapes or host policies change.
