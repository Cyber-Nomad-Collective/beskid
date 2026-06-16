---
title: arrays_backing gates array element storage
description: Without the feature, array_new may emit header-only arrays with null backing.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-EXEC-RT-0015
adrStatus: Accepted
adrDate: 2025-11-01
lastReviewed: 2026-05-22
---

## Context

Array lowering depends on whether the linked runtime allocates element storage behind `BeskidArray` headers.

## Decision

| `arrays_backing` | Behavior |
| --- | --- |
| **Enabled** | `array_new` allocates element storage; `ptr` non-null when length > 0 |
| **Disabled** | Header-only arrays; `ptr` may be **null** |
| ABI | Symbol list unchanged; semantics differ by build — document in release matrices |
| Alignment | Shipped CLI/VSIX **should** enable `arrays_backing` for reference user workflows |

## Consequences

Conformance and doc tests **must** pin feature set when asserting array behavior.

## Verification anchors

`beskid_runtime` `array_new`; runtime JIT tests with feature flags.
