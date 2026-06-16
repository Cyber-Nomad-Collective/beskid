---
title: Primary contract for Program assembly
description: This feature hub defines how the reference compiler turns a
  resolved **`CompilePlan`** plus **effective (materialized-fi
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-BUILD-0015
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

This feature hub defines how the reference compiler turns a resolved **`CompilePlan`** plus **effective (materialized-first) source roots** into a **`ProgramAssembly`**: discovered `.bd` units, a shared **`ModuleIndex`** for cross-module resolution, and a single front-end spine consumed by CLI, LSP, analyze, and codegen. JIT and AOT backends consume **`CodegenArtifact`** only and do not re-run assembly.

## Decision

The reference compiler **must** implement Program assembly as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/`
