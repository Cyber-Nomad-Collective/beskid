---
title: Cranelift lowering via lower_source
description: Lowering was split across experimental paths.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-IR-0009
adrStatus: Superseded
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Lowering was split across experimental paths.

## Decision

`beskid_codegen::lower_source` is the single lowering entry producing `CodegenArtifact` consumed by `JitModule`.

## Consequences

Experimental IR dumps must not bypass this entry in release builds.

## Verification anchors

- `compiler/crates/beskid_codegen`
- `compiler/crates/beskid_engine/src/jit_module.rs`.
