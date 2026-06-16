---
title: Canonical corelib package identity
description: Published and resolved identity is corelib, not ad-hoc forks.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-COMP-0001
adrStatus: Accepted
adrDate: 2026-04-23
lastReviewed: 2026-05-22
---

## Context

Registry, CLI, and analysis must agree on one package name.

## Decision

| Rule | Detail |
| --- | --- |
| Identity | Package name **`corelib`**; sources under `beskid_corelib` |
| Legacy | `standard_library` paths may alias; identity remains **`corelib`** |

## Consequences

pckg publish, resolver, and docs use the same identity string.

## Verification anchors

`resolver.rs`; `beskid_tests` corelib project fixtures.
