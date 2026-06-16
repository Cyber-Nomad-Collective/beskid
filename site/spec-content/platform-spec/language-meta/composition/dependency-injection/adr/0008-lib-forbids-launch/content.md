---
title: Lib targets forbid launch
description: Libraries may declare host types but not launch.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-DI-0008
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Test and library packages attempted to embed process entry via launch.

## Decision

**`Lib`** project targets **may** declare **`host`** types for reuse but **`launch`** is **forbidden** (**E1711**). Only app/test host targets **may** **`launch`**.

## Consequences

Consumers reference library hosts from their own app targets or approved harness entries.

## Verification anchors

[FAQ](/platform-spec/language-meta/composition/dependency-injection/faq-and-troubleshooting/).
