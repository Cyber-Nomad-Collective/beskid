# compiler-mod-execution handoff

## Summary

Wired the compiler-mod contract execution pipeline end-to-end through `mod_host` and `beskid_pipeline`:

- `mod.load` → `mod.collect` → `mod.generate` → `mod.analyze` → `mod.rewrite` now invoke real Beskid-side `Collector` / `Generator` / `AttributeGenerator` / `Analyzer` / `Rewriter` contracts on AOT mod artifacts via a new `ContractInvoker` trait (with `StubContractInvoker` for default + bring-up and `ScriptedContractInvoker` for per-`typeId` test outcomes).
- A pre-`mod.collect` validation pass aborts scheduling deterministically with `E1828`, `E1829`, `E1830`, `E1831`, `E1851`, `E1852`, `E1853`, `E1854`, `E1855` from a new structured `ModHostDiagnostics` carrier in `compiler/crates/beskid_analysis/src/mod_host/diagnostics.rs`.
- The host pipeline returns per-contract outcomes from `run_through_generate` (`collector_outcomes`, `generator_outcomes`) and a new `run_analyze_rewrite_with_invoker` (`analyzer_outcomes`, `rewriter_outcomes`) so engine and tests can assert exactly which contracts ran.
- A reference compiler-mod fixture (`crates/beskid_tests/fixtures/mods/sample_mod/`) exercising all four contract kinds (plus `AttributeGenerator`) is checked in. New `beskid_tests::mods::*` and `beskid_engine` integration tests drive the full pipeline through the fixture.
- Platform-spec `compiler/compiler-mods/mod-host-bridge/` is updated: `aot-artifact-contract.mdx` now documents the `E1851-E1870` scheduling-conflict band alongside the existing `E1821-E1835` load-failure band, and `verification-and-traceability.mdx` lists the implemented test anchors.

Branch: `orch/beskid-v0-3/compiler-mod-execution` (superrepo).

## Changes

### Compiler submodule (`compiler/`, branch `orch/beskid-v0-3/compiler-mod-execution`)

| Commit | Title |
| --- | --- |
| `a91d258` | `feat(mod_host): wire mod.collect/generate/analyze/rewrite through ContractInvoker` |
| `0e310d4` | `test(mod_host): reference SampleMod fixture and beskid_tests::mods suite` |
| `43c9620` | `test(engine): mod_host pipeline integration test against SampleMod fixture` |

New / modified Rust files:

- `crates/beskid_analysis/src/mod_host/diagnostics.rs` — new structured `ModHostIssue` enum + `ModHostDiagnostics` aggregate covering `E1828`, `E1829`, `E1830`, `E1831`, `E1851`, `E1852`, `E1853`, `E1854`, `E1855`.
- `crates/beskid_analysis/src/mod_host/validate.rs` — new pre-`mod.collect` validation pass: intra-artifact duplicates, unknown contract IDs, rewriter-without-analyzer, missing entry symbols, cross-artifact conflicts, cross-artifact entry-symbol collisions.
- `crates/beskid_analysis/src/mod_host/invoker.rs` — new `ContractInvoker` trait + outcome types (`CollectorOutcome`, `GeneratorOutcome`, `AnalyzerOutcome`, `AnalyzerDiagnostic`, `RewriterOutcome`) + `StubContractInvoker` (default recorder) + `ScriptedContractInvoker` (test-only scriptable variant).
- `crates/beskid_analysis/src/mod_host/{collect,generate,analyze,rewrite}.rs` — dispatch through `&dyn ContractInvoker` per phase and surface outcomes.
- `crates/beskid_analysis/src/mod_host/api.rs` — `run_through_generate` calls `validate_registrations` before `mod.collect`; new `run_analyze_rewrite_with_invoker` exposes per-contract outcomes; `extract_mod_host_diagnostics` helper for callers.
- `crates/beskid_analysis/src/mod_host/types.rs` — `ModHostInput.invoker`, `ModHostGenerateResult.{collector,generator}_outcomes`, new `ModHostAnalyzeResult`.
- `crates/beskid_analysis/src/mod_host/mod.rs` — re-exports for the new public surfaces.
- `crates/beskid_analysis/src/services/{front_end,composition}.rs`, `crates/beskid_codegen/src/services.rs`, `crates/beskid_tests/src/analysis/pipeline/mod_phases.rs` — propagate `invoker: None` to existing `ModHostInput` callers.
- `crates/beskid_tests/fixtures/mods/sample_mod/` — new reference compiler-mod fixture (`Project.proj`, `Src/Mod.bd`).
- `crates/beskid_tests/src/mods/{mod,fixture,contract_dispatch,conflicts}.rs` — new end-to-end `beskid_tests::mods` suite.
- `crates/beskid_tests/src/lib.rs` — register new `mods` module.
- `crates/beskid_engine/tests/mod_host.rs` — new engine integration test driving the full pipeline + JIT compile of the lowered host program.

### Superrepo (`orch/beskid-v0-3/compiler-mod-execution`)

| Commit | Title |
| --- | --- |
| `aae516f` | `docs(platform-spec): mod-host-bridge anchors for compiler-mod execution` |
| `384847c` | `feat(compiler): bump submodule for compiler-mod-execution` |

Modified spec files (under `pathsAllowed`):

