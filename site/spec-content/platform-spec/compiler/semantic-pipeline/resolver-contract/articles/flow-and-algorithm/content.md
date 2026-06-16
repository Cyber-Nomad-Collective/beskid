---
title: Resolver contract - Flow and algorithm
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

This article documents **flow and algorithm** for **resolver contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs` owns name resolution and scope lookup.
- `compiler/crates/beskid_analysis/src/resolve/items.rs` resolves item-level references.
- `compiler/crates/beskid_tests/src/analysis/resolve.rs` exercises resolver behavior in tests.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
