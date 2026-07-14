<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Beskid.Compiler.SyntaxMirror facade Specification

## Purpose

Typed, allocation-bounded syntax node API exposed to compile-time Beskid modules.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-MODS-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-B3996871F380`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `894b0e2a52f08c4d2c17a414f9aad50e81bb5d80eaf2cc9d735137b462624fa2`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-MODS-0005]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-4661A29C8B06`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `e4b0604532ae795d3037242ec3a3cae5a81b077dd2cc4fc9773d40666e4b5827`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Primary contract for Beskid.Compiler.SyntaxMirror facade: Decision [D-COMP-MODS-0006]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement Beskid.Compiler.SyntaxMirror facade as documented in this feature hub and its article bundle.

**Stable ID:** `BSP-REQ-38C641A8790D`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `05980e13a1fae4e61497acd32f71667403c1cb0564f8ad7bd803f83026306285`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Beskid.Compiler.SyntaxMirror facade

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/content.md`  
**SHA-256:** `e614a382cbffa09f3f796b986c8900d565332997555df2b62ce6faabab496561`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub defines the normative contract for **Beskid.Compiler.SyntaxMirror** and links detailed articles.

## Language alignment
Fluent **`Beskid.Compiler.Query`** plans (process phase) consume **Syntax** views. APIs must preserve immutability and identity stability required by **capture** keys in language-meta.

## Implementation anchors
- `corelib` package module `Beskid.Compiler.SyntaxMirror` (generated + hand-authored surface).
- `compiler/crates/beskid_analysis/src/syntax/` — authoritative internal model to mirror.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0004` … `D-COMP-MODS-0006`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Beskid.Compiler.SyntaxMirror facade - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Beskid.Compiler.SyntaxMirror facade - Design model](./articles/design-model/)
- [Beskid.Compiler.SyntaxMirror facade - Examples](./articles/examples/)
- [Beskid.Compiler.SyntaxMirror facade - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Beskid.Compiler.SyntaxMirror facade - Flow and algorithm](./articles/flow-and-algorithm/)
- [Beskid.Compiler.SyntaxMirror facade - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `894b0e2a52f08c4d2c17a414f9aad50e81bb5d80eaf2cc9d735137b462624fa2`

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

- `site/website/src/content/docs/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `e4b0604532ae795d3037242ec3a3cae5a81b077dd2cc4fc9773d40666e4b5827`

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
``````

</details>

### Source Record: Primary contract for Beskid.Compiler.SyntaxMirror facade

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/adr/0003-primary-contract-choice/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/adr/0003-primary-contract-choice/content.md`  
**SHA-256:** `05980e13a1fae4e61497acd32f71667403c1cb0564f8ad7bd803f83026306285`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

This feature hub defines the normative contract for **Beskid.Compiler.SyntaxMirror** and links detailed articles.

## Decision

The reference compiler **must** implement Beskid.Compiler.SyntaxMirror facade as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/syntax/`
``````

</details>

### Source Record: Beskid.Compiler.SyntaxMirror facade - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `f7f9b6780884f9946e599bbe5c108362c339aef34399f0879af3a811a2a14973`

<details>
<summary>Migrated source text</summary>

``````markdown
This article states **contracts and edge cases** for **Beskid.Compiler.SyntaxMirror facade**.

## Hard requirements
- **Deterministic ordering** — discovery and execution order must be reproducible from equal inputs (path-normalized roots, sorted files, stable tie-breaks).
- **Bounded work** — host enforces step limits, allocation caps, and recursion depth across nested meta calls.
- **Versioned facades** — `Beskid.Compiler` surface is tied to compiler language version tokens exposed on the compilation instance.

## Edge cases
- **Partial programs** — facades must tolerate incomplete syntax where the language permits; diagnostics are preferred over host panics.
- **Conflicting edits** — multiple meta contributors touching the same declaration identity produce a deterministic merge failure surfaced as structured diagnostics.
``````

</details>

### Source Record: Beskid.Compiler.SyntaxMirror facade - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/articles/design-model/content.md`  
**SHA-256:** `c4960a853556bce7f34045c119e480d37f9b085ef8fa5fc8fa1a3a0e3f63e76e`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents the **design model** for **Beskid.Compiler.SyntaxMirror facade**.

## Language alignment
**`Beskid.Compiler.Query`** consumes **Syntax** nodes as read-only views during the **`process`** phase; **emit** uses the same node factory family for typed contributions.

## Persistent entities
- **Compilation instance** — implicit handle to the compilation under construction (**[Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/)** / `Beskid.Compiler.Compilation`).
- **Syntax snapshot** — immutable tree with stable node identities suitable for incremental keys.
- **Capability tokens** — host-granted permissions for I/O, diagnostics, and emit operations during mod execution.

## Boundaries
- Mod SDK facades never bypass the host bridge for effects.
- Generation logic in the reference compiler remains Rust-internal; Beskid sees only the generated `Beskid.Compiler.*` projection.

## Anchored code paths
- `corelib` package module **`Beskid.Syntax`** (generated + hand-authored surface; legacy `Beskid.Compiler.Syntax` paths deprecated).
- `compiler/crates/beskid_analysis/src/syntax/` — authoritative internal model to mirror.
``````

</details>

### Source Record: Beskid.Compiler.SyntaxMirror facade - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/articles/examples/content.md`  
**SHA-256:** `9632cdb3171fbbc39412c5054a93bef485ee20f6a1c4d75100741fc8ada77693`

<details>
<summary>Migrated source text</summary>

``````markdown
This article collects **examples** for **Beskid.Compiler.SyntaxMirror facade** (informative sketches aligned with contracts).

## Example A — Minimal query
A compile-time module reads a syntax attribute using the query API, then emits a diagnostic without mutating syntax.

## Example B — Emitter sketch
A contributor constructs a new method declaration through `Beskid.Compiler.Emit`, attaches trivia, and registers it with the incremental graph.

> Executable snippets will track the reference implementation as mod host execution lands in the compiler; until then, treat these as specification fixtures.
``````

</details>

### Source Record: Beskid.Compiler.SyntaxMirror facade - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `a98b58c463b5e8bd1881c202cc66363b83961330d622c52b353b63834b856386`

<details>
<summary>Migrated source text</summary>

``````markdown
This article collects **FAQ** entries for **Beskid.Compiler.SyntaxMirror facade**.

## Why separate language-meta and compiler pages?
Language-meta defines Beskid-side mod contracts; this compiler area defines how the Rust host executes them safely and incrementally.

## Can meta call arbitrary FFI?
No — unless explicitly granted by platform policy and declared in compilation capabilities. Default contracts deny ambient FFI.

## Where do Roslyn/KSP parallels apply?
Only as rationale for incremental caches and typed models; Beskid contracts are authoritative here, not foreign tool behavior.
``````

</details>

### Source Record: Beskid.Compiler.SyntaxMirror facade - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/articles/flow-and-algorithm/content.md`  
**SHA-256:** `9fc8b30e266418435aae950efcfaa2fe8f691fa8e6544a65580aef222f4deb36`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **flow and algorithms** for **Beskid.Compiler.SyntaxMirror facade**.

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

### Source Record: Beskid.Compiler.SyntaxMirror facade - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/articles/verification-and-traceability/content.md`  
**SHA-256:** `6f69f65ef1a561bbc5e0ae8f69ca19e11b7b98947683a374995e8c47589035ea`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **Beskid.Compiler.SyntaxMirror facade**.

## Traceability matrix
- Anchor: `corelib` package module `Beskid.Compiler.SyntaxMirror` (generated + hand-authored surface).
- Anchor: `compiler/crates/beskid_analysis/src/syntax/` — authoritative internal model to mirror.

## Verification expectations
- Contract tests in `compiler/crates/beskid_tests` assert ordering, diagnostic codes, and merge behavior once implemented.
- Golden incremental traces (optional) validate invalidation when syntax edits move spans tied to meta registrations.

## Review cadence
- Update this bundle whenever public `Beskid.Compiler.*` shapes or host policies change.
``````

</details>
