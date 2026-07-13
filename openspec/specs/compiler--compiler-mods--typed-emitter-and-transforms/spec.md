<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Typed emitter and transforms Specification

## Purpose

Construction of syntax nodes and declarative transforms without raw text printing.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-MODS-0016]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-26B8306E9365`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `b931e7ddbefe6de95175e963566b866cebee5323eabb605af7f8216800fca91b`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-MODS-0017]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-10C809F7BE91`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `09b5f651cf61664e1d073aaa88f72e09b9ebacdf33fc0e5970323f684c75cfbc`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Primary contract for Typed emitter and transforms: Decision [D-COMP-MODS-0018]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement Typed emitter and transforms as documented in this feature hub and its article bundle.

**Stable ID:** `BSP-REQ-D1D0FE92600D`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `d3e6b71deed49176c26726f9ab798b9599d7c8c7987d5910069549c612bc9d44`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Typed emitter and transforms

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/content.md`  
**SHA-256:** `d582a6016e3bc716c23cadacd78a857a1ab5fa50a0165eea2c8915608b62e2aa`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub defines the normative contract for **`Beskid.Compiler.Emit`** (typed emitter and transforms) and links detailed articles.

## Language alignment
Only the **`emit`** phase may apply **typed** program contributions through this surface; the host validates merge against language rules.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/syntax/items/` — patterns for well-formed item emission.
- `compiler/crates/beskid_codegen/` — downstream expectations after merge.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0016` … `D-COMP-MODS-0018`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Typed emitter and transforms - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Typed emitter and transforms - Design model](./articles/design-model/)
- [Typed emitter and transforms - Examples](./articles/examples/)
- [Typed emitter and transforms - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Typed emitter and transforms - Flow and algorithm](./articles/flow-and-algorithm/)
- [Typed emitter and transforms - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `b931e7ddbefe6de95175e963566b866cebee5323eabb605af7f8216800fca91b`

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

- `site/website/src/content/docs/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `09b5f651cf61664e1d073aaa88f72e09b9ebacdf33fc0e5970323f684c75cfbc`

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

- `compiler/crates/beskid_analysis/src/syntax/items/`
- `compiler/crates/beskid_codegen/`
``````

</details>

### Source Record: Primary contract for Typed emitter and transforms

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/adr/0003-primary-contract-choice/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/adr/0003-primary-contract-choice/content.md`  
**SHA-256:** `d3e6b71deed49176c26726f9ab798b9599d7c8c7987d5910069549c612bc9d44`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

This feature hub defines the normative contract for **`Beskid.Compiler.Emit`** (typed emitter and transforms) and links detailed articles.

## Decision

The reference compiler **must** implement Typed emitter and transforms as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/syntax/items/`
- `compiler/crates/beskid_codegen/`
``````

</details>

### Source Record: Typed emitter and transforms - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `884bdf3791812214681784525298f568d64eea20020e0e831a8b754abb2b8b32`

<details>
<summary>Migrated source text</summary>

``````markdown
This article states **contracts and edge cases** for **Typed emitter and transforms**.

## Hard requirements
- **Deterministic ordering** — discovery and execution order must be reproducible from equal inputs (path-normalized roots, sorted files, stable tie-breaks).
- **Bounded work** — host enforces step limits, allocation caps, and recursion depth across nested meta calls.
- **Versioned facades** — `Beskid.Compiler` surface is tied to compiler language version tokens exposed on the compilation instance.

## Edge cases
- **Partial programs** — facades must tolerate incomplete syntax where the language permits; diagnostics are preferred over host panics.
- **Conflicting edits** — multiple meta contributors touching the same declaration identity produce a deterministic merge failure surfaced as structured diagnostics.
``````

</details>

### Source Record: Typed emitter and transforms - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/articles/design-model/content.md`  
**SHA-256:** `df90b424d60023a31ce114552c25a5a851b9bd18f83baa9892f285641d18c676`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents the **design model** for **Typed emitter and transforms**.

## Language alignment
**Emit** applies only **typed** edits; language-meta forbids raw-text patching as the normative contract.

## Persistent entities
- **Compilation instance** — implicit handle to the compilation under construction (**[Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/)** / `Beskid.Compiler.Compilation`).
- **Syntax snapshot** — immutable tree with stable node identities suitable for incremental keys.
- **Capability tokens** — host-granted permissions for I/O, diagnostics, and emit operations during mod execution.

