<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Glossary and conformance Specification

## Purpose

Defines MUST / SHOULD / MAY usage across all Beskid specifications. Every diagnostic and platform RFC should reference this vocabulary consistently.

## Requirements

### Requirement: Glossary and conformance: Normative specification [language-meta/conformance/glossary-and-conformance]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This chapter is the **normative vocabulary** for all Beskid platform specifications. Other `language-meta` articles, compiler features, execution contracts, and core-library packages **must** use these terms and requirement keywords consistently. Informative material (book, guides, workshop notes) **must not** override text marked `Standard` here.
> 
> ### Scope
> 
> - **In scope:** requirement keywords (RFC 2119 profile), Beskid **conformance levels**, maturity of spec pages, diagnostic severity vocabulary, and cross-domain authority boundaries.
> - **Out of scope:** compiler pipeline ordering, manifest schema keys, and runtime ABI details (owned by sibling domains; they **must** defer to `language-meta` for user-visible semantics).
> 
> ### Requirement keywords (RFC 2119)
> 
> The keywords **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in normative sections are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) (BCP 14).
> 
> | Keyword | Meaning in Beskid specs |
> | --- | --- |
> | **MUST** / **REQUIRED** / **SHALL** | Absolute requirement for conformance at the stated level |
> | **MUST NOT** / **SHALL NOT** | Absolute prohibition |
> | **SHOULD** / **RECOMMENDED** | Strong default; deviation requires explicit rationale in `## Decisions
> <!-- spec:generate:adr-index -->
> No ADRs published under **`adr/`** yet.
> <!-- /spec:generate:adr-index -->
> 
> No ADRs published under **`adr/`** yet.
> <!-- /spec:generate:adr-index -->` |
> | **SHOULD NOT** | Strong discouragement; allowed only with documented exception |
> | **MAY** / **OPTIONAL** | Truly optional behavior or surface |
> 
> Normative sections **must** use uppercase keywords. Lowercase *must* in running prose is informative unless the sentence is inside a quoted normative rule.
> 
> ### Beskid conformance levels
> 
> Implementations are evaluated against **language-meta** (`Standard` articles) plus explicitly linked domain contracts.
> 
> | Level | Definition | Verification |
> | --- | --- | --- |
> | **L0 — Parse** | Accepts all programs in the v0.1 grammar without internal compiler failure | Parser + `beskid.pest` fixture suite |
> | **L1 — Name and module** | Resolves modules, imports, and visibility per [Modules and visibility](/platform-spec/language-meta/program-structure/modules-and-visibility/) and [Name resolution](/platform-spec/language-meta/program-structure/name-resolution/) | Resolver tests; E11xx band |
> | **L2 — Type** | Assigns types and rejects ill-typed programs per [Types](/platform-spec/language-meta/type-system/types/) and related chapters | `beskid_analysis` type tests; E12xx–E13xx |
> | **L3 — Semantic** | Enforces contracts, control flow, events, memory rules, and composition/DI where applicable | Semantic + composition tests; E14xx–E17xx |
> | **L4 — Executable** | Lowered program behavior matches execution + core-library contracts for the chosen target triple | Runtime tests, ABI checks |
> 
> A conforming **reference compiler** **must** reach **L3** for all `Standard` language-meta chapters in this repository snapshot. **L4** is claimed per target profile (native, WASM, etc.) in execution and core-library specs.
> 
> ### Specification maturity (`status`)
> 
> | `status` | Meaning |
> | --- | --- |
> | **Standard** | Enforceable MUST/SHOULD text; implementation and diagnostics **must** align or the page **must** be downgraded |
> | **Proposed** | Design in flux; implementations **may** diverge with tracked gaps |
> 
> A page marked **Standard** **must not** consist solely of navigation boilerplate or self-referential “canonical chapter” links. It **must** include a **Normative specification** section with testable rules.
> 
> ### Diagnostic vocabulary
> 
> | Term | Rule |
> | --- | --- |
> | **Error** (`E####`) | Denotes ill-formed or ill-typed program; compilation **must** fail |
> | **Warning** (`W####`) | Denotes suspicious but legal program; compilation **may** succeed |
> | **Note** | Informative attachment; never alone changes exit code |
> 
> Stable codes live in the [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/). Language-meta chapters cite **bands** (for example E11xx resolution); exact messages **may** evolve while codes remain stable.
> 
> ### Authority boundaries
> 
> | Domain | Owns | Must not redefine |
> | --- | --- | --- |
> | **language-meta** | User-visible syntax, types, evaluation, contracts, memory, testing surface | — |
> | **compiler** | Phases, IR, lowering, diagnostic emission mechanics | Language semantics |
> | **execution** | Schedulers, stacks, channels, runtime services | Type rules, `spawn` typing contract |
> | **core-library** | Host bases, concurrency types, console I/O packages | Grammar and name lookup |
> | **tooling** | CLI, LSP, manifest authoring UX | Resolution graph semantics (defer to compiler) |
> 
> Cross-domain pages **must** link to the owning `language-meta` chapter with `relation: defers-to` or `implements` in `relatedTopics`.
> 
> ### Definitions (selected)
> 
> | Term | Definition |
> | --- | --- |
> | **Program** | A finite sequence of `ItemWithDocs` forming a compilation unit per [Lexical and syntax](/platform-spec/language-meta/surface-syntax/lexical-and-syntax/) |
> | **Module** | A named namespace boundary introduced by `mod` or file-scoped `mod path;` |
> | **Type** | A static description of values; see [Types](/platform-spec/language-meta/type-system/types/) |
> | **Contract** | A surface of required members checked structurally; see [Contracts](/platform-spec/language-meta/contracts-and-effects/contracts/) |
> | **Fiber** | Cooperative task handle produced by `spawn`; see [Fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/) |
> | **Channel** | Cross-fiber communication primitive; memory sharing **must** go through channels per [Memory and references](/platform-spec/language-meta/memory-model/memory-and-references/) |
> | `Option<T>` | The sole optional-value surface in v0.1 (corelib `Query.Contracts.Option`); **must not** be spelled `optional` or `?T` |
> | `null` | **Must not** exist as a type, literal, or implicit default; absence uses `Option<T>::None` or explicit enums |
> | `mut` | Prefix modifier marking a reassignable local or parameter (`mut T name`, `let mut name`) |
> | **PascalCase** | Identifier profile for types, enums, contracts, variants, module segments, and callable members; see [Code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/) |
> | **lowerCamelCase** | Identifier profile for fields, parameters, locals, and macro names; see [Code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/) |
> | **GC heap** | Traced object store with concurrent mark-sweep; runtime details in execution specs; `/execution/` tree is a **non-normative legacy bridge** only |
> 
> ### Conformance of specifications themselves
> 
> Editors **must** update `lastReviewed` when normative text changes. Tier-1 language-meta chapters **must** include `## Decisions` for non-obvious choices. Verification anchors **should** name crate paths or test directories where the reference compiler enforces the rule.

