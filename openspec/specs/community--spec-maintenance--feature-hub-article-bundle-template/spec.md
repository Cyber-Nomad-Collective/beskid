<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Domain, Area and Feature template bundle Specification

## Purpose

Mandatory markdown-first template set for Domain, Area and Feature pages, including required section contracts and optional article bundles.

## Requirements

### Requirement: Domain, Area and Feature template bundle: Anti-stub and circular canon rules [community/spec-maintenance/feature-hub-article-bundle-template]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The following are **forbidden** on **Standard** pages:
> 
> 1. **Circular canon** — Body text that only self-references the same page URL as the sole authority **without** substantive normative MUST/SHOULD/MAY prose in the same file.
> 2. **Placeholder-only articles** — Article bundles where every sibling file is scaffold-only (“What this article covers” + “see the parent feature hub” with no role-specific sections).
> 3. **Hub-only authority** — Articles that repeat the feature hub contract without adding role-specific detail; normative requirements belong on the hub, articles add depth.

**Stable ID:** `BSP-REQ-C61D45B81185`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/content.md`  
**Source SHA-256:** `73771d9f04af8461e57cab4b604c2b2f1c455aae6596a9887d649ad471d69e1e`

#### Scenario: Conformance exercises Anti-stub and circular canon rules
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Domain, Area and Feature template bundle: Minimum article payload by role [community/spec-maintenance/feature-hub-article-bundle-template]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Each article in a bundle **must** meet a minimum for its role (in addition to [Required Article sections](#required-article-sections)):
> 
> | Article role | Minimum normative payload |
> | --- | --- |
> | **design-model** | Data/state model, invariants, and at least one diagram or structured flow (`arch` block or table) |
> | **contracts** | MUST/SHOULD table or numbered rules testable independently of the hub summary |
> | **verification** | Concrete test paths, crates, CI jobs, or registry codes — not “TBD” |
> | **operations** / **migration** | Procedures, rollout constraints, or compatibility steps |
> | **decisions-record** | Legacy only—migrate rows into **`adr/`** files per [Specification authority and embedded decisions](/platform-spec/community/spec-maintenance/spec-authority-and-decisions/) |
> | **adr** | One decision per file; `SpecAdrChrome`; reader **ADRs** tab lists expandable detail |
> 
> Pages that cannot meet the minimum **must** use `status: Proposed` until expanded.

**Stable ID:** `BSP-REQ-EB71450DCDE1`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/content.md`  
**Source SHA-256:** `73771d9f04af8461e57cab4b604c2b2f1c455aae6596a9887d649ad471d69e1e`

