---
title: Typed emitter and transforms - Verification and traceability
description: Construction of syntax nodes and declarative transforms without raw
  text printing.
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

This article documents **verification and traceability** for **Typed emitter and transforms**.

## Traceability matrix
- Anchor: `compiler/crates/beskid_analysis/src/syntax/items/` — patterns for well-formed item emission.
- Anchor: `compiler/crates/beskid_codegen/` — downstream expectations after merge.

## Verification expectations

- **Merge conflicts** — Tests assert two generator contributors targeting the same declaration identity emit deterministic **E1836–E1850** diagnostics and leave the syntax tree unchanged (see **[Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/)**).
- **Lowering guard** — Tests ensure `lower.ready` (or equivalent sequencing) never fires between partial emit and rollback.
- **Golden traces (optional)** — Same as **[Incremental scheduling / verification](/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/verification-and-traceability/)** when emit drives invalidation.

## Review cadence
- Update this bundle whenever public `Beskid.Compiler.*` shapes or host policies change.
