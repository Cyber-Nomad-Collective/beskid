---
title: Conformance evidence policy - Verification and traceability
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

This article documents **verification and traceability** for **conformance evidence policy** in the reference compiler.

## What this covers
Maps each conformance evidence requirement to the specific test module, file, or fixture that proves it.

## Traceability map

| Requirement | Proved by | Test file |
|---|---|---|
| Manifest goldens | Valid/invalid `.proj` pairs with stable diagnostic codes | `compiler/crates/beskid_tests/src/mods/fixture.rs`, `projects/mod_manifest.rs` |
| Pipeline ordering | `PipelineObserver` records canonical phase sequence | `compiler/crates/beskid_tests/src/mods/contract_dispatch.rs` |
| Incremental replay | Edit-and-replay cycles produce identical generator output | `compiler/crates/beskid_tests/src/mods/incremental_replay.rs` |
| Analyzer coverage | Analyzers run over host and generated code | `compiler/crates/beskid_tests/src/mods/analyzer_coverage.rs` |
| LSP parity | Mod diagnostics round-trip through `beskid_lsp` | `compiler/crates/beskid_tests/src/spine/diagnostics_parity.rs` |
| Semantic diagnostics | Diagnostic golden tests for analysis passes | `compiler/crates/beskid_tests/src/analysis/diagnostics.rs` |
| Doc tests | Spec snippets compile and match asserted output | `compiler/crates/beskid_tests/src/doc_tests.rs` |
| E2E behavior | Full `.bd` programs through CLI backends | `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` |

## Verification strategy
- **Unit level**: Diagnostic golden tests in `analysis/diagnostics.rs` lock individual analysis pass outputs.
- **Integration level**: Mod pipeline tests in `mods/` assert crate-to-crate contract dispatch order.
- **End-to-end level**: `runtime_cases.rs` validates user-visible behavior through the full CLI path.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
