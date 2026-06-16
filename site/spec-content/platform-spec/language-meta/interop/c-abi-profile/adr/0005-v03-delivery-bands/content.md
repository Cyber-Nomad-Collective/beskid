---
title: v0.3.0 views v0.3.1 CLayout bands
description: Delivery bands separate Standard views from Proposed layout structs.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-CABI-0005
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Implementers need a spec-first schedule when codegen trails text.

## Decision

| Band | Content | Status |
| --- | --- | --- |
| **v0.3.0** | Interop views, link-time import, symbol overrides | Standard (spec; impl may trail) |
| **v0.3.1** | `CLayout` primitive structs | Proposed |
| **Later** | Nested FFI structs, enum ABI, foreign-thread entry | Planned |

## Consequences

Articles tag Proposed vs Standard explicitly; CI strict mode can gate premature Standard claims.

## Verification anchors

/platform-spec/language-meta/interop/c-abi-profile/ and child articles.
