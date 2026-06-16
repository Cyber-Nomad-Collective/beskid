---
title: User C ABI separate from runtime Rust exports
description: Tier-1 user libraries use C profile; runtime builtins stay on Rust ABI.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-FFI-0004
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Mixing user `Extern` symbols with `BESKID_RUNTIME_ABI_VERSION` exports caused namespace and stability risk.

## Decision

| Plane | Rule |
| --- | --- |
| User libraries | **C ABI profile** + link-time binding |
| Runtime embedding | **Rust ABI profile** / frozen builtin table |
| Separation | User **`Extern`** **must not** mutate runtime builtin symbol namespace |

## Consequences

JIT registration and engine policy keep tables disjoint; see profile boundary map on hub.

## Verification anchors

`compiler/crates/beskid_abi`; [Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/); [C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/).
