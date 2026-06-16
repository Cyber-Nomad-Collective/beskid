---
title: Extern import extraction contract - Design model
description: Explains the persistent concepts, entities, and boundaries this
  feature relies on.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

This article documents **design model** for **extern import extraction contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_abi/src/builtins.rs` and `symbols.rs` define import-facing ABI names.
- `compiler/crates/beskid_runtime/src/builtins/mod.rs` provides runtime implementations for extracted imports.
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` verifies extern calls end-to-end.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
