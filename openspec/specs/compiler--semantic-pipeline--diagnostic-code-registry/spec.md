<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Diagnostic code registry Specification

## Purpose

Registry contract for semantic diagnostic code ownership and synchronization with compiler sources.

## Requirements

### Requirement: Feature hub authority: Decision [D-COMP-SEM-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **owns** normative MUST/SHOULD contract text. Sibling articles **must not** redefine hub requirements and **should** link here for authority.

**Stable ID:** `BSP-REQ-1F3AB2963760`  
**Legacy source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0001-feature-hub-authority/content.md`  
**Source SHA-256:** `e8135c0b87c948d578f9b73d4193ca432d44d4df6a66c35e02a57ee3ce03720b`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification over implementation notes: Decision [D-COMP-SEM-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Normative platform-spec prose and ADRs under this feature **supersede** informal comments in implementation crates until explicitly migrated into spec text.

**Stable ID:** `BSP-REQ-CD3431381590`  
**Legacy source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0002-spec-over-implementation-notes/content.md`  
**Source SHA-256:** `02b8a7438ebb7798fed5ad09405420789581fc9e7df20f6d3fd5eb58d1a8caa2`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Diagnostic codes owned in analysis sources: Decision [D-COMP-SEM-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Code-to-meaning mapping is normative in `SemanticIssueKind::code()` and `diagnostic_kinds.rs`, synchronized with trudoc verify scripts—not LSP presentation layers.

**Stable ID:** `BSP-REQ-072159A73908`  
**Legacy source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0003-codes-owned-in-analysis/content.md`  
**Source SHA-256:** `9fae97e060b40dbd98e9baab68cf2cb1750678234b351c383f784313fd206180`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Diagnostic code registry

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/content.md`  
**SHA-256:** `932e34eb5144b88939b0ac2c42ca67f236795d9a21602db68f6c5dda86f018fd`

<details>
<summary>Migrated source text</summary>

``````markdown
## What this feature governs

This feature defines ownership and evolution rules for semantic diagnostic codes in `SemanticIssueKind::code()` and neighboring catalog logic. It keeps diagnostics stable for tooling, docs, and conformance references.

## Core guarantees

1. Diagnostic code-to-meaning mapping is normative in compiler source, not in rendering layers.
2. New semantic issues must use unique, documented codes before release.
3. Registry updates must remain synchronized with platform-spec documentation and verification scripts.
4. Renaming or reusing existing codes requires explicit migration handling for downstream consumers.

## Implementation anchors

- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- `compiler/crates/beskid_analysis/src/analysis`
- `compiler/crates/beskid_analysis/src/doc/validate.rs`
- `compiler/crates/beskid_analysis/src/services/`
- `packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs`
## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMP-SEM-0001` … `D-COMP-SEM-0003`); use the reader **ADRs** tab for expandable detail.
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
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0001-feature-hub-authority/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0001-feature-hub-authority/content.md`  
**SHA-256:** `e8135c0b87c948d578f9b73d4193ca432d44d4df6a66c35e02a57ee3ce03720b`

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

- `site/website/src/content/docs/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/index.mdx`
- `article bundle under the same feature directory.`
``````

</details>

### Source Record: Specification over implementation notes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0002-spec-over-implementation-notes/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0002-spec-over-implementation-notes/content.md`  
**SHA-256:** `02b8a7438ebb7798fed5ad09405420789581fc9e7df20f6d3fd5eb58d1a8caa2`

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

- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- `compiler/crates/beskid_analysis/src/analysis`
- `compiler/crates/beskid_analysis/src/doc/validate.rs`
``````

</details>

### Source Record: Diagnostic codes owned in analysis sources

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0003-codes-owned-in-analysis/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/adr/0003-codes-owned-in-analysis/content.md`  
**SHA-256:** `9fae97e060b40dbd98e9baab68cf2cb1750678234b351c383f784313fd206180`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Rendered diagnostics drifted from semantic registry.

## Decision

Code-to-meaning mapping is normative in `SemanticIssueKind::code()` and `diagnostic_kinds.rs`, synchronized with trudoc verify scripts—not LSP presentation layers.

## Consequences

Renaming codes requires migration notes; new issues need unique codes before release.

## Verification anchors

- `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- `packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs`.
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `b5eb836c3af234c01314fd3bb44db0ec7ddd6ee67ca6dbef31ba067b7ca65ff4`

<details>
<summary>Migrated source text</summary>

``````markdown
Registry contracts:

- Codes must be unique and semantically stable once published.
- Rules may evolve messages, but not silently repurpose existing codes.
- Deprecated codes should remain documented until consumer migration is complete.

Edge cases:

- Splitting one broad issue into multiple specific codes can break external filters.
- Merging codes can hide important distinctions used by editor workflows.
- Reordering kinds without preserving explicit mappings may create accidental code churn.
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/design-model/content.md`  
**SHA-256:** `dde25b646ee45fd7989c2556e09942643e93b49e889d8160a7d30a40a7dca594`

<details>
<summary>Migrated source text</summary>

``````markdown
The registry model is intentionally centralized:

- `diagnostic_kinds.rs` owns code identities and semantic categories.
- Rule modules reference kinds, not hard-coded code strings.
- Delivery adapters (CLI/LSP) preserve code identity while formatting messages.

This avoids drift between compiler internals and platform documentation, and it makes diagnostics easier to consume in editors and CI tooling.

## Mod, manifest, and mod-host band (**E1801–E1899**)

The inclusive range **E1801–E1899** is owned by compiler-mod manifest validation and mod-host failures. Ordinary semantic rules must not allocate inside this band. Register each allocated code in `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs` and extend this table in the same change.

| Code range | Owner | Intended failures (examples) |
| --- | --- | --- |
| **E1801–E1810** | `beskid_analysis::projects` manifest parse | Unknown `mod` key, invalid `maxGeneratorRounds`, malformed capabilities list, Meta→Mod migration (see table below). |
| **E1811–E1820** | Workspace / graph resolution | Invalid Mod dependency topology, unresolved mod package, incompatible host/mod graph constraints. |
| **E1821–E1835** | Mod host / capabilities | Denied capability, exceeded `maxGeneratorRounds`, sandbox violation, AOT artifact load/bootstrap failure (see **[AOT artifact contract](/platform-spec/compiler/compiler-mods/mod-host-bridge/aot-artifact-contract/)**). |
| **E1836–E1850** | Typed merge / rewrite | Conflicting generator edits, illegal typed contribution, invalid typed rewrite, merge rollback. |
| **E1851–E1870** | Contract discovery / execution | Missing required contracts, invalid contract signatures, collector scope violations, analyzer/rewriter registration errors. |
| **E1871–E1899** | **Reserved** / Bsol project shape | Buffer for staged rollout; allocate in order and extend this table when used. **E1886–E1888** are allocated to Bsol project-shape validation (see sub-table below). |

### Meta→Mod migration and manifest parse (**E1801–E1810**, normative)

| Code | When emitted |
| --- | --- |
| **E1801** | Unknown key inside `project.mod`. |
| **E1802** | `maxGeneratorRounds` missing, non-positive, or not an integer. |
| **E1803** | `capabilities` entry not in the closed vocabulary. |
| **E1804** | `artifactPolicy` value not in `reuse` / `rebuild` / `clean_rebuild`. |
| **E1805** | `type: Mod` project declares a `target` block (forbidden). |
| **E1806** | Compiler-mod `contract` item declared outside a `type: Mod` project. |
| **E1807** | Deprecated `type: Meta` or nested `meta { }` manifest section (use `Mod` / `mod { }`). |
| **E1808** | Removed `attachTo` key on mod/manifest (use `Collector` scope). |
| **E1809** | Removed `entryModules` key (use contract discovery). |
| **E1810** | Legacy `max_meta_rounds` or other removed mod keys. |

### Mod artifact load (**E1821–E1835**, normative)

Individual codes are defined in **[Mod host bridge / AOT artifact contract](/platform-spec/compiler/compiler-mods/mod-host-bridge/aot-artifact-contract/)** (**E1821** missing artifact through **E1835** bootstrap catch-all). Hosts **must** prefer the most specific code before **E1835**.

### Typed merge (**E1836–E1850**, normative)

| Code | When emitted |
| --- | --- |
| **E1836** | Two generators target the same declaration identity in one generation round. |
| **E1837** | Typed contribution fails well-formedness / parser re-check after merge. |
| **E1838** | `Rewriter` returned an illegal target node kind. |
| **E1839** | Merge rolled back — syntax tree unchanged after failure. |
| **E1840–E1850** | **Reserved** for additional merge/rewrite failures. |

### Contract discovery (**E1851–E1870**, normative)

| Code | When emitted |
| --- | --- |
| **E1851** | Module-level `meta` item or other forbidden grammar in a Mod/host compilation unit. |
| **E1852** | Required `Collector` contract missing from artifact registrations. |
| **E1853** | `contractId` in descriptor not recognized by host. |
| **E1854** | Public type does not implement declared `contractId`. |
| **E1855** | `entrySymbol` missing from native export table. |
| **E1856** | Collector scope references unresolved compilation member. |
| **E1857** | Analyzer registration conflicts with capability set. |
| **E1858** | Rewriter generic instantiation does not match source node kind. |
| **E1859–E1870** | **Reserved** for contract execution failures. |

### Bsol project shape (**E1886–E1888**, normative)

Bsol project-shape validation emits these codes from `beskid_analysis::projects` (manifest validator and compile-plan builder). They use the `ProjectError::meta_contract` string-code pattern, consistent with the rest of the E1801–E1899 manifest band.

| Code | When emitted |
| --- | --- |
| **E1886** | `type = Bsol` project declares a `target` block (forbidden — schema packages are not compile roots). |
| **E1887** | `type = Bsol` project has no nested `schemas { export ... }` block. |
| **E1888** | A `beskid build` targets a `Bsol` project (use `beskid validate-bsol` instead). |

## Language macro expansion (**E1901–E1999**)

The inclusive range **E1901–E1999** is owned by **`macro.expand`** and macro definition validation. Ordinary semantic rules must not allocate inside this band.

| Code | When emitted |
| --- | --- |
| **E1901** | `name!` invocation with no resolving `macro` binding in scope. |
| **E1902** | Argument count does not match macro parameter list. |
| **E1903** | Actual argument shape does not match declared fragment kind. |
| **E1904** | **`$param`** reference in a non-macro body or unknown parameter name. |
| **E1905** | **`maxMacroExpansionDepth`** exceeded (default 32). |
| **E1906** | Expanded tree fails well-formedness / structural validation. |
| **E1907** | Ambiguous macro name (multiple `macro` bindings in scope). |
| **E1908** | `macro` definition with duplicate parameter names. |
| **E1909** | Invalid or unknown fragment kind keyword in macro parameter list. |
| **E1910–E1999** | **Reserved** for macro hygiene and item-splice failures. |

See **[Language macros](/platform-spec/language-meta/metaprogramming/macros/)**.

## Project template scaffolding (**E2001–E2099**)

The inclusive range **E2001–E2099** is owned by the project template engine (`beskid_template`). Ordinary semantic rules must not allocate inside this band.

| Code | When emitted |
| --- | --- |
| **E2001** | Template manifest missing or invalid schema. |
| **E2002** | Package kind is not `template`. |
| **E2003** | Required symbol not provided. |
| **E2004** | Output path conflict. |
| **E2005** | Item template outside project root. |
| **E2006** | GUID replacement incomplete. |
| **E2007** | Git template source failed. |
| **E2008** | Workspace template invalid member graph. |
| **E2099** | Reserved internal template engine error. |
| **E2009–E2098** | **Reserved** for future template-engine diagnostics. |

See **[Project templates](/platform-spec/tooling/project-scaffolding/project-templates/)**.

## Documentation comment diagnostics (**W1610–W1619**, **W1620–W1625**)

The inclusive ranges **W1610–W1619** and **W1620–W1625** are reserved for **leading documentation body** validation (triple-slash mini-language: `@ref`, `@arg`, `@returns`, `@variant`, `@par`, and unknown directives). These warnings are produced from the document-analysis snapshot after name resolution succeeds; they **must not** use ad hoc string codes outside `SemanticIssueKind`. Hard errors for documentation are **not** allocated in v1; if a future policy introduces blocking documentation failures, allocate **E1610–E1629** in this document and in `diagnostic_kinds.rs` before use.

| Code | Meaning (summary) |
| --- | --- |
| **W1610** | `@arg` names a parameter that does not exist on the documented callable. |
| **W1611** | Duplicate `@arg(name)` for the same item. |
| **W1612** | `@arg` / `@returns` on an item that is not a supported callable. |
| **W1613** | `@returns` on a `unit` return (redundant). |
| **W1614** | Unknown documentation directive (`@foo` not in the supported registry). |
| **W1615** | Unresolved `@ref(...)` path. |
| **W1616–W1619** | **Reserved** for documentation-quality rules. |
| **W1620** | `@variant(...)` used outside an enum declaration’s leading documentation. |
| **W1621** | `@variant(name)` does not match any enum variant. |
| **W1622** | Duplicate `@variant(name)` in the same block. |
| **W1623** | `@par(...)` where the declaration has no generic type parameters. |
| **W1624** | `@par(name)` does not match a generic type parameter on the item. |
| **W1625** | Duplicate `@par(name)` in the same block. |

## Code style and naming (**W1630–W1639**)

The inclusive range **W1630–W1639** is owned by **[Code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/)**. These warnings **should** be produced by style lint rules after name resolution; they **must not** use ad hoc string codes outside `SemanticIssueKind`.

| Code | Meaning (summary) |
| --- | --- |
| **W1630** | `type`, `enum`, or `contract` name is not **PascalCase** |
| **W1631** | Enum variant name is not **PascalCase** |
| **W1632** | Type field or named variant payload field is not **lowerCamelCase** |
| **W1633** | Function or type method name is not **PascalCase** |
| **W1634** | Module path segment is not **PascalCase** |
| **W1635** | Generic type parameter is not **PascalCase** |
| **W1636** | Parameter or local binding is not **lowerCamelCase** (except `self`) |
| **W1637** | `test` name is not **snake_case** |
| **W1638** | `macro` name is not **lowerCamelCase** |
| **W1639** | **Reserved** |

Codes **must** be stable across patch releases once shipped; breaking message text is allowed only with a migration note in **[Rules and diagnostics catalog](/platform-spec/compiler/semantic-pipeline/rules-and-diagnostics-catalog/)**.

## User FFI diagnostics (**E1520–E1539**, v0.3)

The inclusive range **E1520–E1539** is owned by **[FFI and extern](/platform-spec/language-meta/interop/ffi-and-extern/)** and **[Export and callbacks](/platform-spec/language-meta/interop/export-and-callbacks/)** validation. These codes are **normative in platform-spec v0.3**; the reference compiler may still emit legacy **`T0901–T0904`** until migration completes—tests **must** accept either code during the transition, then **only E152x** once `diagnostic_kinds.rs` maps `TypeError::Extern*` to `SemanticIssueKind`.

| Code | When emitted | Reference compiler (transition) |
| --- | --- | --- |
| **E1520** | `Extern` **`Abi`** is not **`"C"`** | **T0901** |
| **E1521** | `Extern` contract missing non-empty **`Library`** | **T0902** |
| **E1522** | Disallowed parameter type on extern method | **T0903** |
| **E1523** | Disallowed return type on extern method | **T0904** |
| **E1524** | **`Export`** on non-`pub` function or disallowed item | *(planned)* |
| **E1525** | **`Export`** signature uses disallowed FFI type | *(planned)* |
| **E1526** | Unknown **`Symbol`** override or duplicate export symbol | *(planned)* |
| **E1527** | **`Transfer`** / interop view misuse at boundary | *(planned)* |
| **E1528** | **`CLayout`** violation (v0.3.1) | *(planned)* |
| **E1529** | Callback type is not a permitted function-pointer shape | *(planned)* |
| **E1530–E1539** | **Reserved** | Buffer for link manifest and import CLI failures |

Attribute placement errors remain in the **E1508–E1510** band (**E1510** = `Extern` on non-contract).
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/examples/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/examples/content.md`  
**SHA-256:** `07f90723d78fee75594d2ca182f5dafa680f83a8d1b97884888d18a36dd7b033`

<details>
<summary>Migrated source text</summary>

``````markdown
Example A: adding a new semantic issue

1. Add a new issue kind and code in `diagnostic_kinds.rs`.
2. Emit it from the relevant staged rule.
3. Add/update docs and sync checks.
4. Verify CLI and LSP both expose the new code.

Example B: deprecating an old code

1. Keep legacy code mapping documented.
2. Route rule output to a replacement code behind an explicit migration step.
3. Update troubleshooting notes for users with code-based alerting.
``````

</details>

### Source Record: FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `b295587a5df3b500dafe31225f4ee65af199b009accacbbbaeacf2c55cebf85d`

<details>
<summary>Migrated source text</summary>

``````markdown
### A new rule compiles, but docs sync fails. Why?

The rule likely emits a kind not represented in the documented registry mapping. Update both source and docs references together.

### Can I rename an existing diagnostic code?

Treat code renames as migrations, not inline edits. Preserve compatibility notes and update downstream filters before removing old identifiers.

### Where do I debug code mismatch between CLI and editor?

Start with `diagnostic_kinds.rs`, then check conversion in analysis services and LSP diagnostics adapters to ensure code strings are passed through unchanged.
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/flow-and-algorithm/content.md`  
**SHA-256:** `3d0697d635772a7b17dd7798f2a50dfe561edc9a7493386ab67935d486d5d167`

<details>
<summary>Migrated source text</summary>

``````markdown
Code lifecycle algorithm:

1. Define or reuse an issue kind in `diagnostic_kinds.rs`.
2. Emit that kind from a semantic rule in `analysis/rules`.
3. Convert issue kind to stable code/category payload.
4. Surface payload through services to CLI and LSP.
5. Validate docs and source sync with diagnostics verification scripts.

The code identity must survive every handoff unchanged, even when message templates differ between clients.
``````

</details>

### Source Record: Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/articles/verification-and-traceability/content.md`  
**SHA-256:** `41f8db35bc1ed3accbc40575eeb2982a53d2c54ba8f8d315e2c04ef291a09ee1`

<details>
<summary>Migrated source text</summary>

``````markdown
Traceability anchors:

- Source of truth: `compiler/crates/beskid_analysis/src/analysis/diagnostic_kinds.rs`
- Rule emitters: `compiler/crates/beskid_analysis/src/analysis/rules`
- Verification script: `packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs`

Suggested verification path:

1. Run semantic tests after registry changes.
2. Run diagnostic spec synchronization (`packages/trudoc/scripts/verify-diagnostics-spec-sync.mjs` via the website/trudoc verify scripts).
3. Validate at least one CLI and one LSP diagnostics scenario to confirm code identity parity.
``````

</details>
