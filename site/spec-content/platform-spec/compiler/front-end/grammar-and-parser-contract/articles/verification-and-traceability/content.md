---
title: Grammar and parser contract - Verification and traceability
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

This article documents **verification and traceability** for **grammar and parser contract** in the reference compiler.

## What this covers
For newcomers, this page explains where the contract shows up in day-to-day compiler work and which code paths are most useful first reads.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/beskid.pest` defines the grammar tokens and precedence.
- `compiler/crates/beskid_analysis/src/syntax/` builds syntax items from parser output.
- `compiler/crates/beskid_analysis/src/syntax/items/parse_helpers.rs` contains shared parse helpers used by item parsers.

## Grammar evidence

Verification **must** include:

- Removal of legacy `MetaDefinition` from `beskid.pest` and AST/HIR surfaces.
- Parser snapshot tests for **`extend type`** syntax.
- Formatter and LSP smoke tests when `extend type` affects structure-sensitive tooling.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
