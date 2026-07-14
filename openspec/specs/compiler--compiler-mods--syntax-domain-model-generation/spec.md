<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Syntax domain model generation Specification

## Purpose

Contract for generating the immutable SyntaxMirror domain model consumed by Compiler Mod SDK facades.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-MODS-0013]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-0390E9457D4D`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `2f66eb8ea6cd5059bf0b52dbb08efde07439d443cf6decb3731c5245b1a979d6`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-MODS-0014]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-25A15E21A4D7`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `ce9cc0d716fcfb7a56dfeeef8ea00881c5694ae2d8001469930d7262769c23ba`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Rust AST reflection into Beskid.Compiler SDK: Decision [D-COMP-MODS-0015]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Canonical syntax model is generated via `beskid_ast_reflect_gen` into `Beskid.Compiler.*` SDK sources from the Rust AST—aligned with D-INC-0006.

**Stable ID:** `BSP-REQ-192F8C779D31`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/adr/0003-rust-ast-reflect-sdk/content.md`  
**Source SHA-256:** `e9c9250017d379cc0d99cf51c1c7d418f55d4fc78b91d8228e40d7a547f3985a`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Syntax domain model generation

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/content.md`  
**SHA-256:** `9bf84209d7daf318fc41120e80f3247c06bf9169571b65ea538a3c8f92193f03`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub defines the normative contract for **syntax domain model generation** and links detailed articles.

