<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Incremental scheduling and determinism Specification

## Purpose

Cache boundaries, invalidation keys, and replay guarantees for mod outputs and Mod SDK reads.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-MODS-0007]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-6C82DD0025E1`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `3753a60900a41e822e35471ffc76eb8dcaeda8c1dbc85de31b7aedcdae681d0b`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-MODS-0008]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-03F3A3B48329`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `d99815194a97548fa60a44505718c23d6cc175fe41e6006dadea6453bfef69d1`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Deterministic mod invalidation and replay: Decision [D-COMP-MODS-0009]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Invalidation keys and dirty sets for mod pipelines **must** replay deterministically for identical inputs (Collector scope + syntax snapshot hashes).

**Stable ID:** `BSP-REQ-83881E9D64A9`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/adr/0003-mod-invalidation-deterministic-replay/content.md`  
**Source SHA-256:** `7a15a0ae67ff8aa7d4d792969f2a27d7e1cd7f4942f85ef7c8999e093938ca2e`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Incremental scheduling and determinism

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/content.md`  
**SHA-256:** `ced6fba89c83da20cfe08ca2a7c54e34d07c0dec593b7fad26d68dc0b75e45e9`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub defines invalidation keys, cache boundaries, and replay for mod pipelines and **`Mod`** projects.

