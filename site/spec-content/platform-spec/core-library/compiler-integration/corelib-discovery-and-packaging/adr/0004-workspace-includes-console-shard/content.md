---
title: Workspace includes console shard
description: corelib_console is a workspace member depended on by beskid_corelib.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-COMP-0004
adrStatus: Accepted
adrDate: 2026-04-23
lastReviewed: 2026-05-22
---

## Context

Console/ANSI must ship with the aggregate package, not as an orphan.

## Decision

| Rule | Detail |
| --- | --- |
| Workspace | `compiler/corelib/Workspace.proj` lists `packages/console` |
| Aggregate | `beskid_corelib` depends on `corelib_console` |

## Consequences

Publish CI packs the full workspace graph for registry corelib.

## Verification anchors

`Workspace.proj`; corelib CI publish job.
