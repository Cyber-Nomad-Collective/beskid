<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Diagnostics parity (CLI and LSP) Specification

## Purpose

Contracts for diagnostic provenance and parity across CLI parse, lowering, and LSP analysis paths.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-BUILD-0010]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-D6A7CEF594D0`  
**Legacy source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `c937efcb86cf47de4cab7fdc8f25287fb3f5901ffe78fb97a04cb29cf3a48d23`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-BUILD-0011]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-C0B593AF8256`  
**Legacy source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `16c31817be633832c959cd7dfb479e5e2d121438ce922b09090e085ef208c98d`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Primary contract for Diagnostics parity (CLI and LSP): Decision [D-COMP-BUILD-0012]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement Diagnostics parity (CLI and LSP) as documented in this feature hub and its article bundle.

**Stable ID:** `BSP-REQ-9E1E4DB292DB`  
**Legacy source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `d88af92de5cfa00d42f1d5c2c45f11ef8f8bdad9a76fb325a57026c9f190b4c9`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Project files require compilation context: Decision [D-COMP-BUILD-0024]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Project files | Any `.bd` under a discovered `Project.proj` / workspace graph **must** analyze through `CompilationContext` and `prepare_compilation(DiagnosticsOnly)`—the same spine as CLI |
> | No analyze divergence | CLI `analyze` and LSP diagnostics for equivalent buffer text **must not** diverge on semantic presence/absence (extends D-COMP-BUILD-0012) |
> | Fallback scope | Parse-only / single-file semantic fallback is **limited to non-project buffers** (scratch `"<memory>"`, files with no manifest attachment) |
> | LSP tiers | Tier-3/4 degraded paths **must not** run for project-attached URIs when a plan can be resolved |

**Stable ID:** `BSP-REQ-C0AAF65CEFD1`  
**Legacy source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/adr/0004-project-files-require-compilation-context/content.md`  
**Source SHA-256:** `2dd8a06052d690bc324ac6bf8d0c01e5f4f6846b5044e3e6787b70007691d239`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Diagnostics parity (CLI and LSP)

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/diagnostics-parity/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/content.md`  
**SHA-256:** `9501d72a99abead708d3485a788486dac9f8d66cebce580b5f7baa2cb3051aa8`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub documents where diagnostics come from in CLI and LSP, and what differences are expected versus considered regressions.

## Implementation anchors
- `compiler/crates/beskid_pipeline/src/` — diagnostic gating and parity enforcement across paths
- `compiler/crates/beskid_lsp/src/diagnostics.rs` — LSP diagnostic production and snapshot invalidation
- `compiler/crates/beskid_cli/src/commands/` — CLI diagnostic emission from shared compilation spine

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-BUILD-0010` … `D-COMP-BUILD-0024`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Diagnostics parity (CLI and LSP) - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Diagnostics parity (CLI and LSP) - Design model](./articles/design-model/)
- [Diagnostics parity (CLI and LSP) - Examples](./articles/examples/)
- [Diagnostics parity (CLI and LSP) - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Diagnostics parity (CLI and LSP) - Flow and algorithm](./articles/flow-and-algorithm/)
- [Diagnostics parity (CLI and LSP) - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/diagnostics-parity/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `c937efcb86cf47de4cab7fdc8f25287fb3f5901ffe78fb97a04cb29cf3a48d23`

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

- `site/website/src/content/docs/platform-spec/compiler/build-pipeline/diagnostics-parity/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/diagnostics-parity/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `16c31817be633832c959cd7dfb479e5e2d121438ce922b09090e085ef208c98d`

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

- `compiler/crates/beskid_analysis/`
``````

</details>

### Source Record: Primary contract for Diagnostics parity (CLI and LSP)

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/diagnostics-parity/adr/0003-primary-contract-choice/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/adr/0003-primary-contract-choice/content.md`  
**SHA-256:** `d88af92de5cfa00d42f1d5c2c45f11ef8f8bdad9a76fb325a57026c9f190b4c9`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

This feature hub documents where diagnostics come from in CLI and LSP, and what differences are expected versus considered regressions.

## Decision

The reference compiler **must** implement Diagnostics parity (CLI and LSP) as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/`
``````

</details>

