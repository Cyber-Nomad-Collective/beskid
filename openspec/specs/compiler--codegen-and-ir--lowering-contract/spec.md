<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Lowering contract Specification

## Purpose

Contract for lowering parsed and analyzed source into backend-ready `CodegenArtifact`.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-IR-0007]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-4B2ACFCBDE6D`  
**Legacy source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `91d6cf7215da0f43a3f42fb78906176f71613967ddac13b09aa4d2d1edd5b691`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-IR-0008]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-376C8C28EE35`  
**Legacy source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `413c58a0b2f9caf7d5936fc0bc6458d99ebd8e536fe645797bbad2d07a8241bf`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Cranelift lowering via lower_source: Decision [D-COMP-IR-0009]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `beskid_codegen::lower_source` is the single lowering entry producing `CodegenArtifact` consumed by `JitModule`.

**Stable ID:** `BSP-REQ-97DCBB75281D`  
**Legacy source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0003-cranelift-lowering-single-entry/content.md`  
**Source SHA-256:** `bcb0f8c4f4f2a37682490d5299812f6df9084ab9c491390c79278c11a3ba9bdd`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Reachability link plan: Decision [D-COMP-IR-0010]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Production lowering **must**:
> 
> 1. Build `FunctionDefIndex` from `Resolution` and `assembly.hir_units` (all units in the assembly cache).
> 2. Construct `LinkPlan` for declared entry symbols (tests, `main`, qualified run/build entrypoints) including transitive callees and monomorphized instances.
> 3. Lower only symbols listed in the plan (no on-demand span-global fallback in release paths).
> 4. Run `beskid_codegen::validate_artifact` before `beskid_engine` / `beskid_aot` consume the artifact.

**Stable ID:** `BSP-REQ-B6767E7BCD69`  
**Legacy source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0004-reachability-link-plan/content.md`  
**Source SHA-256:** `fb88cef261ae0149ea45fa0f323e7667a8a839818b121220b39c1147fd0bcce2`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Supersede lower_source production entry: Decision [D-COMP-IR-0011]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Production entry | `lower_resolved_input_with_pipeline` (after `prepare_compilation` / `compile_front_end_from_resolved_input`) is the **only** production path to `CodegenArtifact` |
> | Legacy ban | `lower_source_single_unit_legacy` and pre-assembly mod/semantic scheduling **must not** run in CLI, LSP, or engine production paths |
> | Test-only `lower_source` | `lower_source` / in-memory helpers **may** remain for unit tests by constructing a minimal single-unit `ProgramAssembly` and delegating to `lower_resolved_input` |
> | Link plan | Production paths **must** satisfy [D-COMP-IR-0010](./0004-reachability-link-plan/) |

**Stable ID:** `BSP-REQ-C3FAA264B707`  
**Legacy source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0005-supersede-lower-source-entry/content.md`  
**Source SHA-256:** `40e340860e138423670c51116794b83f21f19303541aa3a356106f6a55d20442`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Lowering contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/lowering-contract/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/content.md`  
**SHA-256:** `37bacb7a36547fce77e0e9574fe8553a71ac8b350c2aac85efd3b3e0dc1517bb`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
This feature explains how source text becomes a backend-ready artifact without changing language semantics late in the pipeline. It is organized into newcomer-friendly articles that move from model, to flow, to contracts, then practical verification and debugging guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `beskid_codegen::lower_source` in `compiler/crates/beskid_codegen`
- `CodegenArtifact` construction in `compiler/crates/beskid_codegen`
- `JitModule` consumption in `compiler/crates/beskid_engine/src/jit_module.rs`
- Runtime execution coverage in `compiler/crates/beskid_tests/src/runtime/jit.rs`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-IR-0007` … `D-COMP-IR-0011`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `91d6cf7215da0f43a3f42fb78906176f71613967ddac13b09aa4d2d1edd5b691`

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

- `site/website/src/content/docs/platform-spec/compiler/codegen-and-ir/lowering-contract/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `413c58a0b2f9caf7d5936fc0bc6458d99ebd8e536fe645797bbad2d07a8241bf`

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

- `compiler/crates/beskid_codegen`
- `compiler/crates/beskid_codegen`
- `compiler/crates/beskid_engine/src/jit_module.rs`
``````

</details>

### Source Record: Cranelift lowering via lower_source

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0003-cranelift-lowering-single-entry/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0003-cranelift-lowering-single-entry/content.md`  
**SHA-256:** `bcb0f8c4f4f2a37682490d5299812f6df9084ab9c491390c79278c11a3ba9bdd`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Lowering was split across experimental paths.

## Decision

`beskid_codegen::lower_source` is the single lowering entry producing `CodegenArtifact` consumed by `JitModule`.

## Consequences

Experimental IR dumps must not bypass this entry in release builds.

## Verification anchors

- `compiler/crates/beskid_codegen`
- `compiler/crates/beskid_engine/src/jit_module.rs`.
``````

</details>

### Source Record: Reachability link plan

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0004-reachability-link-plan/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0004-reachability-link-plan/content.md`  
**SHA-256:** `fb88cef261ae0149ea45fa0f323e7667a8a839818b121220b39c1147fd0bcce2`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Codegen lowered entry functions on demand from span tables, emitting callees that JIT link could not resolve. A reachability `LinkPlan` exists for tests but was not required for run/build entrypoints.

