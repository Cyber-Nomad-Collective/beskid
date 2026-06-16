---
title: Invalidation
description: Invalidation
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-TOOL-LSP-0002
adrStatus: Accepted
adrDate: 2026-05-05
lastReviewed: 2026-05-22
---

## Context

Stale snapshots.

## Decision

Invalidate on focus, manifest, lock; debounce watchers.

## Consequences

Config notification.

## Verification anchors

session store.
