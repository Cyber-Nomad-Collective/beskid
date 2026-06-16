---
title: Field inject only
description: Constructor parameter inject is rejected (E1712).
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-DI-0003
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Constructor injection churns signatures across inheritance and complicates lowering.

## Decision

**`inject`** **must** apply to **fields** on ordinary types only. Constructor-parameter **`inject`** **must** be rejected (**E1712**).

## Consequences

Uniform type headers and a single slot-lowering story for injected fields.

## Verification anchors

[Design model](/platform-spec/language-meta/composition/dependency-injection/design-model/); [FAQ](/platform-spec/language-meta/composition/dependency-injection/faq-and-troubleshooting/).
