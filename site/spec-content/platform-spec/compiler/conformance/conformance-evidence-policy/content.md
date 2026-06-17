---
title: Conformance evidence policy
description: Feature hub for the conformance evidence policy in the reference compiler.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-04-30
---

This feature hub defines the normative contract for **conformance evidence policy** and links newcomer-oriented reference articles.

## Implementation anchors
- `compiler/crates/beskid_tests/src/analysis/diagnostics.rs` provides semantic conformance evidence.
- `compiler/crates/beskid_tests/src/doc_tests.rs` validates docs-facing conformance examples.
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` provides executable behavior evidence.
- `compiler/crates/beskid_tests/src/mods/` drives the Mod pipeline chain (`mod.load` → `mod.collect` → `mod.generate` → `mod.analyze` → `mod.rewrite`) against reference fixtures.
- `compiler/crates/beskid_tests/src/spine/diagnostics_parity.rs` validates LSP parity for Mod diagnostics.
- `compiler/crates/beskid_engine/tests/jit_pipeline_observer.rs` verifies `PipelineObserver` phase ordering.

## Compiler mods evidence (required when feature ships)

Conformance for **`Mod` projects** must include, at minimum:

1. **Manifest goldens** — Valid and invalid `Project.proj` / `Workspace.proj` pairs with stable diagnostic codes for `type = Mod`, `mod` settings, and capability violations. See `compiler/crates/beskid_tests/src/mods/fixture.rs` and `compiler/crates/beskid_tests/src/projects/mod_manifest.rs`.
2. **Pipeline ordering** — A test `PipelineObserver` recording parse, `mod.load`, `mod.collect`, `mod.generate`, semantic gate, `mod.analyze`, `mod.rewrite`, and lowering in documented order. See `compiler/crates/beskid_tests/src/mods/contract_dispatch.rs` and `compiler/crates/beskid_engine/tests/jit_pipeline_observer.rs`.
3. **Incremental replay** — Fixtures performing edits with identical keys that assert stable generator outputs. See `compiler/crates/beskid_tests/src/mods/incremental_replay.rs`.
4. **Analyzer coverage** — Fixtures showing analyzers run over host and generated code. See `compiler/crates/beskid_tests/src/mods/analyzer_coverage.rs`.
5. **LSP parity** — Snapshot tests ensuring mod diagnostics round-trip through `beskid_lsp` with the same codes as CLI analysis. See `compiler/crates/beskid_tests/src/spine/diagnostics_parity.rs`.

Fixture layout for manifest/mod work must follow names documented in **[Project manifest contract / verification](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/verification-and-traceability/)**.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-CONF-0001` … `D-COMP-CONF-0003`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Conformance evidence policy - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Conformance evidence policy - Design model](./articles/design-model/)
- [Conformance evidence policy - Examples](./articles/examples/)
- [Conformance evidence policy - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Conformance evidence policy - Flow and algorithm](./articles/flow-and-algorithm/)
- [Conformance evidence policy - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