**Stable ID:** `BSP-REQ-478851A47758`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/conformance/glossary-and-conformance/content.md`  
**Source SHA-256:** `8cbf88bc194357baa5d5ff28e2a05b964220bffcea175b34ddd0cf5616e546ab`

#### Scenario: Conformance exercises Normative specification
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Glossary and conformance

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/conformance/glossary-and-conformance/`  
**Source:** `site/spec-content/platform-spec/language-meta/conformance/glossary-and-conformance/content.md`  
**SHA-256:** `8cbf88bc194357baa5d5ff28e2a05b964220bffcea175b34ddd0cf5616e546ab`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative specification

This chapter is the **normative vocabulary** for all Beskid platform specifications. Other `language-meta` articles, compiler features, execution contracts, and core-library packages **must** use these terms and requirement keywords consistently. Informative material (book, guides, workshop notes) **must not** override text marked `Standard` here.

### Scope

- **In scope:** requirement keywords (RFC 2119 profile), Beskid **conformance levels**, maturity of spec pages, diagnostic severity vocabulary, and cross-domain authority boundaries.
- **Out of scope:** compiler pipeline ordering, manifest schema keys, and runtime ABI details (owned by sibling domains; they **must** defer to `language-meta` for user-visible semantics).

### Requirement keywords (RFC 2119)

The keywords **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in normative sections are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) (BCP 14).

| Keyword | Meaning in Beskid specs |
| --- | --- |
| **MUST** / **REQUIRED** / **SHALL** | Absolute requirement for conformance at the stated level |
| **MUST NOT** / **SHALL NOT** | Absolute prohibition |
| **SHOULD** / **RECOMMENDED** | Strong default; deviation requires explicit rationale in `## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->

No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->` |
| **SHOULD NOT** | Strong discouragement; allowed only with documented exception |
| **MAY** / **OPTIONAL** | Truly optional behavior or surface |

Normative sections **must** use uppercase keywords. Lowercase *must* in running prose is informative unless the sentence is inside a quoted normative rule.

### Beskid conformance levels

Implementations are evaluated against **language-meta** (`Standard` articles) plus explicitly linked domain contracts.

