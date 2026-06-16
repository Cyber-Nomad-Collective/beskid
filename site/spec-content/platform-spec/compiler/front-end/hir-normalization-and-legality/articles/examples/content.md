---
title: HIR normalization and legality - Examples
description: Gives concrete newcomer-friendly scenarios mapped to real compiler paths.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

This article documents **examples** for **hir normalization and legality** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/resolve/mod.rs` orchestrates normalization boundaries.
- `compiler/crates/beskid_analysis/src/resolve/resolver.rs` enforces legality while resolving symbols.
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/definitions.rs` validates post-normalization invariants.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
