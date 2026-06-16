---
title: Extern import metadata at lowering
description: FFI symbols were discovered late in the engine.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-IR-0006
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

FFI symbols were discovered late in the engine.

## Decision

Extern imports are collected during lowering (`ExternImport` in codegen context) with ABI names from `beskid_abi`—not ad hoc engine scans.

## Consequences

Link-time binding stays aligned with language-meta C ABI profile.

## Verification anchors

- `compiler/crates/beskid_codegen/src/lowering/`
- `compiler/crates/beskid_abi/src/symbols.rs`.
