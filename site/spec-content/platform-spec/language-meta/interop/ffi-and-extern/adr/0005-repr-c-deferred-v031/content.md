---
title: repr C records deferred to v0.3.1
description: CLayout primitive structs are Proposed not v0.3.0 Standard.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-FFI-0005
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Arbitrary Beskid record `repr(C)` needs layout rules beyond interop views.

## Decision

**`repr(C)`** on arbitrary Beskid types is **out of scope** for v0.3.0 Standard; **CLayout** primitive structs land in **v0.3.1** (Proposed) per [C layout types](/platform-spec/language-meta/interop/c-abi-profile/c-layout-types/).

## Consequences

v0.3.0 Standard ships interop view types and link-time import first.

## Verification anchors

[C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/).
