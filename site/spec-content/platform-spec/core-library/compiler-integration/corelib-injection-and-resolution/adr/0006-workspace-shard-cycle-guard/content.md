---
title: Workspace shard cycle guard
description: Corelib member packages must not implicit-back-link to aggregate.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-COMP-0006
adrStatus: Accepted
adrDate: 2026-04-23
lastReviewed: 2026-05-22
---

## Context

Shards under `packages/*` would create cycles if they gained implicit host edges.

## Decision

| Rule | Detail |
| --- | --- |
| Guard | `is_corelib_workspace_shard_manifest` skips implicit back-edge |
| Host | Only application hosts receive implicit corelib |

## Consequences

Building `packages/runtime` alone does not pull beskid_corelib as a hidden parent.

## Verification anchors

`resolver.rs`; corelib workspace compile tests.
