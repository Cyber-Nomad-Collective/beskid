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

### Requirement: Qualified executable structural generator artifact
A required native Generator SHALL execute only from a qualified executable Mod artifact. Its descriptor SHALL declare schema 3, artifact kind `executable-shared-library`, host ABI version 2, the exact host target and the exported discriminator symbol. The host SHALL reject a missing or mismatched descriptor, a relocatable object descriptor, a wrong artifact kind or host ABI, and a discriminator that does not return 2, before it calls an entry. Structural contributions SHALL cross the boundary as owned typed compiler SDK values through the isolated CABI2 worker. They SHALL decode into complete `SpannedContractDefinition`, `SpannedTypeDefinition`, `SpannedFunctionDefinition` or `SpannedImplBlock` AST values through the canonical machine correspondence. Required-capability absence SHALL be terminal, with no stub success, generated source parsing or raw AST pointer cast. A Generator result SHALL carry only typed contributions and their issuer bindings; the host SHALL reject a result that carries any other field, including a source-text contribution, and SHALL NOT write, parse or merge generator-supplied source text. The retired `ModStructuralGenerationRequestV1` request, its constructor callback table and the `beskid_mod_structural_generator_abi_version` marker SHALL NOT be accepted.

#### Scenario: Native generator builds actual nodes (MOD-06-03)
- **GIVEN** a qualified executable Mod artifact built from canonical SDK source whose Generator constructs a new public function and a generic record
- **WHEN** production dispatch invokes its registered entry and decodes the returned typed contribution
- **THEN** the new static function and record nodes merge at a fresh registered generation with zero CodeString outputs, pass current semantic validation and the generated function executes

#### Scenario: Descriptor and discriminator gate the entry (MOD-06-04)
- **GIVEN** a missing or legacy object descriptor, a wrong artifact kind, host ABI or target, or a discriminator that does not return 2
- **WHEN** required structural generation is requested
- **THEN** generation fails before the entry is called and no legacy or stub path supplies successful output

### Requirement: Structural contribution authority and bounds
The host structural contribution arena SHALL bound one invocation to at most 4096 items, 65536 AST nodes and depth 128. The node budget SHALL cover the sum of all successfully inserted contributions in one invocation arena. Insertion SHALL reserve that budget atomically with publication, including concurrent insertions. A rejected insertion SHALL preserve previously issued handles and the remaining budget; selecting only a subset of contributions for materialization SHALL NOT reset or enlarge the insertion budget.

Structural node handles SHALL be opaque owned lookup tokens that are never dereferenced as AST addresses and never reused after close. Materialization SHALL validate owner, actual generation and contribution kind, and SHALL reject stale, foreign, null and closed-arena handles. Native typed transport SHALL bound structural depth to 128 and collection length to 65536 elements independently of depth. Native callbacks SHALL borrow only the live invocation authority; a callback issued after its invocation ends SHALL fail without touching released state. Materialization SHALL validate the entire output before publication and preserve source/generator/span provenance; semantic operations SHALL consume the read-only generation-bound query authority, with missing facts terminal.

#### Scenario: Independently legal contributions exceed the invocation budget
- **GIVEN** several contributions each fit the per-tree depth bound and together exhaust the arena node budget
- **WHEN** another contribution is inserted, including through concurrent insertions
- **THEN** insertion fails with a bounds error and earlier handles remain valid without publishing the rejected contribution

#### Scenario: Invalid handles cannot materialize (MOD-06-05)
- **GIVEN** wrong owner/generation/kind, foreign/null token or a closed arena
- **WHEN** structural output is materialized
- **THEN** a checked error occurs with no partial nodes published and no AST pointer dereference

#### Scenario: Bounded transport and late callbacks (MOD-06-06)
- **GIVEN** a native contribution exceeds the depth or collection bounds, or a callback runs after its invocation returns
- **WHEN** the host decodes the contribution or serves the callback
- **THEN** it fails before publication and without access to released invocation state

### Requirement: Registered assembly semantic shape authority
The native structural semantic bridge SHALL derive its generation and project owner from the existing registered ProgramAssembly and Salsa syntax authority. Before issuing a semantic type handle it SHALL validate the source unit registration, current generation, project owner and declaration kind. Read-only consumers SHALL receive issuer-bound opaque handles, not unchecked AST keys or raw addresses as authority. Shape access SHALL delegate to canonical semantic queries without a second shape cache, HIR rebuild, source reflection or ABI-offset inference. Shapes SHALL preserve canonical declaration identity, applied generic arguments and substitution, source-ordered named fields, and source-proven managed-reference classification. Unsupported or unresolved shapes SHALL return a checked unavailable result, never a guessed primitive or ownership class.