## Boundaries
- Mod SDK facades never bypass the host bridge for effects.
- Generation logic in the reference compiler remains Rust-internal; Beskid sees only the generated `Beskid.Compiler.*` projection.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/syntax/items/` — patterns for well-formed item emission.
- `compiler/crates/beskid_codegen/` — downstream expectations after merge.

## Merge model (surface syntax first)

Typed emit **must** construct or mutate **`Program`**-level syntax nodes (or a documented multi-file aggregate feeding the same parser contract), not ad hoc HIR patches. Contributions **must** pass the same well-formedness checks as user-authored items before merge.

**Ordering** — Multiple contributors touching the same **declaration identity** produce a deterministic merge failure surfaced as structured diagnostics; the host **must not** leave a partially merged tree.

**Handoff to lowering** — After typed emit commits at **`syntax.generation`** and the host emits **`lower.ready`**, the merged syntax **must** be the sole input to `lower_normalize_resolve_type_spanned` / codegen lowering paths documented in **[Stage ordering and lowering](/platform-spec/compiler/build-pipeline/stage-ordering/)**; lowering **must not** begin until emit validation succeeds or emit is skipped for that generation round.
``````

</details>

### Source Record: Typed emitter and transforms - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/articles/examples/content.md`  
**SHA-256:** `68a8530edc702a0746197572d9b31fc246847b867355a7d67a692e90e5347413`

<details>
<summary>Migrated source text</summary>

``````markdown
This article collects **examples** for **Typed emitter and transforms** (informative sketches aligned with contracts).

## Example A — Minimal query
A compile-time module reads a syntax attribute using the query API, then emits a diagnostic without mutating syntax.

## Example B — Emitter sketch
A contributor constructs a new method declaration through `Beskid.Compiler.Emit`, attaches trivia, and registers it with the incremental graph.

> Executable snippets will track the reference implementation as mod host execution lands in the compiler; until then, treat these as specification fixtures.
``````

</details>

### Source Record: Typed emitter and transforms - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `48979f42df3c384ec0eb8a9ed17a916cd16b7f611c8b141da70ac77b782d868e`

<details>
<summary>Migrated source text</summary>

``````markdown
This article collects **FAQ** entries for **Typed emitter and transforms**.

## Why separate language-meta and compiler pages?
Language-meta defines Beskid-side mod contracts; this compiler area defines how the Rust host executes them safely and incrementally.

## Can meta call arbitrary FFI?
No — unless explicitly granted by platform policy and declared in compilation capabilities. Default contracts deny ambient FFI.

## Where do Roslyn/KSP parallels apply?
Only as rationale for incremental caches and typed models; Beskid contracts are authoritative here, not foreign tool behavior.
``````

</details>

### Source Record: Typed emitter and transforms - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/articles/flow-and-algorithm/content.md`  
**SHA-256:** `8308bebd2b2ca862b64e18cb7e0e882766f394ccd30d3f2b6b36fc66079df15b`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **flow and algorithms** for **Typed emitter and transforms**.

## Primary flow
1. Materialize or refresh the syntax snapshot for the active compilation generation.
2. Classify meta contributors vs read-only inspectors (language-meta classification carries through here).
3. Execute host policy checks before surfacing Mod SDK calls.
4. Commit outputs atomically per scheduling round (see incremental scheduling feature).

## Ordering constraints
- No meta body runs before a parseable syntax model exists for its lexical scope.
- Semantic queries that depend on staged rules must declare the minimal snapshot version they require; the host may defer or rerun automatically.
``````

</details>

### Source Record: Typed emitter and transforms - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/articles/verification-and-traceability/content.md`  
**SHA-256:** `71e158d44773141e5ac8ac0fef0371f79bcec245e7e5237012a7f8989383fdd2`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **Typed emitter and transforms**.

## Traceability matrix
- Anchor: `compiler/crates/beskid_analysis/src/syntax/items/` — patterns for well-formed item emission.
- Anchor: `compiler/crates/beskid_codegen/` — downstream expectations after merge.

## Verification expectations

- **Merge conflicts** — Tests assert two generator contributors targeting the same declaration identity emit deterministic **E1836–E1850** diagnostics and leave the syntax tree unchanged (see **[Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/)**).
- **Lowering guard** — Tests ensure `lower.ready` (or equivalent sequencing) never fires between partial emit and rollback.
- **Golden traces (optional)** — Same as **[Incremental scheduling / verification](/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/verification-and-traceability/)** when emit drives invalidation.

## Review cadence
- Update this bundle whenever public `Beskid.Compiler.*` shapes or host policies change.
``````

</details>
