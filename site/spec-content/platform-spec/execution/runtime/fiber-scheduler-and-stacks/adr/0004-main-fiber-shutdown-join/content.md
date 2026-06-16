---
title: Main fiber shutdown joins spawned children
description: main returns after joining non-Detached fibers; Detach panics still abort.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-EXEC-RT-0004
adrStatus: Accepted
adrDate: 2025-09-01
lastReviewed: 2026-05-22
---

## Context

Process exit must not leak running fibers that share the GC heap. Fire-and-forget tasks still need defined failure behavior.

## Decision

| Rule | Detail |
| --- | --- |
| Main fiber | `main()` runs on **fiber 0**; scheduler starts before entry |
| Normal exit | When `main` returns, runtime **Join**s every spawned fiber that was not **Detach**ed |
| Detach | **Detach** fibers are **not** joined at shutdown |
| Detach panic | Unjoined **Detach** child panic **still aborts** the process |
| Pool shutdown | After joins complete, worker thread pool stops |

Matches [D-CORE-CONC-0004](/platform-spec/core-library/concurrency/concurrency-package/adr/0004-main-fiber-shutdown/).

## Consequences

Hosts and tests **must** account for shutdown latency from outstanding joins.

## Verification anchors

Runtime main harness; corelib concurrency shutdown tests.
