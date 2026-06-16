---
title: Single prepared compilation spine
description: One front-end prepare path serves analyze, run, build, test, clif,
  LSP, and doc with mode flags only.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-BUILD-0019
adrStatus: Accepted
adrDate: 2026-05-29
lastReviewed: 2026-05-29
---

## Context

CLI analyze gates, LSP document analysis, and execute paths (`run`, `build`, `test`) previously scheduled mod host, rewrite, semantic, and typed HIR through parallel entry points. That allowed diagnostic and AST drift between “check only” and “compile and run.”

## Decision

The reference compiler **must** expose one production front-end—`prepare_compilation` (or the existing `compile_front_end_from_resolved_input` name until renamed)—that returns a **`PreparedCompilation`** artifact (typed HIR, resolution, assembly cache, mod session metadata).

| Rule | Detail |
| --- | --- |
| Sole spine | Analyze, run, build, test, clif, LSP project diagnostics, and doc export **must** call this function; mode flags (`DiagnosticsOnly` vs `Executable`) select early exit only—**not** alternate pipelines |
| No parallel analyze | `analyze_program_with_options_and_plan` and paths that run semantic rules on pre-rewrite AST **must not** remain production gates |
| Cached assembly | `ResolvedInput.assembly` **must** be populated once at resolve and reused; re-assembly on every consumer is forbidden |

## Consequences

Command and LSP refactors converge on `beskid_analysis::services::prepare_compilation`. New surfaces add `PrepareMode` flags instead of duplicating mod/semantic/HIR scheduling.

## Verification anchors

- `compiler/crates/beskid_analysis/src/services/front_end.rs`
- `compiler/crates/beskid_analysis/src/services/analyze.rs`
- `compiler/crates/beskid_cli/src/frontend.rs`
- `compiler/crates/beskid_analysis/src/services/input.rs`
