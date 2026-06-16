---
title: Rust AST reflection into Beskid.Compiler SDK
description: Hand-maintained parallel syntax trees diverged from the host parser.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-MODS-0015
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Hand-maintained parallel syntax trees diverged from the host parser.

## Decision

Canonical syntax model is generated via `beskid_ast_reflect_gen` into `Beskid.Compiler.*` SDK sources from the Rust AST—aligned with D-INC-0006.

## Consequences

Mods consume generated facades; internal `beskid_analysis::syntax` remains host-only.

## Verification anchors

- `beskid_ast_reflect_gen`
- `compiler/crates/beskid_analysis/src/syntax/`.
