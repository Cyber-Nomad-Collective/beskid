---
title: Per-thread GC session on entry
description: OS thread entry must attach heap session and GC roots.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-SYST-0004
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Parallel OS threads require independent GC attachment rules in Phase A.

## Decision

| Rule | Detail |
| --- | --- |
| Entry | Thread start **must** establish runtime heap session |
| FFI | `extern "C"` stays pinned to calling OS thread for call duration |

## Consequences

Violations risk root loss or cross-thread heap corruption.

## Verification anchors

[Extern dispatch and policy](/platform-spec/execution/abi-and-host/extern-dispatch-and-policy/); GC phase ADRs.
