---
title: Readme packaging for pckg artifacts
description: Pack copies declared readme into README.md for registry docs.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-COMP-0003
adrStatus: Accepted
adrDate: 2026-04-23
lastReviewed: 2026-05-22
---

## Context

Registry consumers expect root README.md in `.bpk` artifacts.

## Decision

| Rule | Detail |
| --- | --- |
| Declare | Optional `readme = "path.md"` in Project.proj |
| Default | `readme.md` at package root when present |
| Pack | `beskid pckg pack` places resolved file as **`README.md`** |

## Consequences

pckg documentation ingest uses consistent entry filename.

## Verification anchors

`PackagePublishDocumentation.cs`; pack integration tests.
