---
title: mod host bridge - Verification and traceability
description: Reference compiler-owned execution, capability policy, and
  communication with compile-time Beskid modules.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-04-30
---

This article documents **verification and traceability** for **mod host bridge**.

## Traceability matrix

| Anchor | Role |
| --- | --- |
| `compiler/crates/beskid_aot/src/mod_artifact.rs` | Mod AOT artifact build, cache key tuple, descriptor emission. |
| `compiler/crates/beskid_analysis/src/mod_host/` | Reference mod host orchestration: discovery, capabilities, validation, contract dispatch, typed merge / reparse, analyze / rewrite. |
| `compiler/crates/beskid_analysis/src/mod_host/diagnostics.rs` | Structured **`ModHostIssue`** / **`ModHostDiagnostics`** with **E1828**, **E1829**, **E1830**, **E1831**, **E1851**, **E1852**, **E1853**, **E1854**, **E1855**. |
| `compiler/crates/beskid_analysis/src/mod_host/validate.rs` | Pre-`mod.collect` cross-artifact validation pass. |
| `compiler/crates/beskid_analysis/src/mod_host/invoker.rs` | **`ContractInvoker`** trait + **`StubContractInvoker`** / **`ScriptedContractInvoker`** test surfaces. |
| `compiler/crates/beskid_analysis/src/services/front_end.rs` | Front-end integration for `run_through_generate` before semantic diagnostics and `run_analyze_rewrite` after semantic work. |
| `compiler/crates/beskid_codegen/src/services.rs` | Lowering / codegen integration for mod host phases before `lower.ready`. |
| `compiler/crates/beskid_pipeline/src/phases.rs` | Literal `mod.load`, `mod.collect`, `mod.generate`, `mod.analyze`, `mod.rewrite` phase ids. |

## Test anchors

| Anchor | Coverage |
| --- | --- |
| `compiler/crates/beskid_analysis/src/mod_host/api.rs` (unit tests) | Skip mod phases on no-mod plans, dispatch all four contract kinds through `StubContractInvoker`, abort on duplicate `(contractId, typeId)` registration with **E1829**. |
| `compiler/crates/beskid_analysis/src/mod_host/validate.rs` (unit tests) | Per-issue assertions for **E1828**, **E1829**, **E1851**, **E1852**, **E1853**, **E1854**, plus a clean-load pass. |
| `compiler/crates/beskid_tests/src/mods/contract_dispatch.rs` | End-to-end dispatch through every contract kind against the `sample_mod` fixture; canonical pipeline phase order. |
| `compiler/crates/beskid_tests/src/mods/conflicts.rs` | End-to-end **E1828**, **E1829**, **E1853**, **E1854** scheduling abort tests against the `sample_mod` fixture. |
| `compiler/crates/beskid_tests/fixtures/mods/sample_mod/` | Reference compiler-mod fixture exercising `Collector`, `Generator`, `AttributeGenerator`, `Analyzer`, `Rewriter`. |
| `compiler/crates/beskid_engine/tests/mod_host.rs` | Engine-level integration: drives the full pipeline and JIT-compiles the lowered host program. |
| `compiler/crates/beskid_tests/src/analysis/pipeline/mod_phases.rs` | Pipeline-phase ordering subsequence assertions and `FULL_BUILD_PHASE_ORDER` regression. |

## Verification expectations

- **Phase ids** — Unit or integration tests **must** assert the literal strings from **[Compiler Mods / Mod projects and pipeline phase ids](/platform-spec/compiler/compiler-mods/#mod-projects)** appear in `beskid_pipeline` observations (see **[Stage ordering / verification](/platform-spec/compiler/build-pipeline/stage-ordering/verification-and-traceability/)**).
- **Contract dispatch** — `ContractInvoker` is dispatched once per scheduled `(contractId, typeId, entrySymbol)` tuple per phase, with `Collector` / `Generator` outcomes returned from `run_through_generate` and `Analyzer` / `Rewriter` outcomes returned from `run_analyze_rewrite_with_invoker`.
- **Capabilities** — Table-driven tests in `compiler/crates/beskid_analysis/src/mod_host/capabilities.rs` verify each capability grants / denies the documented effect and emits codes from the **E1821–E1835** band on denial.
- **AOT artifacts** — Tests assert descriptor schema, cache key invalidation, and **E1821–E1835** on deliberate load failures (**[AOT artifact contract](./aot-artifact-contract/)**).
- **Scheduling conflicts** — Tests assert **E1828**, **E1829**, **E1851–E1855** short-circuit scheduling **before** `mod.collect` is observed (see **`compiler/crates/beskid_tests/src/mods/conflicts.rs`** and the scheduling-conflict band in **[AOT artifact contract](./aot-artifact-contract/#scheduling-conflict-diagnostics-e1851e1870)**).
- **Merge** — Tests assert atomic typed-emit commit at `syntax.generation`: partial emit never reaches `lower.ready` (pair with **[Typed emitter / verification](/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/verification-and-traceability/)** once populated).
- **Incremental traces** — Optional goldens validate invalidation when syntax edits move spans tied to mod contract registrations (**[Incremental scheduling / verification](/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/verification-and-traceability/)**).

## Review cadence
- Update this bundle whenever public `Beskid.Compiler.*` shapes or host policies change.
