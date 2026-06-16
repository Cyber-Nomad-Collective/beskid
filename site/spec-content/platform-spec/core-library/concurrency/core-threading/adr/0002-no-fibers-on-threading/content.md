---
title: Do not build fibers on OS threads
description: Fibers must use Fiber/Channel builtins, not Thread wrappers.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-SYST-0002
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Mixing models breaks GC safepoints and scheduler invariants.

## Decision

| Rule | Detail |
| --- | --- |
| Forbidden | Fiber scheduler emulation via `Core.Threading` in corelib |
| Required | Use [Concurrency package](/platform-spec/core-library/concurrency/concurrency-package/) |

## Consequences

Documentation and examples steer authors to spawn/fiber APIs.

## Verification anchors

Concurrency integration tests; core-threading module docs.
