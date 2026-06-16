---
title: Registry and overrides contract - Verification and traceability
description: Shows how the team proves this feature works and where evidence lives.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

This article documents **verification and traceability** for **registry and overrides contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_tests/src/projects/corelib/mod.rs` validates project source selection behavior.
- `compiler/crates/beskid_cli/src/commands/` provides CLI-level switches for registry interaction.
- `pckg/src/Server/` is the registry-side system consumed by compiler/project tooling.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
