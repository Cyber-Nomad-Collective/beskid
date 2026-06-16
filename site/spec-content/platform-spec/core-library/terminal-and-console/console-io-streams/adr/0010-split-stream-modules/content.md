---
title: Split stream modules per fd
description: stdin/stdout/stderr use separate System modules.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TERM-0010
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

A single Console IO type obscures direction and syscall descriptors.

## Decision

| Rule | Detail |
| --- | --- |
| Modules | `Core.Input`, `Core.Output`, `Core.Error` |
| Forbidden | Monolithic console IO type for standard streams |

## Consequences

Each module binds one `StandardStream` descriptor; cross-stream APIs stay separate.

## Verification anchors

`packages/foundation/src/Core/Input/Input.bd`, `Output/Output.bd`, `Error/Error.bd`.
