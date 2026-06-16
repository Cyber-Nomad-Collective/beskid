---
title: Mod projects exempt from host injection
description: Compiler mods compile as carriers without host corelib rules.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-COMP-0007
adrStatus: Accepted
adrDate: 2026-04-23
lastReviewed: 2026-05-22
---

## Context

Mods are not end-user hosts; injecting corelib would distort mod graphs.

## Decision

| Rule | Detail |
| --- | --- |
| `Mod` | Does not receive implicit host injection |
| `Host` | Receives implicit corelib per D-CORE-COMP-0005 |

## Consequences

Mod SDK projects declare their own dependency closure.

## Verification anchors

Mod project tests in `beskid_tests`.
