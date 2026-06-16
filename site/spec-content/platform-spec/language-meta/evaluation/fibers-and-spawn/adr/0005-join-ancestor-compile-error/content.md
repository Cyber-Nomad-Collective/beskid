---
title: Join on ancestor handle is forbidden
description: Child Join on parent or ancestor Fiber handle is JoinWouldDeadlock.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-LMETA-FIBERS-0005
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Waiting on an ancestor handle while the ancestor may wait on descendants creates predictable deadlocks.

## Decision

**Join** on a parent or ancestor `Fiber<T>` handle **must** be a compile error (**`JoinWouldDeadlock`**). Normative ordering for cancel + Join aligns with [D-CORE-CONC-0014](/platform-spec/core-library/concurrency/concurrency-package/adr/0014-join-ancestor-forbidden/).

## Consequences

Structured concurrency stays acyclic on the join graph; runtime need not recover ancestor joins.

## Verification anchors

`compiler/crates/beskid_analysis/`; [D-CORE-CONC-0014](/platform-spec/core-library/concurrency/concurrency-package/adr/0014-join-ancestor-forbidden/).
