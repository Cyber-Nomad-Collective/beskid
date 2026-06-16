---
title: Mod rewrite before semantic gate
description: MOD_REWRITE must complete before SEMANTIC and LOWER in every host path.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-BUILD-0020
adrStatus: Accepted
adrDate: 2026-05-29
lastReviewed: 2026-05-29
---

## Context

Analyze-only paths ran staged semantic rules and type-check gates on pre-rewrite AST, then discarded mod `analyze` rewrite output. Execute paths applied rewrite first—producing different diagnostics and HIR for the same source.

## Decision

In **all** hosts (CLI gate, LSP, `prepare_compilation`, codegen front-end):

1. Mod collect → generate → **rewrite** (`MOD_REWRITE` / `run_analyze_rewrite`) **must** finish before `SEMANTIC` staged rules.
2. Semantic snapshot and typed HIR lowering **must** observe the post-rewrite entry program.
3. Running rewrite after semantic/typecheck, or discarding rewrite in analyze-only mode, is **forbidden**.

Phase ids in `beskid_pipeline::phases` **must** reflect this ordering for observers and conformance tests.

## Consequences

`flow-and-algorithm` mermaid and phase DAG tests align analyze with run/build. Mod host integration changes require ADR updates if reordering is proposed.

## Verification anchors

- `compiler/crates/beskid_pipeline/src/phases.rs`
- `compiler/crates/beskid_analysis/src/mod_host/`
- `compiler/crates/beskid_analysis/src/services/analyze.rs`
- `compiler/crates/beskid_analysis/src/services/front_end.rs`