| Level | Definition | Verification |
| --- | --- | --- |
| **L0 — Parse** | Accepts all programs in the v0.1 grammar without internal compiler failure | Parser + `beskid.pest` fixture suite |
| **L1 — Name and module** | Resolves modules, imports, and visibility per [Modules and visibility](/platform-spec/language-meta/program-structure/modules-and-visibility/) and [Name resolution](/platform-spec/language-meta/program-structure/name-resolution/) | Resolver tests; E11xx band |
| **L2 — Type** | Assigns types and rejects ill-typed programs per [Types](/platform-spec/language-meta/type-system/types/) and related chapters | `beskid_analysis` type tests; E12xx–E13xx |
| **L3 — Semantic** | Enforces contracts, control flow, events, memory rules, and composition/DI where applicable | Semantic + composition tests; E14xx–E17xx |
| **L4 — Executable** | Lowered program behavior matches execution + core-library contracts for the chosen target triple | Runtime tests, ABI checks |

A conforming **reference compiler** **must** reach **L3** for all `Standard` language-meta chapters in this repository snapshot. **L4** is claimed per target profile (native, WASM, etc.) in execution and core-library specs.

### Specification maturity (`status`)

| `status` | Meaning |
| --- | --- |
| **Standard** | Enforceable MUST/SHOULD text; implementation and diagnostics **must** align or the page **must** be downgraded |
| **Proposed** | Design in flux; implementations **may** diverge with tracked gaps |

A page marked **Standard** **must not** consist solely of navigation boilerplate or self-referential “canonical chapter” links. It **must** include a **Normative specification** section with testable rules.

### Diagnostic vocabulary

| Term | Rule |
| --- | --- |
| **Error** (`E####`) | Denotes ill-formed or ill-typed program; compilation **must** fail |
| **Warning** (`W####`) | Denotes suspicious but legal program; compilation **may** succeed |
| **Note** | Informative attachment; never alone changes exit code |

Stable codes live in the [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/). Language-meta chapters cite **bands** (for example E11xx resolution); exact messages **may** evolve while codes remain stable.

### Authority boundaries

| Domain | Owns | Must not redefine |
| --- | --- | --- |
| **language-meta** | User-visible syntax, types, evaluation, contracts, memory, testing surface | — |
| **compiler** | Phases, IR, lowering, diagnostic emission mechanics | Language semantics |
| **execution** | Schedulers, stacks, channels, runtime services | Type rules, `spawn` typing contract |
| **core-library** | Host bases, concurrency types, console I/O packages | Grammar and name lookup |
| **tooling** | CLI, LSP, manifest authoring UX | Resolution graph semantics (defer to compiler) |

Cross-domain pages **must** link to the owning `language-meta` chapter with `relation: defers-to` or `implements` in `relatedTopics`.

### Definitions (selected)

| Term | Definition |
| --- | --- |
| **Program** | A finite sequence of `ItemWithDocs` forming a compilation unit per [Lexical and syntax](/platform-spec/language-meta/surface-syntax/lexical-and-syntax/) |
| **Module** | A named namespace boundary introduced by `mod` or file-scoped `mod path;` |
| **Type** | A static description of values; see [Types](/platform-spec/language-meta/type-system/types/) |
| **Contract** | A surface of required members checked structurally; see [Contracts](/platform-spec/language-meta/contracts-and-effects/contracts/) |
| **Fiber** | Cooperative task handle produced by `spawn`; see [Fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/) |
| **Channel** | Cross-fiber communication primitive; memory sharing **must** go through channels per [Memory and references](/platform-spec/language-meta/memory-model/memory-and-references/) |
| `Option<T>` | The sole optional-value surface in v0.1 (corelib `Query.Contracts.Option`); **must not** be spelled `optional` or `?T` |
| `null` | **Must not** exist as a type, literal, or implicit default; absence uses `Option<T>::None` or explicit enums |
| `mut` | Prefix modifier marking a reassignable local or parameter (`mut T name`, `let mut name`) |
| **PascalCase** | Identifier profile for types, enums, contracts, variants, module segments, and callable members; see [Code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/) |
| **lowerCamelCase** | Identifier profile for fields, parameters, locals, and macro names; see [Code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/) |
| **GC heap** | Traced object store with concurrent mark-sweep; runtime details in execution specs; `/execution/` tree is a **non-normative legacy bridge** only |

### Conformance of specifications themselves

Editors **must** update `lastReviewed` when normative text changes. Tier-1 language-meta chapters **must** include `## Decisions` for non-obvious choices. Verification anchors **should** name crate paths or test directories where the reference compiler enforces the rule.

## Decisions
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>
