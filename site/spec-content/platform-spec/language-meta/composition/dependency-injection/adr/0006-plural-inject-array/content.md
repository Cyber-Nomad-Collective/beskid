---
title: Multiple implementations via inject T[]
description: Singular inject must be unique at the resolution level.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-DI-0006
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Apps register multiple implementations of one contract (for example two `Storage`).

## Decision

Multiple implementations **must** use **`inject Contract[]`** (or concrete **`T[]`**). Singular **`inject Contract`** **must** be unique at the resolution level (**E1705** when ambiguous).

## Consequences

Deterministic registration merge order defines array element order.

## Verification anchors

[Design model](/platform-spec/language-meta/composition/dependency-injection/design-model/); [FAQ](/platform-spec/language-meta/composition/dependency-injection/faq-and-troubleshooting/).
