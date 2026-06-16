---
title: Workspace and lock contracts - FAQ and troubleshooting
description: Answers common operator and contributor questions with practical next checks.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

This article documents **faq and troubleshooting** for **workspace and lock contracts** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/compile.rs` covers lock-sensitive workspace builds.
- `compiler/crates/beskid_tests/src/projects/corelib/layout.rs` validates workspace folder invariants.
- `compiler/crates/beskid_cli/src/commands/` is the public entrypoint for lock policy flags.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
