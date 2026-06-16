---
title: OnCancelled on Fiber handle only
description: Spawn entry types vs fiber handle contract surface.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-CONC-0011
adrStatus: Accepted
adrDate: 2025-08-01
lastReviewed: 2026-05-22
---

## Context

Authors should not declare cancellation events on arbitrary spawn closures.

## Decision

| Rule | Detail |
| --- | --- |
| Placement | **OnCancelled** on `` `Fiber<T>` `` handle from ``spawn`` only |
| Spawn entry | Ordinary `` `fn(...) -> T` ``; **does not** declare **OnCancelled** |
| Handle | `` `Fiber<T>` `` struct wrapping runtime builtins |

## Consequences

Lowering wires cancel slot from handle metadata.

## Verification anchors

Semantic + lowering tests for spawn.
