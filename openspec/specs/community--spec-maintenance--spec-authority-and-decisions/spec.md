<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Specification authority and embedded decisions Specification

## Purpose

This specification defines normative rules for language law and implementation domains. The rules cover maturity (Proposed and Standard). The rules also cover embedded decision records in feature hubs and articles.

## Requirements

### Requirement: Specification authority and embedded decisions: Maturity — Proposed vs Standard [community/spec-maintenance/spec-authority-and-decisions]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding. Uppercase requirement keywords retain their BCP-14 meaning.

> | `status` | Meaning | Requirements |
> | --- | --- | --- |
> | **Proposed** | Incomplete, unstable, or under active design | May omit full verification anchors; **must not** be cited as enforceable language law in conformance arguments |
> | **Standard** | Enforceable platform contract | **Must** include normative MUST/SHOULD/MAY prose, verification anchors (tests, crates, or explicit registry links), and **`## Decisions`** on the feature hub (or a linked `decisions-record` article) |
> 
> Any **Standard** page that fails content gates (circular “canonical chapter” stubs, placeholder-only article bundles, missing decisions) **must** be downgraded to **Proposed** until restored.

**Stable ID:** `BSP-REQ-F7D3CBA9D423`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/spec-authority-and-decisions/content.md`  
**Source SHA-256:** `f8d0f2e321b4883becf6021aa1e6891013e0fbd44520cb458eed9483106f1664`

#### Scenario: Conformance exercises Maturity — Proposed vs Standard
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Language law lives only in language-meta: Decision [D-COMM-AUTH-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding. Uppercase requirement keywords retain their BCP-14 meaning.

> **Language law** — syntax, types, evaluation, contracts, memory, and cross-cutting language rules — **must** be defined only under [Language meta](/platform-spec/language-meta/), except where another domain page declares an explicit **cross-domain exception** and links to the owning language-meta chapter.

**Stable ID:** `BSP-REQ-1E90F18D6DEA`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0001-language-law-in-language-meta/content.md`  
**Source SHA-256:** `4534a139944608f7d4919f47424836f15cc073723c439061b1b5e977db141b80`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Implementation domains defer to language-meta: Decision [D-COMM-AUTH-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding. Uppercase requirement keywords retain their BCP-14 meaning.

> [Compiler](/platform-spec/compiler/), [Execution](/platform-spec/execution/), [Core library](/platform-spec/core-library/), and [Tooling](/platform-spec/tooling/) specify *how the reference platform realizes* language-meta. They **must not** redefine semantics already owned there; they **must** defer with `relatedTopics` (for example `defers-to`, `implements`) instead of duplicating normative key tables.

**Stable ID:** `BSP-REQ-252EE6F110A4`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0002-implementation-domains-defer/content.md`  
**Source SHA-256:** `d22ecbcf6fb280298319c555ad0849c72d62af87dc6181b95e38986ac5ba9db5`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Specification leads implementation: Decision [D-COMM-AUTH-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding. Uppercase requirement keywords retain their BCP-14 meaning.

> Implementation that alters observable language or platform behavior **must** be preceded or accompanied by normative spec updates. The spec is the authority; tests and crates are verification anchors, not substitutes for missing contract text. Cross-cutting inception record: **D-INC-0001**.

**Stable ID:** `BSP-REQ-093AC7460C8E`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0003-spec-leads-code/content.md`  
**Source SHA-256:** `20eaae5415289e997e3a3e2609c87e652d831420e3a3915f9d6c545ff723efd6`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: One ADR file per closed decision: Decision [D-COMM-AUTH-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding. Uppercase requirement keywords retain their BCP-14 meaning.

> Each **Standard** feature **must** publish closed choices under **`adr/`** as one file per decision (`specLevel: adr`, stable `adrId`, `adrStatus`, `adrDate`). Body **must** include **`## Context`**, **`## Decision`**, **`## Consequences`**; add **`## Verification anchors`** when testable. Legacy `decisions-record.mdx` and hub **`## Decisions`** summaries remain valid during migration; new work **must** use `adr/`. Inception cross-cutting ADRs stay under [Project inception](/platform-spec/community/project-inception/).

**Stable ID:** `BSP-REQ-9FE89303AD0F`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0004-adr-per-decision-files/content.md`  
**Source SHA-256:** `8710fde0421c9599cef43b08895bbe438b8274e307804751db46d0f7d7744a39`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Proposed vs Standard maturity gates: Decision [D-COMM-AUTH-0005]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding. Uppercase requirement keywords retain their BCP-14 meaning.

> | `status` | Meaning | Requirements |
> | --- | --- | --- |
> | **Proposed** | Incomplete or unstable | May omit full verification anchors; **must not** be cited as enforceable language law in conformance arguments |
> | **Standard** | Enforceable platform contract | **Must** include normative MUST/SHOULD/MAY prose, verification anchors, and hub **`## Decisions`** (or linked `decisions-record`) |
> 
> Any **Standard** page failing content gates (circular canon stubs, placeholder-only bundles, missing decisions) **must** downgrade to **Proposed** until restored.

**Stable ID:** `BSP-REQ-4107C7AE7317`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0005-proposed-vs-standard-maturity/content.md`  
**Source SHA-256:** `ea05a1548bca873dccaf44637ac14d5db7750b7ce78c2d5f466236c15ecd9f3a`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history. They are not normative except where text was extracted into a requirement above.

### Source Record: Specification authority and embedded decisions

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/spec-authority-and-decisions/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/spec-authority-and-decisions/content.md`  
**SHA-256:** `f8d0f2e321b4883becf6021aa1e6891013e0fbd44520cb458eed9483106f1664`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative platform contract

1. **Language law** — User-visible semantics (syntax, types, evaluation, contracts, memory, and cross-cutting language rules) **must** be defined only under the [Language meta](/platform-spec/language-meta/) domain, except where another domain page explicitly declares a **cross-domain exception** and links to the owning language-meta chapter.
2. **Implementation law** — The [Compiler](/platform-spec/compiler/), [Execution](/platform-spec/execution/), [Core library](/platform-spec/core-library/), and [Tooling](/platform-spec/tooling/) domains specify *how the reference platform realizes* language-meta. They **must not** redefine semantics already owned by language-meta; they **must** defer with `relatedTopics` (for example `defers-to`, `implements`) instead of duplicating normative key tables.
3. **Spec leads code** — Implementation changes that alter observable language or platform behavior **must** be preceded or accompanied by normative spec updates. The spec is the authority; tests and crates are verification anchors, not a substitute for missing contract text.
4. **Architecture decision records (ADRs)** — Each **Standard** feature **must** publish closed choices under **`adr/`** as one file per decision (`specLevel: adr`, stable `adrId`). The feature reader exposes an **ADRs** tab with expandable Context / Decision / Consequences detail. Legacy **`decisions-record.mdx`** articles and hub **`## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMM-AUTH-0001` … `D-COMM-AUTH-0005`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMM-AUTH-0001` … `D-COMM-AUTH-0005`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->`** summaries remain valid during migration but new work **must** use `adr/`. Cross-cutting inception decisions live under [Project inception](/platform-spec/community/project-inception/).

## Language law vs implementation domains

| Concern | Owning surface | Realization surfaces |
| --- | --- | --- |
| What programs mean (types, control flow, contracts) | language-meta | compiler phases, execution runtime |
| Author-facing manifests and CLI | tooling (authoring) | compiler resolution (graph, cycles) |
| Standard library API shape | core-library | execution syscalls, compiler lowering |
| Diagnostics users see | language-meta + compiler registry | tooling/LSP presentation |

When adding a feature, classify the topic **before** writing: if a reader asking “what does valid Beskid code mean?” would need the answer, it belongs in **language-meta** first; pipeline, crate, or host details belong in implementation domains with links back.

## Maturity — Proposed vs Standard

| `status` | Meaning | Requirements |
| --- | --- | --- |
| **Proposed** | Incomplete, unstable, or under active design | May omit full verification anchors; **must not** be cited as enforceable language law in conformance arguments |
| **Standard** | Enforceable platform contract | **Must** include normative MUST/SHOULD/MAY prose, verification anchors (tests, crates, or explicit registry links), and **`## Decisions`** on the feature hub (or a linked `decisions-record` article) |

Any **Standard** page that fails content gates (circular “canonical chapter” stubs, placeholder-only article bundles, missing decisions) **must** be downgraded to **Proposed** until restored.

## ADR file contract

Each ADR file at `platform-spec/<domain>/<area>/<feature>/adr/<slug>.mdx` **must** use:

| Field | Rule |
| --- | --- |
| `specLevel` | `adr` |
| `adrId` | Stable identifier (for example `D-INC-0001`, `D-CORE-CONC-0003`) |
| `adrStatus` | `Accepted`, `Superseded`, or `Proposed` |
| `adrDate` | ISO date when the decision closed (inception ADRs **should** reflect historical dates) |
| Body | **`## Context`**, **`## Decision`**, **`## Consequences`**; **`## Verification anchors`** when testable |

Superseded ADRs **must** set `supersedesAdr` or link the replacement `adrId` in **Consequences** and note the Git revision (not a URL version segment).

## Hub decisions summary

A **Standard** feature hub **must** include **`## Decisions`** that either lists open items or states **no open decisions** and links the **`adr/`** set (reader **ADRs** tab). Hub bullets **must not** duplicate full ADR prose—summarize and link by `adrId`.

## Related maintenance policies

- [Feature Hub + Article Bundle template](/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/) — Required hub sections, anti-stub rules, and article minimums.
- [Release and versioning policy](/platform-spec/community/spec-maintenance/release-and-versioning-policy/) — Git as version axis; v0.x delivery bands.
- [Non-normative bridge docs policy](/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/) — Legacy doc trees and mapping pages.

## Decisions
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Language law lives only in language-meta

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0001-language-law-in-language-meta/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0001-language-law-in-language-meta/content.md`  
**SHA-256:** `4534a139944608f7d4919f47424836f15cc073723c439061b1b5e977db141b80`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Platform-spec domains multiplied without a single place for “what valid Beskid code means,” inviting duplicate type and evaluation tables in compiler and tooling chapters.

## Decision

**Language law** — syntax, types, evaluation, contracts, memory, and cross-cutting language rules — **must** be defined only under [Language meta](/platform-spec/language-meta/), except where another domain page declares an explicit **cross-domain exception** and links to the owning language-meta chapter.

## Consequences

New language semantics start in language-meta; implementation domains link back instead of redefining tables.

## Verification anchors

`packages/trudoc/src/verify/platform-spec-content.ts`; `cd site/website && bun run verify:trudoc -- --preset ci`.
``````

</details>

### Source Record: Implementation domains defer to language-meta

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0002-implementation-domains-defer/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0002-implementation-domains-defer/content.md`  
**SHA-256:** `d22ecbcf6fb280298319c555ad0849c72d62af87dc6181b95e38986ac5ba9db5`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Pipeline and host details were written as if they owned user-visible meaning, overlapping language-meta chapters.

## Decision

[Compiler](/platform-spec/compiler/), [Execution](/platform-spec/execution/), [Core library](/platform-spec/core-library/), and [Tooling](/platform-spec/tooling/) specify *how the reference platform realizes* language-meta. They **must not** redefine semantics already owned there; they **must** defer with `relatedTopics` (for example `defers-to`, `implements`) instead of duplicating normative key tables.

## Consequences

Classification happens before authoring: “what does valid code mean?” → language-meta first; crates and phases link back.

## Verification anchors

`relatedTopics` frontmatter validation in `verify:trudoc --preset ci`.
``````

</details>

### Source Record: Specification leads implementation

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0003-spec-leads-code/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0003-spec-leads-code/content.md`  
**SHA-256:** `20eaae5415289e997e3a3e2609c87e652d831420e3a3915f9d6c545ff723efd6`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

README intent and crate behavior diverged when implementation shipped without a matching platform-spec change set.

## Decision

Implementation that alters observable language or platform behavior **must** be preceded or accompanied by normative spec updates. The spec is the authority; tests and crates are verification anchors, not substitutes for missing contract text. Cross-cutting inception record: **D-INC-0001**.

## Consequences

Contributors pair spec and code in one change set; CI content gates block **Standard** stubs.

## Verification anchors

[Project inception ADR 0001](/platform-spec/community/project-inception/adr/0001-spec-leads-code/); `verify:platform-spec-content`.
``````

</details>

### Source Record: One ADR file per closed decision

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0004-adr-per-decision-files/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0004-adr-per-decision-files/content.md`  
**SHA-256:** `8710fde0421c9599cef43b08895bbe438b8274e307804751db46d0f7d7744a39`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Monolithic `decisions-record` articles and hub prose duplicated the same choices without a stable identifier or reader **ADRs** tab.

## Decision

Each **Standard** feature **must** publish closed choices under **`adr/`** as one file per decision (`specLevel: adr`, stable `adrId`, `adrStatus`, `adrDate`). Body **must** include **`## Context`**, **`## Decision`**, **`## Consequences`**; add **`## Verification anchors`** when testable. Legacy `decisions-record.mdx` and hub **`## Decisions`** summaries remain valid during migration; new work **must** use `adr/`. Inception cross-cutting ADRs stay under [Project inception](/platform-spec/community/project-inception/).

## Consequences

Superseded ADRs set `supersedesAdr` or link replacements in **Consequences** with a Git revision note. Hub **`## Decisions`** summarizes by `adrId` only—no full ADR prose duplication.

## Verification anchors

`checkAdrSections` and `checkStandardFeatureDecisions` in `packages/trudoc/src/verify/platform-spec-content.ts`.
``````

</details>

### Source Record: Proposed vs Standard maturity gates

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0005-proposed-vs-standard-maturity/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/spec-authority-and-decisions/adr/0005-proposed-vs-standard-maturity/content.md`  
**SHA-256:** `ea05a1548bca873dccaf44637ac14d5db7750b7ce78c2d5f466236c15ecd9f3a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

**Standard** pages shipped with circular stubs or without decisions, while readers treated every platform-spec URL as enforceable law.

## Decision

| `status` | Meaning | Requirements |
| --- | --- | --- |
| **Proposed** | Incomplete or unstable | May omit full verification anchors; **must not** be cited as enforceable language law in conformance arguments |
| **Standard** | Enforceable platform contract | **Must** include normative MUST/SHOULD/MAY prose, verification anchors, and hub **`## Decisions`** (or linked `decisions-record`) |

Any **Standard** page failing content gates (circular canon stubs, placeholder-only bundles, missing decisions) **must** downgrade to **Proposed** until restored.

## Consequences

Maturity is explicit in frontmatter; CI strict mode can fail scaffold **Standard** pages.

## Verification anchors

`verify:platform-spec-content` with `--strict`; `LANGUAGE_META_CIRCULAR_CANON_ALLOWLIST` for tracked exceptions.
``````

</details>
