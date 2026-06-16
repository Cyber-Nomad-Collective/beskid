---
title: Export on pub functions v0.3
description: Contract vtables as Standard export remain out of scope.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-EXPORT-0003
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Embedding hosts need a minimal stable export surface before full vtable stories.

## Decision

v0.3 Standard **must** support **`[Export]`** on **`pub` functions** with FFI-permitted types. Exporting arbitrary **`contract`** vtables as Standard is **out of scope** for v0.3.

## Consequences

Callback registration table protocol is Standard; foreign-thread entry without host contract is Proposed v0.3.2+.

## Verification anchors

[export attribute](/platform-spec/language-meta/interop/export-and-callbacks/export-attribute/); [callback registration](/platform-spec/language-meta/interop/export-and-callbacks/callback-registration/).
