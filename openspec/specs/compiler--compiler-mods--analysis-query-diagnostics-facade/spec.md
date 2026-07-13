<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Analysis, query, and diagnostics facades Specification

## Purpose

Semantic queries, symbol handles, and diagnostic transport available inside meta execution.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-MODS-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-DC53B8FFF212`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `1a6b81cfcc9be06761d035916d0414efd8722e8585f3a5584418f2ca3a1d82ca`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-MODS-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-C2C0FCB825EC`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `a92d9d1f39dc03aa80f11ecf343eb3a28f57e21cd9e49994e898403ba37af7a4`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Primary contract for Analysis, query, and diagnostics facades: Decision [D-COMP-MODS-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The reference compiler **must** implement Analysis, query, and diagnostics facades as documented in this feature hub and its article bundle.

**Stable ID:** `BSP-REQ-2BBD7A0FB5CD`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/adr/0003-primary-contract-choice/content.md`  
**Source SHA-256:** `19b4d4d646796fdfed56880a29da63f80d53aa71064b04c7e6cae2521c23016d`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: SharedResolution entry query bundle: Decision [D-COMP-MODS-0019]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> 1. **`SharedResolution`** wraps `Arc<Resolution>` and exposes thin delegates: `symbols()`, `by_symbol()`, `symbol_for_item`, `item_id_for_symbol`, `canonical_item_id`, `qualified_name` (no duplicated registry logic).
> 
> 2. **`entry_resolution_with_db`** in `beskid_queries::entry` runs the assembly + `ModuleIndex::resolve_entry_hir` spine and returns `SharedResolution` **without** typing the entry program.
> 
> 3. **`typed_entry_bundle`** remains the executable path; resolution-only callers **should** prefer `entry_resolution_with_db` when type results are not needed.
> 
> IDE document analysis continues to use `DocumentAnalysisSnapshot.resolution`; registry invariants are the same `Resolution` product described in [D-COMP-SEM-0016](/platform-spec/compiler/semantic-pipeline/resolver-contract/adr/0005-package-prefixed-symbol-identity/).

**Stable ID:** `BSP-REQ-76328B9F0B20`  
**Legacy source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/adr/0004-shared-resolution-query-bundle/content.md`  
**Source SHA-256:** `811c20acb8dce4681da37f99f15a845c5c007e6228c8fbbd6a109d345f05bb8c`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Analysis, query, and diagnostics facades

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/content.md`  
**SHA-256:** `09e206ad8b609c59bd245331ae6183ea9ace6600561dbf78a688d0269eff3505`

<details>
<summary>Migrated source text</summary>

``````markdown
This feature hub defines the normative contract for **`Beskid.Compiler.Query`** and **`Beskid.Compiler.Diagnostics`** (and related analysis facades) and links detailed articles.

## Language alignment
The **`process`** phase uses these modules for semantic questions and **compiler-native diagnostics**. Diagnostic shape and IDs must align with Rust analysis and LSP surfaces so **`Mod`** pipelines integrate with normal tooling.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/analysis/` — staged rules and semantic state.
- `compiler/crates/beskid_analysis/src/resolve/` — resolution products queryable from facades.
- `compiler/crates/beskid_lsp/src/diagnostics.rs` — diagnostic shaping for editor parity.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-MODS-0001` … `D-COMP-MODS-0019`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Analysis, query, and diagnostics facades - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Analysis, query, and diagnostics facades - Design model](./articles/design-model/)
- [Analysis, query, and diagnostics facades - Examples](./articles/examples/)
- [Analysis, query, and diagnostics facades - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Analysis, query, and diagnostics facades - Flow and algorithm](./articles/flow-and-algorithm/)
- [Analysis, query, and diagnostics facades - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `1a6b81cfcc9be06761d035916d0414efd8722e8585f3a5584418f2ca3a1d82ca`

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

- `site/website/src/content/docs/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `a92d9d1f39dc03aa80f11ecf343eb3a28f57e21cd9e49994e898403ba37af7a4`

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

- `compiler/crates/beskid_analysis/src/analysis/`
- `compiler/crates/beskid_analysis/src/resolve/`
- `compiler/crates/beskid_lsp/src/diagnostics.rs`
``````

</details>

### Source Record: Primary contract for Analysis, query, and diagnostics facades

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/adr/0003-primary-contract-choice/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/adr/0003-primary-contract-choice/content.md`  
**SHA-256:** `19b4d4d646796fdfed56880a29da63f80d53aa71064b04c7e6cae2521c23016d`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

This feature hub defines the normative contract for **`Beskid.Compiler.Query`** and **`Beskid.Compiler.Diagnostics`** (and related analysis facades) and links detailed articles.

## Decision

The reference compiler **must** implement Analysis, query, and diagnostics facades as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/src/analysis/`
- `compiler/crates/beskid_analysis/src/resolve/`
- `compiler/crates/beskid_lsp/src/diagnostics.rs`
``````

</details>

### Source Record: SharedResolution entry query bundle

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/adr/0004-shared-resolution-query-bundle/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/adr/0004-shared-resolution-query-bundle/content.md`  
**SHA-256:** `811c20acb8dce4681da37f99f15a845c5c007e6228c8fbbd6a109d345f05bb8c`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

`beskid_queries` exports `SharedResolution(Arc<Resolution>)` but tooling historically read raw `Resolution` from `FrontEndTypedResult` or `DocumentAnalysisSnapshot`. Callers that need symbol registry lookups duplicated `symbol_lookup` imports or skipped registry-aware paths entirely.

Full `prepare_compilation` / typecheck is heavier than LSP or doc paths that only need assembly-backed entry resolve.

## Decision

1. **`SharedResolution`** wraps `Arc<Resolution>` and exposes thin delegates: `symbols()`, `by_symbol()`, `symbol_for_item`, `item_id_for_symbol`, `canonical_item_id`, `qualified_name` (no duplicated registry logic).

2. **`entry_resolution_with_db`** in `beskid_queries::entry` runs the assembly + `ModuleIndex::resolve_entry_hir` spine and returns `SharedResolution` **without** typing the entry program.

3. **`typed_entry_bundle`** remains the executable path; resolution-only callers **should** prefer `entry_resolution_with_db` when type results are not needed.

IDE document analysis continues to use `DocumentAnalysisSnapshot.resolution`; registry invariants are the same `Resolution` product described in [D-COMP-SEM-0016](/platform-spec/compiler/semantic-pipeline/resolver-contract/adr/0005-package-prefixed-symbol-identity/).

## Consequences

- Incremental hosts can memoize entry resolution separately from typed HIR when safe.
- Tests assert non-empty `by_symbol` on fixture projects after `entry_resolution_with_db`.

## Verification anchors

- `compiler/crates/beskid_queries/src/output.rs`
- `compiler/crates/beskid_queries/src/entry.rs`
- `compiler/crates/beskid_queries/tests/incremental.rs`
``````

</details>

### Source Record: Analysis, query, and diagnostics facades - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `840378fe7192bad66863eee4ff44cd8f4dbac4a786e8f9d250467c83cf508251`

<details>
<summary>Migrated source text</summary>

``````markdown
This article states **contracts and edge cases** for **Analysis, query, and diagnostics facades**.

## Hard requirements
- **Deterministic ordering** — discovery and execution order must be reproducible from equal inputs (path-normalized roots, sorted files, stable tie-breaks).
- **Bounded work** — host enforces step limits, allocation caps, and recursion depth across nested meta calls.
- **Versioned facades** — `Beskid.Compiler` surface is tied to compiler language version tokens exposed on the compilation instance.

## Edge cases
- **Partial programs** — facades must tolerate incomplete syntax where the language permits; diagnostics are preferred over host panics.
- **Conflicting edits** — multiple meta contributors touching the same declaration identity produce a deterministic merge failure surfaced as structured diagnostics.
``````

</details>

### Source Record: Analysis, query, and diagnostics facades - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/articles/design-model/content.md`  
**SHA-256:** `321b9b9e62559e1a611c626ac41c0189e4a441b2e1ed7d55df591560da6ae744`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents the **design model** for **Analysis, query, and diagnostics facades**.

## Language alignment
**Process** pipelines express fluent queries that lower to bounded Rust walkers; **Diagnostics** raised here must use compiler-stable codes for parity with `beskid_analysis` / LSP.

## Persistent entities
- **Compilation instance** — implicit handle to the compilation under construction (**[Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/)** / `Beskid.Compiler.Compilation`). In the reference Rust host this maps to **`beskid_queries::BeskidDatabase`** query groups (unit, graph, entry, mod-host).
- **Syntax snapshot** — immutable tree with stable node identities suitable for incremental keys.
- **Capability tokens** — host-granted permissions for I/O, diagnostics, and emit operations during mod execution.

## Salsa query groups (reference host)

| Group | Queries | Invalidated when |
| --- | --- | --- |
| **Inputs** | `file_text`, `ProjectSession`, `GrammarRevision` | buffer edit, lockfile/manifest change, grammar bump |
| **Unit** | `parse_and_expand_unit`, `unit_hir`, `unit_imports` | owning file text |
| **Graph** | `discovered_units`, `module_index_fingerprint`, `program_assembly` | discovery inputs or any unit in closure |
| **Entry** | `prepare_compilation_*`, `semantic_snapshot`, `typed_entry_bundle`, **`entry_resolution_with_db`** | entry file, mod invalidation keys, assembly |
| **Mod host** | `mod_generate`, syntax/manifest/capability ids | per [incremental scheduling](/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/) |

## Boundaries
- Mod SDK facades never bypass the host bridge for effects.
- Generation logic in the reference compiler remains Rust-internal; Beskid sees only the generated `Beskid.Compiler.*` projection.

## Shared resolution products

`beskid_queries::SharedResolution` wraps `Arc<Resolution>` and exposes symbol registry helpers (`symbol_for_item`, `by_symbol`, `qualified_name`, …) without cloning the full resolution table. **`entry_resolution_with_db`** returns this product after assembly + entry resolve **without** running the type checker — for tooling that needs registry-backed identity only ([D-COMP-MODS-0019](/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/adr/0004-shared-resolution-query-bundle/)).

IDE LSP paths use the same `Resolution` bundle via `DocumentAnalysisSnapshot`; symbol invariants match [resolver design model](/platform-spec/compiler/semantic-pipeline/resolver-contract/design-model/).

## Debounced typed entry bundle (LSP / IDE)

The reference host separates **immediate** graph inputs from **debounced** Executable prepare so IDE latency stays bounded while diagnostics and compile commands share one spine.

| Input | Tracks | Invalidated by |
| --- | --- | --- |
| **File revision** | `file_text` / buffer hash in `BeskidDatabase` | every `didChange` |
| **Typed prepare revision** | debounced background bump (120ms coalescing with diagnostic publish) | scheduled after edit pause |
| **Assembly generation** | `program_assembly` Salsa key | discovery, imports, manifest/lock |

**Algorithm**

1. On buffer edit, update `file_text` immediately; rebuild parse-level `DocumentAnalysisSnapshot` using `entry_resolution_with_db` when assembly is warm.
2. Schedule debounced typed prepare; superseded tasks no-op per URI revision counter.
3. On debounce fire, run `typed_entry_bundle` (Executable prepare, `with_semantic_diagnostics: false` for intellisense-only consumers) and store `SharedFrontEnd` keyed by entry session fingerprint + syntax generation id.
4. While typed output is stale, IDE queries **must** use `entry_resolution_with_db` (`SharedResolution`) — never a parallel resolver path.
5. Diagnostics **must** call `prepare_compilation_diagnostics_with_db` (full prepare with diagnostic collection) on publish, not legacy `analyze_source_in_project` / `analyze_source_with_compilation_context` helpers.

Typed bundle invalidation **must** include import-closure dependents, mod-host generation keys, and grammar revision bumps aligned with **[Snapshot and refresh contract](/platform-spec/tooling/lsp/snapshot-and-refresh-contract/)**.

## Anchored code paths
- `compiler/crates/beskid_queries/src/output.rs` — `SharedResolution`
- `compiler/crates/beskid_queries/src/entry.rs` — `entry_resolution_with_db`, `typed_entry_bundle`, `prepare_compilation_diagnostics_with_db`
- `compiler/crates/beskid_analysis/src/analysis/` — staged rules and semantic state.
- `compiler/crates/beskid_analysis/src/resolve/` — resolution products queryable from facades.
- `compiler/crates/beskid_lsp/src/diagnostics.rs` — diagnostic shaping for editor parity.

## Diagnostic parity rules

`Beskid.Compiler.Diagnostics` (and internal meta emitters) **must**:

1. Emit `SemanticDiagnostic` values compatible with `run_rules` output (same severity enum, string diagnostic codes matching registered ids).
2. Allocate mod and mod-host codes only inside **E1801–E1899** using the sub-ranges in **[Diagnostic code registry / design model](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/)**; register each code in `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs` when introduced.
3. Never bypass `span_to_sourcespan` / miette adapters used elsewhere so LSP label offsets remain accurate.

## Query lowering and bounded walkers

Fluent **`Beskid.Compiler.Query`** plans **must** lower to explicit Rust walkers with **documented** upper bounds on work (max nodes visited, max depth). Hosts **must** abort with diagnostics (not panics) when bounds trip. Optional **`query_semantic_snapshot`** reads **must** declare the minimum staged snapshot version (ties to `semantic.snapshot` events in **[Compiler Mods](/platform-spec/compiler/compiler-mods/)** area hub).

When the **Rust compiler** maintains compile-time **composition / IoC** state for user programs ([Native dependency injection](/platform-spec/language-meta/composition/dependency-injection/)), that state **must** be materialized into the same **versioned semantic snapshot** family as other staged products (exported after **`composition.resolve`**) so mod analyzers can query it without special casing: Mod SDK query types **project** compiler-native graphs into Beskid-visible handles; they **must not** recompute or replace Rust-owned resolution unless a dedicated, separately specified capability allows a narrow, audited code path.

## `Beskid.Compiler.Query` surface (normative)

Facade version **`0.4.0`** (see `QueryFacadeVersion()`). All functions lower to `beskid_analysis::query` walkers over a host-built **`SyntaxSnapshot`**.

| Type / function | Semantics |
| --- | --- |
| **`NodeRef`** | `{ syntaxGenerationId, nodeId }` — opaque, host-allocated, stable within a generation window |
| **`NodeSpan`** | `{ start, end, lineStart, columnStart, lineEnd, columnEnd }` for one node in one syntax generation |
| **`QueryBounds`** | `{ maxNodes, maxDepth }` — default host caps apply when zero |
| **`SyntaxQuery`** | Cursor at `start` with bounds |
| **`At` / `AtProgram`** | Entry from `NodeRef` or `Program` root |
| **`Descendants`** | Pre-order traversal (same order as Rust `Descendants`) |
| **`Children`** | Direct children only |
| **`Parent` / `Ancestors`** | Immediate parent and root-to-parent chain via snapshot parent table |
| **`Span` / `TrySpan`** | Required span lookup and optional span lookup for a `NodeRef` |
| **`OfKind` / `FindFirst`** | Filter by `Beskid.Syntax.Nodes.NodeKind` |
| **`As*`** | Host downcast to concrete mirrored type (one helper per kind with a shape type) |
| **`Walk` + `SyntaxVisitor`** | Depth-first enter/exit (maps to `AstWalker`) |
| **`SyntaxPipeline`** | Query-driven transformation plan over `NodeRef` selections |
| **`Select` + `WhereKind`** | Build a deterministic selection set from a root query |
| **`Replace` / `Remove` / `InsertBefore` / `InsertAfter`** | Minimal rewrite operations over selected `NodeRef`s |
| **`Apply`** | Validates and commits a pipeline as one host operation |

**Bound trip** — When `maxNodes` or `maxDepth` is exceeded, the host **must** stop iteration, return no further nodes from that query, and emit diagnostic **E1880** (`QueryBoundsExceeded`). **Must not** panic.

**Traversal vs rewrite** — Mod analyzers traverse with **`NodeRef`** only; **`Rewriter`** still receives concrete mirrored source/target types from the host after `As*` validation.

## Span and pipeline invariants

- `Span(nodeRef)` **must** succeed when `nodeRef.syntaxGenerationId` matches the active snapshot generation and `nodeId` resolves; otherwise host emits **E1882** and returns an empty/default result per facade contract.
- `TrySpan(nodeRef)` **must** never emit diagnostics and returns `none` for stale or unknown refs.
- Pipeline application is **deterministic**: operations are ordered by snapshot pre-order index, then by operation kind precedence (`Remove`, `Replace`, `InsertBefore`, `InsertAfter`).
- Hosts **must** reject conflicting operations over the same anchor with **E1883** (`QueryPipelineConflict`) instead of implicit overwrite behavior.
- Hosts **must** reject generation-stale pipeline handles with **E1884** (`QueryPipelineStaleGeneration`) and keep the previous committed snapshot unchanged.
``````

</details>

### Source Record: Analysis, query, and diagnostics facades - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/articles/examples/content.md`  
**SHA-256:** `e8e86e46411fa127bffce771cdbc2b292d67372e271c10b9ffb2d543c0952a1c`

<details>
<summary>Migrated source text</summary>

``````markdown
This article collects **examples** for **Analysis, query, and diagnostics facades** (informative sketches aligned with contracts).

## Example A — Descendants and parent (informative)

```beskid
// Find first function under program; walk to enclosing module item.
let query = Beskid.Compiler.Query.AtProgram(program);
let funcRef = Beskid.Compiler.Query.FindFirst(query, Beskid.Syntax.Nodes.NodeKind.FunctionDefinition);
if funcRef is some(ref) {
    let parent = Beskid.Compiler.Query.Parent(ref);
    // parent is NodeRef of enclosing item, not a variant match on enum Node
}
```

## Example B — Minimal diagnostic query
A compile-time module reads a syntax attribute using `OfKind` + `AsAttributeDeclaration`, then emits a diagnostic without mutating syntax.

## Example C — Emitter sketch
A contributor constructs a new method declaration through `Beskid.Compiler.Emit`, attaches trivia, and registers it with the incremental graph.

> Executable snippets will track the reference implementation as mod host execution lands in the compiler; until then, treat these as specification fixtures.
``````

</details>

### Source Record: Analysis, query, and diagnostics facades - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `e257807bbe2393a68c48a2c893ae15e5ffc8d6c923274a4e97bcc1275e2fa177`

<details>
<summary>Migrated source text</summary>

``````markdown
This article collects **FAQ** entries for **Analysis, query, and diagnostics facades**.

## Why separate language-meta and compiler pages?
Language-meta defines Beskid-side mod contracts; this compiler area defines how the Rust host executes them safely and incrementally.

## Can meta call arbitrary FFI?
No — unless explicitly granted by platform policy and declared in compilation capabilities. Default contracts deny ambient FFI.

## Where do Roslyn/KSP parallels apply?
Only as rationale for incremental caches and typed models; Beskid contracts are authoritative here, not foreign tool behavior.
``````

</details>

### Source Record: Analysis, query, and diagnostics facades - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/articles/flow-and-algorithm/content.md`  
**SHA-256:** `a9f7df87935dea4dd9c63b1119e8df47428a23c1cf27e9112aa3c6bf0c36ac9b`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **flow and algorithms** for **Analysis, query, and diagnostics facades**.

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

### Source Record: Analysis, query, and diagnostics facades - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/articles/verification-and-traceability/content.md`  
**SHA-256:** `e152fb16f64b6d628f83b2e7ab998f1c0e0ae143f8677cfb5b12a0df65bd19b2`

<details>
<summary>Migrated source text</summary>

``````markdown
This article documents **verification and traceability** for **Analysis, query, and diagnostics facades**.

## Traceability matrix
- Anchor: `compiler/crates/beskid_analysis/src/analysis/` — staged rules and semantic state.
- Anchor: `compiler/crates/beskid_analysis/src/resolve/` — resolution products queryable from facades.
- Anchor: `compiler/crates/beskid_lsp/src/diagnostics.rs` — diagnostic shaping for editor parity.

## Verification expectations
- Contract tests in `compiler/crates/beskid_tests` assert ordering, diagnostic codes, and merge behavior once implemented.
- Golden incremental traces (optional) validate invalidation when syntax edits move spans tied to meta registrations.

## Review cadence
- Update this bundle whenever public `Beskid.Compiler.*` shapes or host policies change.
``````

</details>
