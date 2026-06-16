---
title: Conformance evidence policy - Flow and algorithm
description: Walks through runtime/order-of-operations behavior in the implementation.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

This article documents **flow and algorithm** for **conformance evidence policy** in the reference compiler.

## What this covers
The conformance evidence pipeline follows a fixed phase order. Every Mod project passes through the same sequence, and tests must record phases to assert they fire in the documented order.

## Pipeline phase ordering

```
parse → mod.load → mod.collect → mod.generate → [semantic gate] → mod.analyze → mod.rewrite → lowering
```

The `PipelineObserver` trait (in `beskid_analysis::mod_host`) records each phase transition. Tests assert that:
- Phases never appear out of order.
- No phase is skipped unless the semantic gate rejects the program.
- Lowering always follows rewrite, never precedes it.

## Key test entrypoints
- `compiler/crates/beskid_tests/src/mods/contract_dispatch.rs` — End-to-end dispatch through the full Mod pipeline, asserting canonical phase ordering per `PipelineObserver`.
- `compiler/crates/beskid_engine/tests/jit_pipeline_observer.rs` — JIT-specific observer that validates phase order during engine execution.
- `compiler/crates/beskid_tests/src/analysis/pipeline/mod_phases.rs` — Unit-level phase ordering for the analysis layer.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