### Source Record: Project files require compilation context

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/diagnostics-parity/adr/0004-project-files-require-compilation-context/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/adr/0004-project-files-require-compilation-context/content.md`  
**SHA-256:** `2dd8a06052d690bc324ac6bf8d0c01e5f4f6846b5044e3e6787b70007691d239`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

[D-COMP-BUILD-0012](./0003-primary-contract-choice/) requires semantic diagnostic parity between CLI and LSP. LSP still degraded project `.bd` files to parse-only semantic tiers when `CompilationContext` was missing, hiding cross-module and post-rewrite errors that `beskid build` reported.

## Decision

| Rule | Detail |
| --- | --- |
| Project files | Any `.bd` under a discovered `Project.proj` / workspace graph **must** analyze through `CompilationContext` and `prepare_compilation(DiagnosticsOnly)`—the same spine as CLI |
| No analyze divergence | CLI `analyze` and LSP diagnostics for equivalent buffer text **must not** diverge on semantic presence/absence (extends D-COMP-BUILD-0012) |
| Fallback scope | Parse-only / single-file semantic fallback is **limited to non-project buffers** (scratch `"<memory>"`, files with no manifest attachment) |
| LSP tiers | Tier-3/4 degraded paths **must not** run for project-attached URIs when a plan can be resolved |

## Consequences

`beskid_lsp` diagnostics and references handlers require cached `CompilationContext`. Snapshot reuse **must** invalidate when manifest or workspace graph changes.

## Verification anchors

- `compiler/crates/beskid_lsp/src/diagnostics.rs`
- `compiler/crates/beskid_analysis/src/compilation_context.rs`
- `compiler/crates/beskid_lsp/src/session/project_context.rs`
- `compiler/crates/beskid_tests/src/spine/` (diagnostics parity fixtures)
``````

</details>

### Source Record: Diagnostics parity (CLI and LSP) - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/diagnostics-parity/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `b3e0426b95908d453ad1b8b682623098645f53f9fc76332d8127cd5bcf58e824`

<details>
<summary>Migrated source text</summary>

``````markdown
- Semantic error presence/absence **must** match across CLI analyze, `beskid build`, and LSP for equivalent project source (D-COMP-BUILD-0012, D-COMP-BUILD-0024).
- **Analyze/run divergence is forbidden**: CLI semantic gates and execute paths **must** use the same `prepare_compilation` spine (post-rewrite AST); differing diagnostic sets on the same buffer are regressions.
- Source label differences are **allowed** when paths intentionally differ (`path`, `source.bd`, `"<memory>"`)—labels alone are not parity failures.
- Manifest (`.proj`) diagnostics must use project-error mapping paths, not code-file parsers.
- Project `.bd` files **must not** fall back to parse-only semantic tiers in LSP; non-project buffers may use limited single-file fallback.
- Snapshot reuse in LSP must not hide newly introduced semantic errors; invalidate when manifest, workspace graph, or buffer version changes.
``````

</details>

### Source Record: Diagnostics parity (CLI and LSP) - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/diagnostics-parity/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/articles/design-model/content.md`  
**SHA-256:** `0898dbc92177cf303cb52be93017f3a2302fa130333c496cd090bb4a81c9b5ce`

<details>
<summary>Migrated source text</summary>

``````markdown
Parity is defined at semantic meaning, not identical text formatting. CLI and LSP **must** use the same `ProgramAssembly` discovery mode policy (closure for build/run; workspace scan for IDE project diagnostics when a compile plan exists).

- CLI parse diagnostics are path-anchored for user files.
- Lowering parse diagnostics may use synthetic source names.
- LSP has cold-parse and warm-snapshot paths but must align on rule outcomes.
``````

</details>

### Source Record: Diagnostics parity (CLI and LSP) - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/diagnostics-parity/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/articles/examples/content.md`  
**SHA-256:** `3910830d29decfb8129da04801fc089d60237da9570589713c45130473e7090b`

<details>
<summary>Migrated source text</summary>

``````markdown
- **Syntax error in file:** CLI points to file path; LSP cold path may show `source.bd`, but location/rule category should match.
- **Semantic rule violation:** both CLI-lowering and LSP report equivalent rule failures.
- **Manifest error:** CLI and LSP project parsing surfaces report project diagnostics, not code syntax diagnostics.
``````

</details>

### Source Record: Diagnostics parity (CLI and LSP) - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/diagnostics-parity/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `df39520f059aa89284041e303613f17dab0d76cb24453b82d99ad463959b5289`

<details>
<summary>Migrated source text</summary>

``````markdown
## Why do line labels differ between CLI and editor?
Different surfaces intentionally use different source labels; compare rule code, severity, and span semantics.

## Why does editor show fewer errors after edits?
Snapshot reuse may be active; trigger a fresh analysis cycle to confirm parity.

## Are parse and semantic diagnostics expected to be identical text?
No. Contract requires semantic parity and stable classification, not byte-identical messages.
``````

</details>

### Source Record: Diagnostics parity (CLI and LSP) - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/diagnostics-parity/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/articles/flow-and-algorithm/content.md`  
**SHA-256:** `15ba1a0c4b57a00babf250f0c4489cbb6cd37278bd1eb78a2d85e3e588a17d9f`

<details>
<summary>Migrated source text</summary>

``````markdown
1. CLI parse path converts parser errors using file-path source labels.
2. Lowering path parses and can emit diagnostics with `"<memory>"` labels.
3. Lowering runs semantic rules when diagnostics are enabled and aborts on errors.
4. LSP cold path parses, maps parse errors, then runs semantic rules.
5. LSP warm path reuses analyzed snapshots and reruns rule checks without reparsing.
``````

</details>

### Source Record: Diagnostics parity (CLI and LSP) - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/build-pipeline/diagnostics-parity/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/build-pipeline/diagnostics-parity/articles/verification-and-traceability/content.md`  
**SHA-256:** `091cfdcf0b67d8b4bf5326ef6f183e3bf2af0e761e22e99c2f820d405a3f56f0`

<details>
<summary>Migrated source text</summary>

``````markdown
Implementation anchors:

- `compiler/crates/beskid_cli/src/frontend.rs`
- `compiler/crates/beskid_codegen/src/services.rs`
- `compiler/crates/beskid_lsp/src/diagnostics.rs`
- `compiler/crates/beskid_analysis/src/services/`

Verification strategy should compare fixture diagnostics across CLI and LSP cold/warm paths.
``````

</details>