- `site/website/src/content/docs/platform-spec/compiler/compiler-mods/mod-host-bridge/index.mdx` — implementation anchors point at the new modules.
- `site/website/src/content/docs/platform-spec/compiler/compiler-mods/mod-host-bridge/design-model.mdx` — anchored code paths updated.
- `site/website/src/content/docs/platform-spec/compiler/compiler-mods/mod-host-bridge/aot-artifact-contract.mdx` — added normative `E1851–E1870` scheduling-conflict diagnostic band.
- `site/website/src/content/docs/platform-spec/compiler/compiler-mods/mod-host-bridge/verification-and-traceability.mdx` — concrete test anchors for the now-implemented mod-host pipeline.

## Verification

Run from `/Users/mikserek/Projects/beskid` unless noted otherwise. The compiler crate work was developed in an isolated git worktree at `/tmp/compiler-mod-execution` on the same `orch/beskid-v0-3/compiler-mod-execution` branch to avoid interference with other concurrent agents.

| Command | Working dir | Exit code | Notes |
| --- | --- | --- | --- |
| `cargo check -p beskid_analysis` | `/tmp/compiler-mod-execution` | 0 | Compiles cleanly with 3 pre-existing dead-code warnings on `AnalyzedContracts` / `RewriteResult` registrations (kept for forthcoming host-side fix dispatch). |
| `cargo test -p beskid_analysis mod_host:: -- --test-threads=1` | `/tmp/compiler-mod-execution` | 0 | 26 passed, 0 failed. New tests: `mod_host::api::tests::{duplicate_registration_aborts_before_collect_with_e1829, invokes_each_contract_kind_through_pipeline, skips_all_mod_phases_when_plan_has_no_mod_dependencies}`, all `mod_host::diagnostics::tests::*`, all `mod_host::invoker::tests::*`, all `mod_host::validate::tests::*`. |
| `cargo test -p beskid_engine mod_host -- --test-threads=1` | `/tmp/compiler-mod-execution` | 0 | `tests/mod_host.rs::mod_host_full_pipeline_compiles_in_engine` passes (1 of 1 in the binary; canonical test runners report only the relevant binary). |
| `cargo test -p beskid_tests mods:: -- --test-threads=1` | `/tmp/compiler-mod-execution` | 0 | 6 passed, 0 failed: `mods::contract_dispatch::sample_mod_dispatches_all_four_contract_kinds_through_invoker`, `mods::contract_dispatch::scripted_invoker_surfaces_analyzer_diagnostics_to_outcomes`, `mods::conflicts::{duplicate_registration_in_one_artifact_emits_e1829, missing_entry_symbol_emits_e1828, rewriter_without_analyzer_emits_e1854, unknown_contract_id_emits_e1853}`. |
| `cargo test -p beskid_tests analysis::pipeline::mod_phases` | `/tmp/compiler-mod-execution` | 0 | Pre-existing pipeline-phase ordering tests still pass after invoker plumbing. |
| `bun run verify:platform-spec` | `site/website` | 0 | Frontmatter validation OK. |
| `bun run verify:platform-spec-layout` | `site/website` | 0 | 791 nodes, 0 warnings. |
| `bun run verify:platform-spec-content` | `site/website` | 0 | 803 files scanned, no errors (PSC001 allowlist preserved). |
| `bun run verify:trudoc -- --preset ci` | `site/website` | 1 | **Pre-existing failures unrelated to this task.** Two failures are introduced by other concurrent subagents into uncommitted/untracked spec files outside this task's `pathsAllowed`: (1) `platform-spec/core-library/stability-and-api-shape/corelib-api-shape` reports `MISSING_SECTION` (`what-this-feature-specifies`); (2) `platform-spec/tooling/formatter/index.mdx` has invalid YAML frontmatter on a backticked `relation` value. Restricted scopes (`verify:platform-spec*` above) all pass clean against this task's edits. |

### Reproducer

```bash
# Compiler crates (worktree-isolated to avoid concurrent submodule churn):
cd /tmp/compiler-mod-execution
cargo test -p beskid_analysis mod_host:: -- --test-threads=1
cargo test -p beskid_engine mod_host -- --test-threads=1
cargo test -p beskid_tests mods:: -- --test-threads=1

# Spec verification (subset that passes; full preset blocked by unrelated agents):
cd /Users/mikserek/Projects/beskid/site/website
bun run verify:platform-spec
bun run verify:platform-spec-layout
bun run verify:platform-spec-content
```

## Branch

- Superrepo: `orch/beskid-v0-3/compiler-mod-execution` at `384847c` (HEAD), based on `0a173a6` from `main`.
  - `aae516f docs(platform-spec): mod-host-bridge anchors for compiler-mod execution`
  - `384847c feat(compiler): bump submodule for compiler-mod-execution`
- Compiler submodule: `orch/beskid-v0-3/compiler-mod-execution` at `43c9620a9bca170ba541245a36edc29fe62ed8c7` (worktree at `/tmp/compiler-mod-execution`), based on `bf32227` from `main`.
  - `a91d258 feat(mod_host): wire mod.collect/generate/analyze/rewrite through ContractInvoker`
  - `0e310d4 test(mod_host): reference SampleMod fixture and beskid_tests::mods suite`
  - `43c9620 test(engine): mod_host pipeline integration test against SampleMod fixture`

Both branches are local-only; pushing to remote is left to the orchestrator (the user's preference per AGENTS.md is end-to-end git work; the parent `compiler-mod-execution` task is expected to push as part of its merge flow).