## Language alignment
Maps Collector scope strategies (narrow vs workspace-wide) to concrete dependency graph width and dirty-set propagation.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/` — precedent for staged invalidation.
- `compiler/crates/beskid_lsp/` — incremental document models and rescan triggers.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0007` … `D-COMP-MODS-0009`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Incremental scheduling and determinism - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Incremental scheduling and determinism - Design model](./articles/design-model/)
- [Incremental scheduling and determinism - Examples](./articles/examples/)
- [Incremental scheduling and determinism - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Incremental scheduling and determinism - Flow and algorithm](./articles/flow-and-algorithm/)
- [Incremental scheduling and determinism - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `3753a60900a41e822e35471ffc76eb8dcaeda8c1dbc85de31b7aedcdae681d0b`

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

- `site/website/src/content/docs/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `d99815194a97548fa60a44505718c23d6cc175fe41e6006dadea6453bfef69d1`

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

- `compiler/crates/beskid_analysis/src/analysis/rules/staged/`
- `compiler/crates/beskid_lsp/`
``````

</details>

### Source Record: Deterministic mod invalidation and replay

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/adr/0003-mod-invalidation-deterministic-replay/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/adr/0003-mod-invalidation-deterministic-replay/content.md`  
**SHA-256:** `7a15a0ae67ff8aa7d4d792969f2a27d7e1cd7f4942f85ef7c8999e093938ca2e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Incremental mod runs produced unstable ordering.

## Decision

Invalidation keys and dirty sets for mod pipelines **must** replay deterministically for identical inputs (Collector scope + syntax snapshot hashes).

## Consequences

LSP rescan triggers share the same keys as batch compile.

## Verification anchors

- `compiler/crates/beskid_lsp/`
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/`.
``````

</details>

### Source Record: Incremental scheduling and determinism - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `df8772e5965957db74061eeb2f5ff2cd71eac583e517c1cad73b87623898357f`

<details>
<summary>Migrated source text</summary>

``````markdown
This article states **contracts and edge cases** for **Incremental scheduling and determinism**.

## Hard requirements
- **Deterministic ordering** — discovery and execution order must be reproducible from equal inputs (path-normalized roots, sorted files, stable tie-breaks).
- **Bounded work** — host enforces step limits, allocation caps, and recursion depth across nested meta calls.
- **Versioned facades** — `Beskid.Compiler` surface is tied to compiler language version tokens exposed on the compilation instance.

## Edge cases
- **Partial programs** — facades must tolerate incomplete syntax where the language permits; diagnostics are preferred over host panics.
- **Conflicting edits** — multiple meta contributors touching the same declaration identity produce a deterministic merge failure surfaced as structured diagnostics.
``````

</details>

### Source Record: Incremental scheduling and determinism - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/articles/design-model/content.md`  
**SHA-256:** `14c12095d6998b09c07b96333ece0432c02ee3045840e46f601b0bc2d1d5891e`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents the **design model** for **Incremental scheduling and determinism**.

## Language alignment
**Isolating** capture yields narrow dirty sets; **aggregating** capture widens invalidation by language intent—encoded as explicit graph edges here.

## Persistent entities
- **Compilation instance** — implicit handle to the compilation under construction (**[Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/)** / `Beskid.Compiler.Compilation`).
- **Syntax snapshot** — immutable tree with stable node identities suitable for incremental keys.
- **Capability tokens** — host-granted permissions for I/O, diagnostics, and emit operations during mod execution.

## Boundaries
- Mod SDK facades never bypass the host bridge for effects.
- Generation logic in the reference compiler remains Rust-internal; Beskid sees only the generated `Beskid.Compiler.*` projection.

## Anchored code paths
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/` — precedent for staged invalidation.
- `compiler/crates/beskid_lsp/` — incremental document models and rescan triggers.

## Invalidation keys (normative)

Hosts **must** record, per mod contract schedule, at minimum:

1. **`syntax_generation_id`** — Monotonic per compilation unit (or workspace slice) counter bumped whenever a new parse snapshot replaces the previous `Program`.
2. **`capture_fingerprint`** — Hash of stable syntax node identities and predicate parameters bound during capture (isolating capture narrows this hash to declared roots; aggregating capture mixes in workspace-wide generation ids).
3. **`manifest_generation_id`** — Hash of relevant `Project.proj` / `Workspace.proj` / lockfile bytes affecting mod package identity, capabilities, or dependencies.
4. **`capability_set_id`** — Canonical encoding of granted capabilities for the active mod schedule.

Replay **must** reuse cached process outputs when and only when all four ids match prior committed work. Any mismatch **must** drop cached process/emit artifacts before running the next round.

## Isolating vs aggregating (implementation mapping)

- **Isolating** — Dirty set includes only items whose capture fingerprints reference changed syntax ids or directly imported modules touched on disk.
- **Aggregating** — Declarations in language-meta force inclusion of **`syntax_generation_id`** for **every** compilation unit in the attach target when **any** file in the member changes; hosts **must** record an explicit graph edge so tools can explain broad invalidation.

## Atomicity

Within one **`syntax.generation`** commit boundary, emit applications and diagnostic emissions **must** commit atomically: downstream semantic stages **must not** observe partially applied generator edits (**[Typed emitter and transforms](/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/)**).
``````

</details>

### Source Record: Incremental scheduling and determinism - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/articles/examples/content.md`  
**SHA-256:** `a8be2496bd2c8589ee4a3f755387cc34e4772b44649df1b353fa3d99a8e5748b`

<details>
<summary>Migrated source text</summary>

``````markdown
This article collects **examples** for **Incremental scheduling and determinism** (informative sketches aligned with contracts).

## Example A — Minimal query
A compile-time module reads a syntax attribute using the query API, then emits a diagnostic without mutating syntax.

## Example B — Emitter sketch
A contributor constructs a new method declaration through `Beskid.Compiler.Emit`, attaches trivia, and registers it with the incremental graph.

> Executable snippets will track the reference implementation as mod host execution lands in the compiler; until then, treat these as specification fixtures.
``````

</details>

### Source Record: Incremental scheduling and determinism - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `4cbabfac4eee620020aab60e13c4db3fe3f4e84d073ca52888d314febd71e6c8`

<details>
<summary>Migrated source text</summary>

``````markdown
This article collects **FAQ** entries for **Incremental scheduling and determinism**.

## Why separate language-meta and compiler pages?
Language-meta defines Beskid-side mod contracts; this compiler area defines how the Rust host executes them safely and incrementally.

## Can meta call arbitrary FFI?
No — unless explicitly granted by platform policy and declared in compilation capabilities. Default contracts deny ambient FFI.

## Where do Roslyn/KSP parallels apply?
Only as rationale for incremental caches and typed models; Beskid contracts are authoritative here, not foreign tool behavior.
``````

</details>

### Source Record: Incremental scheduling and determinism - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/articles/flow-and-algorithm/content.md`  
**SHA-256:** `f50b19d000a4edd82dc7b5071a88cdcf4f3db39fd0663fafdbc7fb9c3c175c30`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **flow and algorithms** for **Incremental scheduling and determinism**.

## Primary flow (incremental-specific)

1. **Ingest signals** — Collect file watcher events, manifest edits, lockfile changes, and explicit CLI/LSP invalidation hooks (`invalidate_compilation_cache` patterns in `compiler/crates/beskid_lsp`).
2. **Classify scope** — Determine whether each dirty signal is **narrow** (single compilation unit / isolating capture) or **wide** (workspace member or aggregating capture). Wide signals **must** bump `syntax_generation_id` for all units in the attach target.
3. **Recompute keys** — For each scheduled mod contract, rebuild **`capture_fingerprint`**, `manifest_generation_id`, and `capability_set_id` per **[design model](./design-model/)**. Drop any cache entry whose tuple diverges.
4. **Schedule rounds** — Enqueue mod contracts in deterministic discovery order (stable module walk, stable tie-break on equal keys). Respect `maxGeneratorRounds` from **[Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)**.
5. **Run host bridge** — For each item, if cache hit for process-only work, reuse validated artifacts; otherwise run capture → process under capability policy.
6. **Commit emit** — Apply typed contributions atomically, bump `syntax_generation_id`, re-parse affected roots, and emit `syntax.generation` for telemetry.
7. **Replay verification** — On identical inputs and ids, hosts **must** reproduce the same ordered diagnostics and the same merge outcome (see contracts article for determinism tests).

## Ordering constraints

- Incremental caches **must not** survive cross-compiler-version bumps without clearing: include compiler semver or commit identity in `manifest_generation_id` or a sibling host key.
- Soft invalidation (skip graph rebuild) is permitted only when design-model soft rules hold; otherwise fall back to full `CompilationContext` rebuild.
- Semantic queries declared against `query_semantic_snapshot` **must** declare minimum snapshot version; the host **must** defer with an explicit diagnostic when the staged pipeline has not reached that version yet.
``````

</details>

### Source Record: Incremental scheduling and determinism - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/articles/verification-and-traceability/content.md`  
**SHA-256:** `67f53d834e6aac8bb4540665f5302847c930b887a8546ff8b948b0ee82e31d57`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **Incremental scheduling and determinism**.

## Traceability matrix
- Anchor: `compiler/crates/beskid_analysis/src/analysis/rules/staged/` — precedent for staged invalidation.
- Anchor: `compiler/crates/beskid_lsp/` — incremental document models and rescan triggers.

## Verification expectations

- **Key tuple replay** — Tests under `compiler/crates/beskid_tests/src/projects/` (or a dedicated `meta_incremental/` subdirectory) **must** assert that when `syntax_generation_id`, `capture_fingerprint`, `manifest_generation_id`, and `capability_set_id` match a prior run, the host skips re-execution of process-only work; when any id changes, caches miss deterministically.
- **Isolating vs aggregating** — Pairwise fixtures demonstrate narrow vs wide dirty sets as described in **[design model](./design-model/)**.
- **LSP alignment** — Mirror at least one replay scenario through `compiler/crates/beskid_lsp` session tests so soft vs hard invalidation matches **[Snapshot and refresh contract](/platform-spec/tooling/lsp/snapshot-and-refresh-contract/)**.
- **Golden traces (optional)** — Record ordered phase ids + cache hits for regression when mod host complexity grows.

## Review cadence
- Update this bundle whenever public `Beskid.Compiler.*` shapes or host policies change.
``````

</details>
