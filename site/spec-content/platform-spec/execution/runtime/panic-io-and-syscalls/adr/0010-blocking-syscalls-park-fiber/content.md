---
title: Blocking syscalls park the calling fiber
description: Scheduler run_blocking offloads host work without stalling other fibers.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-EXEC-RT-0010
adrStatus: Accepted
adrDate: 2026-04-01
lastReviewed: 2026-05-22
---

## Context

Blocking `read`/`write` on a fiber must not freeze the entire M:N scheduler or violate Phase A mutator rules on pool threads.

## Decision

| Rule | Detail |
| --- | --- |
| Blocking path | Enqueue host blocking work on syscall pool; **park** current fiber only |
| Wake | Resume fiber on scheduler thread when worker completes |
| Pool workers | **Must not** execute generated Beskid mutator code or allocate as mutators |
| Pool worker tagging | Each pool thread calls `set_syscall_pool_worker()` so the runtime can assert this rule (`assert_mutator_allowed`) and panic on accidental allocation |
| Allocation | Runtime object creation for results happens after resume on scheduler thread |
| Console | Producers **Send** bytes/events; consumers **Receive** on fibers |

## Consequences

M6+ syscall integration is required for conformance on blocking builtins.

## Verification anchors

Scheduler `run_blocking`; fiber scheduler [verification](../verification-and-traceability/) article.