## Language alignment
`Collector` contracts depend on immutable syntax snapshots and **stable node identities** produced here. `Generator` and `Rewriter` must not retain stale references across invalidation rounds.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/syntax/` — syntax item builders and node shapes.
- `compiler/crates/beskid_analysis/src/beskid.pest` — grammar surface feeding parse output.
- `compiler/crates/beskid_analysis/src/syntax/items/` — item-level parsers and metadata.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0013` … `D-COMP-MODS-0015`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Syntax domain model generation - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Syntax domain model generation - Design model](./articles/design-model/)
- [Syntax domain model generation - Examples](./articles/examples/)
- [Syntax domain model generation - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Syntax domain model generation - Flow and algorithm](./articles/flow-and-algorithm/)
- [Syntax domain model generation - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `2f66eb8ea6cd5059bf0b52dbb08efde07439d443cf6decb3731c5245b1a979d6`

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

- `site/website/src/content/docs/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `ce9cc0d716fcfb7a56dfeeef8ea00881c5694ae2d8001469930d7262769c23ba`

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

- `compiler/crates/beskid_analysis/src/syntax/`
- `compiler/crates/beskid_analysis/src/beskid.pest`
- `compiler/crates/beskid_analysis/src/syntax/items/`
``````

</details>

### Source Record: Rust AST reflection into Beskid.Compiler SDK

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/adr/0003-rust-ast-reflect-sdk/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/adr/0003-rust-ast-reflect-sdk/content.md`  
**SHA-256:** `e9c9250017d379cc0d99cf51c1c7d418f55d4fc78b91d8228e40d7a547f3985a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Hand-maintained parallel syntax trees diverged from the host parser.

## Decision

Canonical syntax model is generated via `beskid_ast_reflect_gen` into `Beskid.Compiler.*` SDK sources from the Rust AST—aligned with D-INC-0006.

## Consequences

Mods consume generated facades; internal `beskid_analysis::syntax` remains host-only.

## Verification anchors

- `beskid_ast_reflect_gen`
- `compiler/crates/beskid_analysis/src/syntax/`.
``````

</details>

### Source Record: Syntax domain model generation - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `6bc5163faf7c1fc1b9ba2099bf8016d8a0036b28fd27a1f1ee4813f6e2e8e2bf`

<details>
<summary>Migrated source text</summary>

``````markdown
This article states **contracts and edge cases** for **Syntax domain model generation**.

## Hard requirements
- **Deterministic ordering** — discovery and execution order must be reproducible from equal inputs (path-normalized roots, sorted files, stable tie-breaks).
- **Bounded work** — host enforces step limits, allocation caps, and recursion depth across nested meta calls.
- **Versioned facades** — `Beskid.Compiler` surface is tied to compiler language version tokens exposed on the compilation instance.

## Edge cases
- **Partial programs** — facades must tolerate incomplete syntax where the language permits; diagnostics are preferred over host panics.
- **Conflicting edits** — multiple meta contributors touching the same declaration identity produce a deterministic merge failure surfaced as structured diagnostics.
``````

</details>

### Source Record: Syntax domain model generation - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/articles/design-model/content.md`  
**SHA-256:** `0ecba3ccdd04cb5e3757e58727d5012bf04c923976ff7da8d51cf4fe381837e6`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents the **design model** for **SyntaxMirror domain model generation**.

## Language alignment

`Collector` predicates compile to keys over syntax identities from this model. The host regenerates or diffs snapshots so `Generator` and `Rewriter` never observe torn trees.

## Persistent entities

- **Compilation instance** — active host compilation under transformation.
- **Syntax snapshot** — immutable tree with stable node identities for incremental keys.
- **SyntaxMirror projection** — Beskid-facing typed mirror of syntax nodes with query/AST operation contracts.

## Boundaries

- Rust AST in `beskid_analysis` is authoritative; SyntaxMirror is generated/mirrored for mod packages.
- Legacy `MetaDefinition` nodes are removed from the mirror inventory.
- The Rust inner item enum (`syntax::Node`) is **host-only** and is **not** emitted into the Mod SDK. Mod packages see **`Node` contract** + **`NodeRef`** instead.

## Generated artifacts

`beskid_ast_reflect_gen` emits, under `Beskid.Syntax.Nodes`:

| Artifact | Role |
| --- | --- |
| Per-type shape `.bd` | Struct/enum mirrors for typed emit and rewrite (`FunctionDefinition`, …) |
| **`Node.bd`** | `pub contract Node` — kind, ref, child push |
| **`NodeRef.bd`** | Opaque stable handle |
| **`NodeSpan.bd`** | Span DTO for one node in one generation |
| **`NodeKind.bd`** | Classification tokens (mirrors `query::NodeKind`) |
| **`NodeList.bd`** | `Vec<Node>` as cons-list of **`NodeRef`** |
| **`TraversalManifest.bd`** | Child-slot table derived from Rust `#[ast(child\|children\|skip)]` |

Traversal metadata **must** stay aligned with `beskid_ast_derive::AstNode` wiring in `beskid_analysis`.

## Stable identities

Each node **must** have a stable identity within a `syntax_generation_id` window. Identities **must** survive trivia-only edits where language law marks them stable and **must** change on structural edits that affect collection predicates.

**Torn tree prohibition** — Hosts **must not** expose partial syntax trees to mod contracts. Parse failures abort the current generation round with diagnostics, leaving the previous committed generation untouched.

**Multi-root workspaces** — Identities **must** be qualified by normalized root path + in-root span so different projects cannot collide in caches.

## Transformation model

- Query-pipeline transforms run against one immutable `SyntaxSnapshot` generation and produce one new committed generation on success.
- Pipeline application **must** be transactional: validation completes before any mutation becomes visible to mod code.
- Span propagation is explicit:
  - untouched nodes preserve original spans;
  - replaced nodes receive source spans from replacement payloads when available;
  - synthetic nodes may use host-synthetic spans but must remain diagnosable.
``````

</details>

### Source Record: Syntax domain model generation - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/articles/examples/content.md`  
**SHA-256:** `966d860176c65f429697b05b25f899605b92f3efe15060c52bf8df9ba6bb9cad`

<details>
<summary>Migrated source text</summary>

``````markdown
This article collects **examples** for **Syntax domain model generation** (informative sketches aligned with contracts).

## Example A — Minimal query
A compile-time module reads a syntax attribute using the query API, then emits a diagnostic without mutating syntax.

## Example B — Emitter sketch
A contributor constructs a new method declaration through `Beskid.Compiler.Emit`, attaches trivia, and registers it with the incremental graph.

> Executable snippets will track the reference implementation as mod host execution lands in the compiler; until then, treat these as specification fixtures.
``````

</details>

### Source Record: Syntax domain model generation - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `04f07434e6ebaddd99271089f97456ee96176ef85570e75e59be174e5c598e31`

<details>
<summary>Migrated source text</summary>

``````markdown
This article collects **FAQ** entries for **Syntax domain model generation**.

## Why separate language-meta and compiler pages?
Language-meta defines Beskid-side mod contracts; this compiler area defines how the Rust host executes them safely and incrementally.

## Can meta call arbitrary FFI?
No — unless explicitly granted by platform policy and declared in compilation capabilities. Default contracts deny ambient FFI.

## Where do Roslyn/KSP parallels apply?
Only as rationale for incremental caches and typed models; Beskid contracts are authoritative here, not foreign tool behavior.
``````

</details>

### Source Record: Syntax domain model generation - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/articles/flow-and-algorithm/content.md`  
**SHA-256:** `cb0fb78bdadc4c2caa082af4c55493f9992d1d2f1495c45ea99600a1439a460b`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **flow and algorithms** for **Syntax domain model generation**.

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

### Source Record: Syntax domain model generation - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/articles/verification-and-traceability/content.md`  
**SHA-256:** `277b2e8724713c6e0d50cccbca34d245bd10cefc6b7c48fa6fdaf4d13592a186`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **Syntax domain model generation**.

## Traceability matrix
- Anchor: `compiler/crates/beskid_analysis/src/syntax/` — syntax item builders and node shapes.
- Anchor: `compiler/crates/beskid_analysis/src/beskid.pest` — grammar surface feeding parse output.
- Anchor: `compiler/crates/beskid_analysis/src/syntax/items/` — item-level parsers and metadata.

## Verification expectations
- Contract tests in `compiler/crates/beskid_tests` assert ordering, diagnostic codes, and merge behavior once implemented.
- Golden incremental traces (optional) validate invalidation when syntax edits move spans tied to meta registrations.

## Review cadence
- Update this bundle whenever public `Beskid.Compiler.*` shapes or host policies change.
``````

</details>