## Decision

Production lowering **must**:

1. Build `FunctionDefIndex` from `Resolution` and `assembly.hir_units` (all units in the assembly cache).
2. Construct `LinkPlan` for declared entry symbols (tests, `main`, qualified run/build entrypoints) including transitive callees and monomorphized instances.
3. Lower only symbols listed in the plan (no on-demand span-global fallback in release paths).
4. Run `beskid_codegen::validate_artifact` before `beskid_engine` / `beskid_aot` consume the artifact.

## Consequences

`lower_program_with_assembly` and linking modules own completeness. Undefined callees fail at validate time with deterministic diagnostics.

## Verification anchors

- `compiler/crates/beskid_codegen/src/linking/plan.rs`
- `compiler/crates/beskid_codegen/src/linking/def_index.rs`
- `compiler/crates/beskid_codegen/src/linking/validate.rs`
- `compiler/crates/beskid_codegen/src/lowering/lowerable.rs`
- `compiler/crates/beskid_codegen/tests/array_tests_linking.rs`
- `compiler/crates/beskid_engine/src/engine.rs`
``````

</details>

### Source Record: Supersede lower_source production entry

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0005-supersede-lower-source-entry/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/adr/0005-supersede-lower-source-entry/content.md`  
**SHA-256:** `40e340860e138423670c51116794b83f21f19303541aa3a356106f6a55d20442`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

[D-COMP-IR-0009](./0003-cranelift-lowering-single-entry/) named `beskid_codegen::lower_source` the single lowering entry. Project-backed commands still fell through to `lower_source_single_unit_legacy`, bypassing assembly, dependency HIR, and `LinkPlan`.

## Decision

| Rule | Detail |
| --- | --- |
| Production entry | `lower_resolved_input_with_pipeline` (after `prepare_compilation` / `compile_front_end_from_resolved_input`) is the **only** production path to `CodegenArtifact` |
| Legacy ban | `lower_source_single_unit_legacy` and pre-assembly mod/semantic scheduling **must not** run in CLI, LSP, or engine production paths |
| Test-only `lower_source` | `lower_source` / in-memory helpers **may** remain for unit tests by constructing a minimal single-unit `ProgramAssembly` and delegating to `lower_resolved_input` |
| Link plan | Production paths **must** satisfy [D-COMP-IR-0010](./0004-reachability-link-plan/) |

## Consequences

[D-COMP-IR-0009](./0003-cranelift-lowering-single-entry/) is superseded for production semantics; JIT/AOT still consume `CodegenArtifact` from the resolved-input entry only.

## Verification anchors

- `compiler/crates/beskid_codegen/src/services.rs`
- `compiler/crates/beskid_cli/src/commands/`
- `compiler/crates/beskid_engine/tests/`
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/lowering-contract/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `4c2461347b3781457f98ae0645f3d0a6f5fbfb5099041d77e885dccd8e5d8ea0`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative contracts

- Producer crates must emit data in a shape accepted by downstream consumers.
- Consumer crates must not silently reinterpret the contract surface.
- Contract regressions must be captured as compile-time or test-time failures, not hidden runtime drift.

## Edge cases to monitor

- Partial refactors that update only one side of a crate boundary.
- Symbol/name changes that compile locally but break cross-crate integration.
- Fixtures that pass in isolation but fail in end-to-end harnesses.

## Failure handling expectations

When contract checks fail, diagnostics should point contributors to the responsible boundary crate and to the corresponding conformance fixture.
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/lowering-contract/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/articles/design-model/content.md`  
**SHA-256:** `6466c2dbcd6db053e15c8ea920f646b04224610c43adfdd4f9ed4364a6da44e6`

<details>
<summary>Migrated source text</summary>

``````markdown
## Lowering boundary

Lowering is the **last semantic gate** before any backend runs. Inputs are a post-merge program snapshot (HIR + `ModuleIndex` + resolved types); output is an immutable **`CodegenArtifact`** containing Cranelift modules, data descriptors, extern imports, and debug metadata.

Backends **must not** re-run parse, mod host, or semantic rules on the artifact.

```mermaid
flowchart TB
  subgraph analysis [beskid_analysis]
    hir[HIR + ModuleIndex]
  end
  subgraph codegen [beskid_codegen]
    lower[lower_program / lower_source]
    art[CodegenArtifact]
  end
  subgraph backends [beskid_engine]
    jit[JitModule]
    aot[AOT object emit]
  end
  hir --> lower --> art
  art --> jit
  art --> aot
```

## Artifact contents

| Slice | Role |
| --- | --- |
| CLIF modules | Per-compilation-unit functions and globals |
| Builtin imports | `declare_builtin_imports` from `BUILTIN_SPECS` |
| `ExternImport` rows | User contract symbols for link step |
| Type descriptors | GC layout + array/string shapes for `alloc` |

## Invariants

