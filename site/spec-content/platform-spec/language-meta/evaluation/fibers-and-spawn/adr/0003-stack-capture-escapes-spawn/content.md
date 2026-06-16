---
title: Stack captures cannot escape spawn
description: Closure captures that share stack memory across fibers are rejected.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-FIBERS-0003
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Moving stack references into another fiber breaks the memory model and GC rooting assumptions.

## Decision

Closure captures that would leak stack references across fibers **must** be rejected with diagnostic **`StackReferenceEscapesSpawn`** (compile error).

## Consequences

Authors pass data through `Channel<T>` or other approved sharing; runtime does not repair invalid captures.

## Verification anchors

`compiler/crates/beskid_analysis/` capture analysis; [Memory and references](/platform-spec/language-meta/memory-model/memory-and-references/).