#### Scenario: Current primitive and composite fields (MOD-06-29)
- **GIVEN** a real materialized assembly registered with the canonical query database containing primitive fields and a nested nominal type with a managed string field
- **WHEN** a native structural consumer resolves the current type through its assembly-bound semantic authority
- **THEN** the read-only shape preserves declaration/source/generation identity, field order, primitive identity, nested nominal identity and managed-reference facts

#### Scenario: Applied generic field retains canonical substitution (MOD-06-30)
- **GIVEN** a current source field of an applied nominal type such as Box<i32> whose declaration contains a T value field
- **WHEN** the semantic bridge queries that field's type shape
- **THEN** the handle retains the Box declaration and i32 argument identity and exposes the value field as i32 with scalar ownership
- **AND** an unapplied or unsupported generic shape returns unavailable rather than inferring from layout offsets or erased nominal names

#### Scenario: Foreign semantic authority is rejected (MOD-06-31)
- **GIVEN** a stale generation, unregistered source unit, foreign project owner, non-type declaration or handle issued by another semantic authority
- **WHEN** type resolution or shape access is requested
- **THEN** no shape is returned and no secondary syntax or semantic snapshot is created

### Requirement: Complete adapter constructor and provenance path
The structural constructor surface required for serialization SHALL represent supported primitive and composite field types, applied generics, callable parameters/results, field access, calls, literals, result propagation and function bodies as typed nodes. It SHALL support real adapter functions that consume canonical codec interfaces and actual source fields; empty unit functions and generic-only records SHALL NOT satisfy full adapter delivery. Source unit, actual generation, generator owner and origin span SHALL travel with each generated item through native materialization, GeneratorOutcome, typed merge and subsequent semantic registration. Any unavailable constructor or semantic fact required by an adapter SHALL terminate generation without parsing generated text or emitting a partial successful adapter.

#### Scenario: Real field adapter body materializes (MOD-06-32)
- **GIVEN** a current eligible type with primitive and composite fields and available canonical semantic and codec contracts
- **WHEN** its native serialization generator builds encode/decode adapter functions through typed constructors
- **THEN** the functions contain actual typed parameters, result types and field/codec call bodies, preserve provenance through merge, and pass current semantic validation

#### Scenario: Provenance survives typed merge (MOD-06-33)
- **GIVEN** a generated item with a canonical source-unit identity, actual assembly generation, generator registration and origin span
- **WHEN** native output becomes GeneratorOutcome and merges into the host typed program
- **THEN** subsequent semantic registration and diagnostics can recover the same source/generator/span provenance without an arena-only side channel

### Requirement: Lossless compiler SDK syntax mirrors
The generated compiler SDK SHALL preserve the canonical Rust syntax data model's scalar widths and signedness, source spans and node identifiers, optional absence, list element identity, generic bounds and attached documentation metadata. Traversal annotations SHALL control navigation and SHALL NOT erase data from reflected constructor schemas. Concrete source wrappers SHALL retain their wrapped typed node and its source metadata. Generated constructor schemas SHALL be produced from canonical source declarations; hand-written duplicate syntax declarations and source-text reconstruction SHALL NOT substitute for these schemas.

#### Scenario: Generic function mirror retains source authority [SDK0601]
- **GIVEN** a canonical function declaration with spanned identifiers, parameters, return type, generic contract bounds and parameter documentation
- **WHEN** its SDK constructor schema is regenerated
- **THEN** every field SHALL retain its typed value, optionality and source metadata, including fields excluded from child traversal

#### Scenario: Numeric and byte identities remain distinct [SDK0602]
- **GIVEN** canonical fields containing signed and unsigned integer widths, f32 and f64, optional numeric values and byte lists
- **WHEN** their SDK schemas are regenerated
- **THEN** their widths, signedness, optional absence and byte element identity SHALL remain distinct without coercion to i64, f64 or string

### Requirement: Source-issued serialization contribution bindings
The Mod host SHALL decode every native structural contribution into the complete typed source AST before considering serialization metadata. A generated ImplBlock contribution MAY describe a target semantic handle and contribution index; that description SHALL NOT grant authority. The invocation-scoped compiler provider SHALL reject duplicate or out-of-range indices, foreign or stale target handles, and mismatched contribution targets before issuing any private compiled metadata. Emission SHALL revalidate the generated implementation and exact applied contract witnesses against the current merged generation.

#### Scenario: MOD-06-25 Full implementation contribution retains target correspondence
- **GIVEN** a qualified generator returns a complete SpannedImplBlock and a unique binding to a currently issued target handle
- **WHEN** the parent decodes the contribution during the live invocation
- **THEN** it retains the complete implementation AST and privately issued correspondence for post-merge revalidation

#### Scenario: MOD-06-26 Descriptive bindings cannot qualify foreign contributions
- **GIVEN** a generator supplies a duplicate index, an unknown index, or a foreign target handle
- **WHEN** the parent validates generated bindings
- **THEN** it rejects the result without issuing serialization metadata or publishing generated syntax

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
