---
title: spawn keyword; async and await reserved
description: Keyword policy for fiber introduction vs deferred async syntax.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-CONC-0006
adrStatus: Accepted
adrDate: 2025-08-01
lastReviewed: 2026-05-22
---

## Context

Aligns with inception ADR D-INC-0008; avoids dual concurrency models in v1.

## Decision

| Rule | Detail |
| --- | --- |
| Keyword | `spawn` required for new fibers; no `go` alias in v1 |
| Reserved | `async` and `await` are **parse errors** (reserved, not implemented) |
| Data transfer | **Channel** only between fibers for data; **Mutex** / **WaitGroup** for coordination |
| Handles | `` `Fiber<T>` `` and `` `Channel<T>` `` are **move-only** |

## Consequences

Parser and semantic tests reject async/await; spawn lowering returns `` `Fiber<T>` ``.

## Verification anchors

Parser fixtures; [Fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/).