- Lowering runs only when `syntax_generation_id` matches the merged tree used by semantic rules ([stage ordering](/platform-spec/compiler/build-pipeline/stage-ordering/)).
- Panic/abort paths use `AbiReturnKind::Never` imports so unreachable blocks are correct.
- JIT and AOT consume the **same** artifact type; divergence happens only after `CodegenArtifact` is sealed.

## Code anchors

- `beskid_codegen::lower_source` in `compiler/crates/beskid_codegen`
- `CodegenArtifact` construction in `compiler/crates/beskid_codegen`
- `JitModule` in `compiler/crates/beskid_engine/src/jit_module.rs`
- Runtime smoke: `compiler/crates/beskid_tests/src/runtime/jit.rs`
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/lowering-contract/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/articles/examples/content.md`  
**SHA-256:** `d247967b9c691182df4bd04d113bb690419ecb1c2c3cfff8996d2a438b392f5b`

<details>
<summary>Migrated source text</summary>

``````markdown
## Example 1: Happy path

A standard project exercises the expected producer -> consumer handoff with no contract violations. Trace this via:

- ``beskid_codegen::lower_source` in `compiler/crates/beskid_codegen``
- ``JitModule` consumption in `compiler/crates/beskid_engine/src/jit_module.rs``

## Example 2: Contract mismatch

Intentionally alter a boundary definition (for example, a symbol or structure shape), then run the related conformance suite. The expected result is a deterministic failure that identifies the mismatched boundary.

## Example 3: Regression-proofing a fix

After applying a fix, add or update a focused fixture in the nearest test crate and rerun wider suites so the behavior remains locked for future refactors.
``````

</details>

### Source Record: FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/lowering-contract/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `9a78ff35504bc3f31d6108e702aae870b46b5032c839694ac6da37faa2502cf7`

<details>
<summary>Migrated source text</summary>

``````markdown
## Why did a change pass locally but fail in CI?

Most often, one crate boundary changed but the corresponding fixture or downstream consumer was not updated. Re-run the nearest conformance suite and inspect cross-crate handoff points.

## Where should I start debugging?

1. Confirm the target requirement in this feature hub.
2. Step through ``beskid_codegen::lower_source` in `compiler/crates/beskid_codegen`` and ``CodegenArtifact` construction in `compiler/crates/beskid_codegen``.
3. Validate consumer behavior at ``JitModule` consumption in `compiler/crates/beskid_engine/src/jit_module.rs``.
4. Reproduce with `Runtime execution coverage in `compiler/crates/beskid_tests/src/runtime/jit.rs``.

## How do I add a new rule safely?

Document the new contract in the relevant article, update implementation in the owning crate, and add a fixture proving both happy-path and failure-path behavior.
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/lowering-contract/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/articles/flow-and-algorithm/content.md`  
**SHA-256:** `7f8299180884ad9dbe4fca94d12101234581d3179c3a1caca28236c511303148`

<details>
<summary>Migrated source text</summary>

``````markdown
## End-to-end flow

1. Input enters compiler/runtime boundary at a stable entrypoint.
2. The responsible crate enforces the expected shape and emits stable structures.
3. Downstream crates consume those structures without redefining semantics.
4. Conformance tests assert behavior at integration boundaries.

## Algorithm notes for newcomers

- Prefer tracing one fixture end-to-end before reading all modules.
- Verify where shape conversion happens; avoid assuming all crates mutate data.
- Keep an eye on handoff points where diagnostics or ABI constraints are locked.

## Where to step through code

- Start with ``beskid_codegen::lower_source` in `compiler/crates/beskid_codegen``.
- Then inspect ``CodegenArtifact` construction in `compiler/crates/beskid_codegen``.
- Follow consumption path at ``JitModule` consumption in `compiler/crates/beskid_engine/src/jit_module.rs``.
- Validate expectations using `Runtime execution coverage in `compiler/crates/beskid_tests/src/runtime/jit.rs``.
``````

</details>

### Source Record: Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/lowering-contract/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/lowering-contract/articles/verification-and-traceability/content.md`  
**SHA-256:** `f9055fc5fe1239f3880fa914038b87ccae82de6ca4c8dc9a0cc733e56eefcd07`

<details>
<summary>Migrated source text</summary>

``````markdown
## Verification strategy

- Unit-level checks validate local transformations.
- Integration tests validate crate-to-crate contracts.
- End-to-end fixtures validate user-visible behavior.

## Traceability map

- Spec requirement source: `/platform-spec/compiler/codegen-and-ir/lowering-contract/`.
- Core implementation anchors:
  - `beskid_codegen::lower_source` in `compiler/crates/beskid_codegen`
  - `CodegenArtifact` construction in `compiler/crates/beskid_codegen`
  - `JitModule` consumption in `compiler/crates/beskid_engine/src/jit_module.rs`
- Conformance anchor:
  - Runtime execution coverage in `compiler/crates/beskid_tests/src/runtime/jit.rs`

## Review checklist

- Requirement text and test expectation describe the same boundary.
- Crate ownership updates are reflected in spec links.
- Newly introduced edge cases include at least one reproducible fixture.
``````

</details>
