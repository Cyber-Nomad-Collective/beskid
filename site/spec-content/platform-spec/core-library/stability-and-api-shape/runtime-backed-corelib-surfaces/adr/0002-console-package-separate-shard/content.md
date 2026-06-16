---
title: Console package is a separate shard
description: ANSI and terminal helpers live in corelib_console.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-STAB-0002
adrStatus: Accepted
adrDate: 2026-04-23
lastReviewed: 2026-05-22
---

## Context

Higher console work must not bloat runtime syscall modules.

## Decision

| Rule | Detail |
| --- | --- |
| Package | `compiler/corelib/packages/console` (`corelib_console`) |
| Runtime | Streams stay in runtime package |

## Consequences

Terminal features document against console package anchors.

## Verification anchors

`packages/console`; pckg workspace publish.