#### Scenario: Conformance exercises Minimum article payload by role
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Markdown-first platform-spec authoring: Decision [D-COMM-HUB-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Every new or reworked topic **must** choose one canonical level: **Domain**, **Area**, or **Feature**. Regular sections **must** be markdown headings/lists/admonitions first. Architecture visuals **must** use fenced `arch` (Mermaid C4); procedural flows **may** use fenced `mermaid`. Inline graph components in docs are legacy-only. Generics in prose **must** use one backtick literal per type; Mermaid labels **must not** contain raw `` `<` `` or `` `>` ``.

**Stable ID:** `BSP-REQ-4865596AAB4E`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0001-markdown-first-authoring/content.md`  
**Source SHA-256:** `8b059644fe96d99a3bbe162f34c9f701909df4f717d3756f511ce88f9c19d2ab`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Required Domain Area and Feature hub sections: Decision [D-COMM-HUB-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> **Domain** pages **must** include eight ordered sections (scope, terminology, principles, area map, guarantees, conformance, change policy, related domains). **Area** pages **must** include eight area sections (contract, boundaries, internal model, feature index, failure model, verification matrix, operations, related areas). **Feature** hubs **must** include eleven sections ending with **Decisions** plus **`adr/`** (contract, I/O, state, algorithms, edge cases, compatibility, security/performance, examples, verification, related features, decisions).

**Stable ID:** `BSP-REQ-335676FF3F93`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0002-domain-area-feature-section-contracts/content.md`  
**Source SHA-256:** `f9cd68e4546f2b8ab1332c323b21da84efdc0eec5cb913060d6131e3f516420a`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Standard feature hubs require adr directory: Decision [D-COMM-HUB-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Every **Standard** feature hub **must** include **`## Decisions`** (open items or **no open decisions** plus `adrId` pointers) and publish at least one `` `adr/<slug>.mdx` `` with `specLevel: adr` unless explicitly exempt in a **Standard** maintenance policy. Each ADR **must** include **Context**, **Decision**, and **Consequences**. New decisions **must not** be added only to monolithic decision tables.

**Stable ID:** `BSP-REQ-E14003B4FEE1`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0003-standard-feature-adr-directory/content.md`  
**Source SHA-256:** `300ad533e85b3f744bac2f6be61ad173dc379895b65ebb553338a775cd21f037`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Anti-stub and circular canon rules: Decision [D-COMM-HUB-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> On **Standard** pages the following are **forbidden**: (1) **circular canon** — body that cites the same URL as sole authority without substantive MUST/SHOULD/MAY prose; (2) **placeholder-only articles** — siblings that are scaffold-only; (3) **hub-only authority** — articles that repeat the hub contract without role-specific detail.

**Stable ID:** `BSP-REQ-C502646E1105`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0004-anti-stub-and-circular-canon/content.md`  
**Source SHA-256:** `632e48b9b5defa99d64a4bbdd692a7b8ea29c74848fc1c7586d23f75b53b13da`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Minimum article payload by role: Decision [D-COMM-HUB-0005]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Each bundle article **must** meet role minimums: **design-model** (model, invariants, diagram/table); **contracts** (testable MUST/SHOULD rules); **verification** (concrete test paths, not TBD); **operations**/**migration** (procedures); **decisions-record** (legacy—migrate to **`adr/`**); **adr** (one decision per file with `SpecAdrChrome`). Every article **must** include purpose, canonical references, detailed behavior, verification notes, and related topics. Feature hubs **must** publish a stable newcomer reading order (area → hub → conceptual articles → verification).

**Stable ID:** `BSP-REQ-DA82FBED3D20`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0005-article-minimum-payload/content.md`  
**Source SHA-256:** `2eb06f1ab4c58732eaa059822256b28de1271988ed4c8bdfcf9455955fc47a7c`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Domain, Area and Feature template bundle

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/content.md`  
**SHA-256:** `73771d9f04af8461e57cab4b604c2b2f1c455aae6596a9887d649ad471d69e1e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative platform contract

1. Every new or materially reworked platform-spec topic **must** choose one canonical level: **Domain**, **Area**, or **Feature**.
2. Regular sections **must** be authored in markdown headings/lists/admonitions first; Astro components are reserved for edge cases only.
3. Architecture visuals **must** use fenced code blocks with language `arch` (Mermaid C4 syntax) for static topology; procedural flows **may** use fenced `mermaid` (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`). Inline graph components in docs are legacy-only.
4. Feature pages may include article bundles, but article pages **must not** redefine canonical normative requirements that belong to the feature hub.
5. Type names with generics in prose **must** use a single backtick literal per type (for example write Fiber-of-T as one fenced inline code span in source), not HTML-escaped angle brackets. Mermaid node labels **must not** contain raw less-than or greater-than characters; use plain names or quoted labels (for example `"Channel T"`).

## Required Domain sections

A Domain page **must** include the following sections in this order:

1. **Scope and boundaries** - what this domain defines and what is out of scope.
2. **Terminology** - core nouns and exact meanings used by child pages.
3. **Architectural principles** - durable design rules for this domain.
4. **Area map** - navigable list of areas with one-sentence responsibilities.
5. **Normative guarantees** - stable contract guarantees expected by users and tooling.
6. **Conformance evidence** - how compliance is demonstrated.
7. **Change policy** - compatibility and migration expectations.
8. **Related domains** - cross-domain dependencies and links.

## Required Area sections

An Area page **must** include:

1. **Area contract** - subsystem mission, boundary, and external obligations.
2. **Responsibility boundaries** - explicit handoffs to sibling areas or domains.
3. **Internal model** - high-level stages, data flow, or topology.
4. **Feature index** - canonical feature pages under this area.
5. **Failure and diagnostics model** - error classes and reporting expectations.
6. **Verification matrix** - tests/checks that validate the area contract.
7. **Operational guidance** - usage, rollout, or maintenance notes.
8. **Related areas** - sibling and upstream/downstream links.

## Required Feature Hub sections

The Feature Hub page **must** include all of the following sections in this order:

1. **Contract statement** - concise statement of the feature obligation.
2. **Inputs and outputs** - data and API surfaces consumed and emitted.
3. **State model** - persistent/transient state and lifecycle constraints.
4. **Algorithms and flow** - normative sequence and key decisions.
5. **Edge cases and errors** - known exceptional behavior and diagnostics.
6. **Compatibility and versioning** - forward/backward compatibility policy.
7. **Security and performance notes** - mandatory cautions and limits.
8. **Examples** - representative examples linked to canonical behavior.
9. **Verification and traceability** - test anchors and drift detection.
10. **Related features** - direct dependencies and sibling contracts.
11. **Decisions** - hub summary plus **`adr/`** directory (see below); required on every **Standard** feature hub.

## Required Feature Hub — Decisions and `adr/`

Every **Standard** feature hub **must**:

1. Include a **`## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMM-HUB-0001` … `D-COMM-HUB-0005`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->

No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMM-HUB-0001` … `D-COMM-HUB-0005`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->`** section (summary only: open items, or **no open decisions**, plus pointers to `adrId` values).
2. Publish at least one file under **`adr/<slug>.mdx`** with `specLevel: adr` (unless the feature is explicitly exempt in a **Standard** maintenance policy).

Each ADR file **must** include **`## Context`**, **`## Decision`**, and **`## Consequences`**, with frontmatter `adrId`, `adrStatus`, and optional `adrDate`. Use [Project inception](/platform-spec/community/project-inception/) for cross-cutting historical ADRs.

Legacy **`decisions-record.mdx`** articles may remain during migration; new decisions **must not** be added only to monolithic decision tables.

Reference: [Concurrency package ADRs](/platform-spec/core-library/concurrency/concurrency-package/adr/0001-channel-default-unbounded/).

## Anti-stub and circular canon rules

The following are **forbidden** on **Standard** pages:

1. **Circular canon** — Body text that only self-references the same page URL as the sole authority **without** substantive normative MUST/SHOULD/MAY prose in the same file.
2. **Placeholder-only articles** — Article bundles where every sibling file is scaffold-only (“What this article covers” + “see the parent feature hub” with no role-specific sections).
3. **Hub-only authority** — Articles that repeat the feature hub contract without adding role-specific detail; normative requirements belong on the hub, articles add depth.

## Minimum article payload by role

Each article in a bundle **must** meet a minimum for its role (in addition to [Required Article sections](#required-article-sections)):

| Article role | Minimum normative payload |
| --- | --- |
| **design-model** | Data/state model, invariants, and at least one diagram or structured flow (`arch` block or table) |
| **contracts** | MUST/SHOULD table or numbered rules testable independently of the hub summary |
| **verification** | Concrete test paths, crates, CI jobs, or registry codes — not “TBD” |
| **operations** / **migration** | Procedures, rollout constraints, or compatibility steps |
| **decisions-record** | Legacy only—migrate rows into **`adr/`** files per [Specification authority and embedded decisions](/platform-spec/community/spec-maintenance/spec-authority-and-decisions/) |
| **adr** | One decision per file; `SpecAdrChrome`; reader **ADRs** tab lists expandable detail |

Pages that cannot meet the minimum **must** use `status: Proposed` until expanded.

## Required Article sections

Each optional Article page in a bundle **must** include:

1. **Purpose and scope** — what this article explains and where it does not apply.
2. **Canonical references** — links back to the Feature Hub and any normative source pages it relies on.
3. **Detailed behavior or procedure** — implementation-facing explanation, examples, or workflows.
4. **Verification and maintenance notes** — how drift is detected, reviewed, or tested.
5. **Related topics** — at minimum one parent or sibling link.

## Newcomer reading order requirements

Every Feature Hub **must** publish an explicit ordered list that supports first-time orientation:

1. Start with the parent Area page for system context.
2. Read the Feature Hub for canonical boundaries and invariants.
3. Read bundle articles from conceptual overview to operational details.
4. End with verification and maintenance policy pages (including `lastReviewed` governance when relevant).

The order **must** be written to remain stable when new articles are added; append articles by preserving the conceptual-to-operational flow.

## Markdown-first authoring policy

- Use markdown heading structure for all regular sections.
- Use `arch` fenced blocks for architecture diagrams.
- Use tables sparingly; prefer short lists for readability.
- Component usage is allowed only for non-standard interactive UI or migration edge cases, and must include a rationale note in the page.

## Decisions
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Markdown-first platform-spec authoring

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0001-markdown-first-authoring/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0001-markdown-first-authoring/content.md`  
**SHA-256:** `8b059644fe96d99a3bbe162f34c9f701909df4f717d3756f511ce88f9c19d2ab`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Heavy Astro component usage made diffs noisy and hid normative prose from content validators.

## Decision

Every new or reworked topic **must** choose one canonical level: **Domain**, **Area**, or **Feature**. Regular sections **must** be markdown headings/lists/admonitions first. Architecture visuals **must** use fenced `arch` (Mermaid C4); procedural flows **may** use fenced `mermaid`. Inline graph components in docs are legacy-only. Generics in prose **must** use one backtick literal per type; Mermaid labels **must not** contain raw `` `<` `` or `` `>` ``.

## Consequences

Component usage requires a rationale note; tables stay sparse.

## Verification anchors

`remark-arch-code-fence`; layout `minMarkdownHeadings` where enabled.
``````

</details>

### Source Record: Required Domain Area and Feature hub sections

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0002-domain-area-feature-section-contracts/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0002-domain-area-feature-section-contracts/content.md`  
**SHA-256:** `f9cd68e4546f2b8ab1332c323b21da84efdc0eec5cb913060d6131e3f516420a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Inconsistent hub shapes made navigation and CI layout validation unpredictable.

## Decision

**Domain** pages **must** include eight ordered sections (scope, terminology, principles, area map, guarantees, conformance, change policy, related domains). **Area** pages **must** include eight area sections (contract, boundaries, internal model, feature index, failure model, verification matrix, operations, related areas). **Feature** hubs **must** include eleven sections ending with **Decisions** plus **`adr/`** (contract, I/O, state, algorithms, edge cases, compatibility, security/performance, examples, verification, related features, decisions).

## Consequences

`layout.json` presets align with `SpecSection` ids; articles **must not** redefine hub-only canonical requirements.

## Verification anchors

`verify:platform-spec-layout`; `feature-contract-default` preset.
``````

</details>

### Source Record: Standard feature hubs require adr directory

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0003-standard-feature-adr-directory/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0003-standard-feature-adr-directory/content.md`  
**SHA-256:** `300ad533e85b3f744bac2f6be61ad173dc379895b65ebb553338a775cd21f037`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

**Standard** features shipped without traceable closed choices, blocking the reader **ADRs** tab.

## Decision

Every **Standard** feature hub **must** include **`## Decisions`** (open items or **no open decisions** plus `adrId` pointers) and publish at least one `` `adr/<slug>.mdx` `` with `specLevel: adr` unless explicitly exempt in a **Standard** maintenance policy. Each ADR **must** include **Context**, **Decision**, and **Consequences**. New decisions **must not** be added only to monolithic decision tables.

## Consequences

Reference: [Concurrency package ADRs](/platform-spec/core-library/concurrency/concurrency-package/adr/0001-channel-default-unbounded/). Legacy `decisions-record.mdx` is migration-only.

## Verification anchors

`PSC003` in `platform-spec-content.ts`.
``````

</details>

### Source Record: Anti-stub and circular canon rules

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0004-anti-stub-and-circular-canon/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0004-anti-stub-and-circular-canon/content.md`  
**SHA-256:** `632e48b9b5defa99d64a4bbdd692a7b8ea29c74848fc1c7586d23f75b53b13da`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

**Standard** pages passed review with self-referential stubs or article bundles that only pointed at the parent hub.

## Decision

On **Standard** pages the following are **forbidden**: (1) **circular canon** — body that cites the same URL as sole authority without substantive MUST/SHOULD/MAY prose; (2) **placeholder-only articles** — siblings that are scaffold-only; (3) **hub-only authority** — articles that repeat the hub contract without role-specific detail.

## Consequences

`PSC001`/`PSC002`/`PSC007` fail or warn in CI; pages that cannot meet minimums **must** use `status: Proposed`.

## Verification anchors

`verify:platform-spec-content --strict`; `LANGUAGE_META_CIRCULAR_CANON_ALLOWLIST`.
``````

</details>

### Source Record: Minimum article payload by role

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0005-article-minimum-payload/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/adr/0005-article-minimum-payload/content.md`  
**SHA-256:** `2eb06f1ab4c58732eaa059822256b28de1271988ed4c8bdfcf9455955fc47a7c`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Article filenames implied depth (for example `verification-and-traceability`) while content remained TBD stubs.

## Decision

Each bundle article **must** meet role minimums: **design-model** (model, invariants, diagram/table); **contracts** (testable MUST/SHOULD rules); **verification** (concrete test paths, not TBD); **operations**/**migration** (procedures); **decisions-record** (legacy—migrate to **`adr/`**); **adr** (one decision per file with `SpecAdrChrome`). Every article **must** include purpose, canonical references, detailed behavior, verification notes, and related topics. Feature hubs **must** publish a stable newcomer reading order (area → hub → conceptual articles → verification).

## Consequences

`ARTICLE_ROLE_THRESHOLDS` in `platform-spec-content.ts` enforce section and line counts.

## Verification anchors

`packages/trudoc/src/verify/platform-spec-content.ts` role thresholds.
``````

</details>
