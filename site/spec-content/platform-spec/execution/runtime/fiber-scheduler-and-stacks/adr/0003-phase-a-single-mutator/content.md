---
title: Phase A single GC mutator on scheduler threads
description: Only one thread holds Beskid mutator role for allocation at a time.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-EXEC-RT-0003
adrStatus: Accepted
adrDate: 2025-11-15
lastReviewed: 2026-05-22
---

## Context

Fibers may run on multiple OS threads while Phase A GC still uses one process-wide arena (`enter_runtime_scope`). Syscall pool workers must not become second mutators.

## Decision

| Rule | Detail |
| --- | --- |
| Phase A (default) | **One** thread at a time may execute Beskid allocations as GC mutator |
| Scheduler | Transfers mutator execution between fibers on that contract |
| Syscall pool | Workers run blocking host work **without** arbitrary Beskid mutator code or generated allocation; runtime tags them and traps stray allocations (`assert_mutator_allowed`) |
| Phase B (opt-in, v0.3) | Multiple Beskid mutators may share one heap by holding a `MutatorAttachGuard` from `attach_phase_b_mutator`; pointer-payload channel ops apply `gc_write_barrier` on send and receive |
| Future | Phase B becomes the default once preemption code emission and full concurrent-mark stress coverage land |

Aligns with [D-CORE-CONC-0007](/platform-spec/core-library/concurrency/concurrency-package/adr/0007-gc-phase-a-single-mutator/).

## Consequences

`run_blocking` paths park fibers and resume on scheduler threads for mutator work.

## Verification anchors

`beskid_runtime` scheduler + `enter_runtime_scope`; concurrency runtime tests
(`tests/concurrency.rs`, `tests/gc_concurrency.rs`); Phase B opt-in coverage in
`tests/phase_b_concurrency.rs` exercises multi-mutator allocation, pointer-payload
channel write barriers, and the syscall-pool allocation guard.
