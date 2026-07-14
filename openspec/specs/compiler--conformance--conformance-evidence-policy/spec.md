<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Conformance evidence policy Specification

## Purpose

Feature hub for the conformance evidence policy in the reference compiler.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-CONF-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-7451E18B4228`  
**Legacy source:** `site/spec-content/platform-spec/compiler/conformance/conformance-evidence-policy/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `334386c5c3d3567b757c254d451cc027e93bc36393b4c53ec807acb9dee81d3b`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-CONF-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-D6B390EBE3E6`  
**Legacy source:** `site/spec-content/platform-spec/compiler/conformance/conformance-evidence-policy/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `530d2114e86cb6fa47cb284f85c8fa58a4b55a41c7af1aa68070df4f11d9d904`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Three-tier conformance evidence: Decision [D-COMP-CONF-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Standard conformance claims require analysis fixtures, doc tests, and e2e runtime evidence—mapped in hub verification articles.

**Stable ID:** `BSP-REQ-7B09BC03C226`  
**Legacy source:** `site/spec-content/platform-spec/compiler/conformance/conformance-evidence-policy/adr/0003-three-tier-conformance-evidence/content.md`  
**Source SHA-256:** `a212efe2af4b535068948052d729142040b1e75691f0f700861dde91c41620f7`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Conformance evidence policy

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/conformance/conformance-evidence-policy/`  
**Source:** `site/spec-content/platform-spec/compiler/conformance/conformance-evidence-policy/content.md`  
**SHA-256:** `28f4f645d45657a7e6719fdd29e503dd0c878b1722f100031317396d57573339`

<details>
<summary>Migrated source text</summary>

``````markdown
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
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/conformance/conformance-evidence-policy/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/conformance/conformance-evidence-policy/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `334386c5c3d3567b757c254d451cc027e93bc36393b4c53ec807acb9dee81d3b`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Sibling articles under this feature previously restated requirements in inconsistent forms.

## Decision

This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

## Consequences

Contract changes start on the hub or in linked ADRs, then propagate to articles and implementation anchors.

## Verification anchors

- `site/website/src/content/docs/platform-spec/compiler/conformance/conformance-evidence-policy/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/conformance/conformance-evidence-policy/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/conformance/conformance-evidence-policy/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `530d2114e86cb6fa47cb284f85c8fa58a4b55a41c7af1aa68070df4f11d9d904`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Implementation crates accumulated informal notes that diverged from published contracts.

## Decision

Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

## Consequences

Engineers file spec/ADR updates when behavior changes; crate comments are non-authoritative for conformance arguments.

## Verification anchors

- `compiler/crates/beskid_tests/src/analysis/diagnostics.rs`
- `compiler/crates/beskid_tests/src/doc_tests.rs`
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs`
``````

</details>

### Source Record: Three-tier conformance evidence

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/conformance/conformance-evidence-policy/adr/0003-three-tier-conformance-evidence/`  
**Source:** `site/spec-content/platform-spec/compiler/conformance/conformance-evidence-policy/adr/0003-three-tier-conformance-evidence/content.md`  
**SHA-256:** `a212efe2af4b535068948052d729142040b1e75691f0f700861dde91c41620f7`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Release arguments lacked traceable proof layers.

## Decision

Standard conformance claims require analysis fixtures, doc tests, and e2e runtime evidence—mapped in hub verification articles.

## Consequences

A single test kind cannot satisfy Standard maturity alone.

## Verification anchors

- `compiler/crates/beskid_tests/`
- `compiler/crates/beskid_e2e_tests/`.
``````

</details>

### Source Record: Conformance evidence policy - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/conformance/conformance-evidence-policy/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/conformance/conformance-evidence-policy/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `5b2d4118c5a2b0628899d81f6a1345af087411e624dfd7b723cb83a944548473`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **contracts and edge cases** for **conformance evidence policy** in the reference compiler.

## What this covers

Normative contracts for conformance evidence. Every conformance test must assert against stable identifiers that do not silently drift across releases.

## Normative contracts

1. **Diagnostic code stability** — Diagnostic codes cited in conformance fixtures **must** be stable across compiler versions. Codes live in the [diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/); changing a code is a breaking change.
2. **Manifest validation determinism** — Valid and invalid `Project.proj`/`Workspace.proj` pairs must produce the same diagnostic codes on every run with identical inputs, regardless of host platform or concurrency.
3. **Mod dispatch ordering** — The `PipelineObserver` phase sequence (`mod.load` → `mod.collect` → `mod.generate` → `mod.analyze` → `mod.rewrite`) is normative; reordering phases is a spec violation.
4. **Incremental replay idempotence** — Replaying the same edit keys must produce identical generator outputs. See `compiler/crates/beskid_tests/src/mods/incremental_replay.rs`.

## Edge cases to monitor
- **Partial refactors** that update only one side of a Mod contract dispatch.
- **Manifest goldens** that pass locally but differ on CI due to lockfile resolution divergence.
- **LSP diagnostics** that diverge from CLI diagnostics for the same input (tracked in `spine/diagnostics_parity.rs`).

## Anchored code paths
- `compiler/crates/beskid_tests/src/mods/conflicts.rs` — Conflict detection before `mod.collect`.
- `compiler/crates/beskid_tests/src/mods/fixture.rs` — Manifest golden loading and validation.
- `compiler/crates/beskid_tests/src/spine/diagnostics_parity.rs` — LSP/CLI parity.
- `compiler/crates/beskid_tests/src/projects/mod_manifest.rs` — Manifest schema enforcement.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Conformance evidence policy - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/conformance/conformance-evidence-policy/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/conformance/conformance-evidence-policy/articles/design-model/content.md`  
**SHA-256:** `05d2dcdd04441c8a8a56f7eeec0c9131a17a44602f9a92c09cb963e707572270`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **design model** for **conformance evidence policy** in the reference compiler.

## What this covers
The conformance evidence policy enforces a three-tier model for proving compiler behavior remains stable:

| Tier | Scope | Lives in |
|------|-------|----------|
| **T1 — Semantic diagnostics** | Diagnostic codes, resolver graphs, staged rules | `beskid_tests/src/analysis` |
| **T2 — Mod pipeline** | Mod load/collect/generate/analyze/rewrite ordering and replay | `beskid_tests/src/mods` |
| **T3 — E2E behavior** | Source-to-runtime outcomes through CLI backends | `beskid_e2e_tests` |

Each tier locks a different interface boundary: T1 locks the analysis surface, T2 locks the Mod contract dispatch, and T3 locks user-visible runtime behavior.

## Subsystem boundaries
- **Analysis layer** (`beskid_analysis`): Emits diagnostics and staged rules consumed by downstream crates.
- **Mod host** (`beskid_analysis::mod_host`): Owns the `PipelineObserver` trait and the canonical `mod.load → collect → generate → analyze → rewrite` chain.
- **Test crates** (`beskid_tests`, `beskid_e2e_tests`): Assert that boundaries hold; must not redefine semantics of the crates they test.

## Anchored code paths
- `compiler/crates/beskid_tests/src/analysis/diagnostics.rs` — T1 semantic conformance evidence.
- `compiler/crates/beskid_tests/src/mods/contract_dispatch.rs` — T2 Mod pipeline ordering.
- `compiler/crates/beskid_tests/src/mods/incremental_replay.rs` — T2 incremental replay.
- `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` — T3 executable behavior evidence.
- `compiler/crates/beskid_tests/src/spine/diagnostics_parity.rs` — LSP parity across tiers.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Conformance evidence policy - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/conformance/conformance-evidence-policy/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/conformance/conformance-evidence-policy/articles/examples/content.md`  
**SHA-256:** `347abd56f0142f13b88c43fa2820c5e81864f9623a2741d3463766713397d18d`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **examples** for **conformance evidence policy** in the reference compiler.

## What this covers
Concrete scenarios mapped to specific test fixtures and code paths in the compiler test crates.

## Example 1: Adding a new diagnostic and locking it

1. Define the diagnostic code in the [diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).
2. Emit it from the relevant `beskid_analysis` pass.
3. Add a `.bd` fixture under `beskid_tests/src/analysis/` that triggers the diagnostic.
4. Run the diagnostics test suite to record the new golden.
5. If the diagnostic applies to Mod projects, also add a fixture triggering it through the Mod pipeline in `beskid_tests/src/mods/`.

## Example 2: Verifying Mod pipeline ordering

The reference fixture at `compiler/crates/beskid_tests/fixtures/mods/sample_mod/Project.proj` exercises the full Mod pipeline. The test in `compiler/crates/beskid_tests/src/mods/contract_dispatch.rs`:

- Loads the project via `mod.load`.
- Records every `PipelineObserver` phase callback.
- Asserts the canonical ordering: `load → collect → generate → analyze → rewrite`.
- Checks that lowering only fires after rewrite.

## Example 3: Regression-proofing incremental replay

`compiler/crates/beskid_tests/src/mods/incremental_replay.rs` performs repeated edits with identical keys and asserts stable generator outputs. To add a new replay case:

1. Choose an existing Mod fixture or create a minimal one.
2. Define a sequence of edit operations in the test.
3. Assert that after each edit-and-replay cycle, the generator output is byte-identical to the previous run.
4. If the output changes, the test fails — the change is intentional or the fix is needed.

## Anchored code paths
- `compiler/crates/beskid_tests/fixtures/mods/sample_mod/` — Reference Mod project fixture.
- `compiler/crates/beskid_tests/src/mods/contract_dispatch.rs` — Mod pipeline end-to-end dispatch.
- `compiler/crates/beskid_tests/src/mods/incremental_replay.rs` — Incremental replay assertions.
- `compiler/crates/beskid_tests/src/analysis/diagnostics.rs` — Semantic diagnostic golden tests.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Conformance evidence policy - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/conformance/conformance-evidence-policy/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/conformance/conformance-evidence-policy/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `2928875768c421b5233ad7f487192ad524b1d534d46125d720b49bf80bc1718f`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **faq and troubleshooting** for **conformance evidence policy** in the reference compiler.

## What this covers
Common questions and debugging guidance when conformance tests fail.

## FAQ

### Why did a diagnostic golden test fail after I changed an analysis pass?
Your change altered the diagnostic output. Check `compiler/crates/beskid_tests/src/analysis/diagnostics.rs`. If the new output is intentional, update the golden file (run with `BLESS=1` if supported). If the change regressed behavior, revert and add a dedicated fixture for the intended fix first.

### The PipelineObserver test reports a phase ordering violation. What does that mean?
The Mod pipeline phases fired in an order that violates the canonical sequence: `load → collect → generate → analyze → rewrite`. Check `compiler/crates/beskid_tests/src/mods/contract_dispatch.rs` for the expected order. Common causes: inserting a new phase step, reordering calls in `beskid_analysis::mod_host`, or silent phase skipping.

### How do I add a new conformance test for a Mod feature?
1. If you need to exercise the full Mod pipeline, extend or clone the reference fixture at `compiler/crates/beskid_tests/fixtures/mods/sample_mod/`.
2. Add a new test module under `compiler/crates/beskid_tests/src/mods/`.
3. Register the module in `mods/mod.rs`.
4. Assert diagnostic codes from the [diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

### Why are LSP diagnostics different from CLI diagnostics for the same input?
Check `compiler/crates/beskid_tests/src/spine/diagnostics_parity.rs`. The spine parity tests assert that Mod diagnostics round-trip through `beskid_lsp` with the same codes as CLI analysis. If they diverge, a code path in the LSP middleware or the spine is producing a different diagnostic than the CLI pipeline.

### My incremental replay test passes locally but fails on CI. Why?
Incremental replay in `compiler/crates/beskid_tests/src/mods/incremental_replay.rs` asserts byte-identical generator output. Differences between local and CI usually come from:
- Lockfile resolution producing different dependency hashes.
- Environment-specific paths leaking into generator output.
- Non-deterministic ordering in hash maps or parallel passes.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Conformance evidence policy - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/conformance/conformance-evidence-policy/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/conformance/conformance-evidence-policy/articles/flow-and-algorithm/content.md`  
**SHA-256:** `aad89784034255d8ec6830770e21959dc22c122bbae38ee3a6730c70483ad1bb`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **flow and algorithm** for **conformance evidence policy** in the reference compiler.

## What this covers
The conformance evidence pipeline follows a fixed phase order. Every Mod project passes through the same sequence, and tests must record phases to assert they fire in the documented order.

## Pipeline phase ordering

```
parse → mod.load → mod.collect → mod.generate → [semantic gate] → mod.analyze → mod.rewrite → lowering
```

The `PipelineObserver` trait (in `beskid_analysis::mod_host`) records each phase transition. Tests assert that:
- Phases never appear out of order.
- No phase is skipped unless the semantic gate rejects the program.
- Lowering always follows rewrite, never precedes it.

## Key test entrypoints
- `compiler/crates/beskid_tests/src/mods/contract_dispatch.rs` — End-to-end dispatch through the full Mod pipeline, asserting canonical phase ordering per `PipelineObserver`.
- `compiler/crates/beskid_engine/tests/jit_pipeline_observer.rs` — JIT-specific observer that validates phase order during engine execution.
- `compiler/crates/beskid_tests/src/analysis/pipeline/mod_phases.rs` — Unit-level phase ordering for the analysis layer.

## Practical notes
- Prefer tracing from CLI/test entry points into analysis/codegen crates before changing internals.
- Treat diagnostics and tests as part of the contract, not optional implementation details.
- If behavior changes, update this article and add/adjust tests in `compiler/crates/beskid_tests` or `compiler/crates/beskid_e2e_tests`.
``````

</details>

### Source Record: Conformance evidence policy - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/conformance/conformance-evidence-policy/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/conformance/conformance-evidence-policy/articles/verification-and-traceability/content.md`  
**SHA-256:** `53f688e7b1dad041fea86f4c8b0b165f23d3e2370e05222daec23f88db3d8628`

<details>
<summary>Migrated source text</summary>

``````markdown
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
``````

</details>
