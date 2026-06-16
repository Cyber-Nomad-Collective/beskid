---
title: composition.resolve pipeline placement
description: Resolves after semantic.snapshot before mod.analyze.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-DI-0009
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Compiler mods need a frozen composition snapshot but must not mutate app graphs.

## Decision

Pipeline phase **`composition.resolve`** **must** run after **`semantic.snapshot`** and before **`mod.analyze`** (see [Stage ordering](/platform-spec/compiler/build-pipeline/stage-ordering/)).

## Consequences

Mods query read-only snapshots; app graph build stays in analysis.

## Verification anchors

`compiler/crates/beskid_pipeline`; [Flow and algorithm](/platform-spec/language-meta/composition/dependency-injection/flow-and-algorithm/).
