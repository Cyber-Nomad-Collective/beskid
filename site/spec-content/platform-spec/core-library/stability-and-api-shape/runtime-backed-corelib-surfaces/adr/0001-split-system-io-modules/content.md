---
title: Split System I/O modules
description: stdin/stdout/stderr are separate runtime-backed modules.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-STAB-0001
adrStatus: Accepted
adrDate: 2026-04-23
lastReviewed: 2026-05-22
---

## Context

Monolithic IO.bd hid syscall direction and descriptor typing.

## Decision

| Rule | Detail |
| --- | --- |
| Surface | `Core.Input`, `Core.Output`, `Core.Error` under `packages/foundation/src/Core/` |
| Non-goal | Monolithic `IO.bd` for standard streams |

## Consequences

Syscall descriptors stay typed per stream.

## Verification anchors

`packages/foundation/src/Core/Input/`, `Output/`, `Error/`; stream contract tests.
