---
title: Build and run orchestration - Contracts and edge cases
description: States the normative guarantees and what happens at boundaries or
  failure edges.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

This article documents **contracts and edge cases** for **build and run orchestration** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_cli/src/commands/` coordinates compile, run, and doc commands.
- `compiler/crates/beskid_engine/src/jit_module.rs` executes JIT pipelines from compiled artifacts.
- `compiler/crates/beskid_tests/src/runtime/jit.rs` and e2e fixtures verify orchestration behavior.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
