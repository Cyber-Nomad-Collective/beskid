---
title: User export distinct from runtime builtins
description: Export symbols are generated; builtins stay beskid_abi.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-EXPORT-0002
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Plugin authors confused generated exports with frozen JIT builtin tables.

## Decision

User **export** symbols are **generated** from Beskid compilation units. Frozen **runtime builtin** exports remain on **`beskid_abi`** / **[Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/)** — export-only work **must not** change `BESKID_RUNTIME_ABI_VERSION`.

## Consequences

Codegen plans export metadata beside `ExternImport`; trampolines use runtime TLS hooks.

## Verification anchors

/platform-spec/language-meta/interop/export-and-callbacks/ implementation anchors.
