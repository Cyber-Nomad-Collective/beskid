<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Non-normative bridge docs policy Specification

## Purpose

Policy for migration and bridge documents, including mandatory canonical destination links for non-normative mapping pages.

## Requirements

### Requirement: Bridge documents are non-normative by default: Decision [D-COMM-BRIDGE-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Bridge documents (migration guides, mapping tables, terminology crosswalks) are **non-normative** by default unless a **Standard** platform-spec feature page explicitly declares normative status. Migration mapping pages **must not** be the final authority for platform behavior.

**Stable ID:** `BSP-REQ-D2BBAD9AFEA2`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/adr/0001-bridge-docs-non-normative/content.md`  
**Source SHA-256:** `cbfad0aa63cb939a3fa9c1226b0b61856167607a238131907affc2d3534cebad`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Bridge pages must link canonical destinations: Decision [D-COMM-BRIDGE-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Every non-normative bridge page **must** link to one or more canonical normative destinations and label those links as canonical. Near the top each bridge **must** state: non-normative status, why the page exists, and which normative page(s) own the behavior. Canonical links **must** be direct platform-spec URLs with human-readable relation labels; bi-directional discoverability is required during active migration windows when practical.

**Stable ID:** `BSP-REQ-DC48F1CEB81A`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/adr/0002-canonical-destination-links/content.md`  
**Source SHA-256:** `d5b285026f3cb2646819b16870d78f73bda2430de005ace39b94138629c17bf7`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Migration mapping page required sections: Decision [D-COMM-BRIDGE-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Migration mapping pages **must** include: (1) a one-sentence non-normative notice; (2) a **Canonical destinations** section linking target feature hubs; (3) a **Mapping scope** section stating coverage and exclusions; (4) a maintenance note for retirement timing. Multi-domain mappings **must** group links by destination domain/area.

**Stable ID:** `BSP-REQ-BB349DD12BEB`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/adr/0003-migration-mapping-page-shape/content.md`  
**Source SHA-256:** `55d47c5fcd79c27b2018a6ed5f4af2f58236394cca52def70436e12587b36948`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Non-normative bridge docs policy

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/content.md`  
**SHA-256:** `a811b9c5486f84463f1e0f420805889abf628844dc00195577c06048b81c3f17`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative platform contract

1. Bridge documents (migration guides, mapping tables, and terminology crosswalks) are **non-normative** by default unless a page explicitly declares normative status in a canonical platform-spec feature page.
2. Migration mapping pages **must not** be used as the final authority for platform behavior; they are transitional navigation aids.
3. Every non-normative bridge page **must** link to one or more canonical normative destination pages and clearly label those links as canonical.

## Required labeling for bridge docs

Each bridge document **must** state all of the following near the top of the page:

- That the page is non-normative.
- Why the page exists (for example, migration from legacy organization).
- Which canonical normative page(s) supersede or own the described behavior.

## Migration mapping page requirements

Migration mapping pages **must** include:

1. A one-sentence non-normative notice.
2. A "Canonical destinations" section that links to target Feature Hub and/or feature pages.
3. A "Mapping scope" section that states what is covered and what is intentionally excluded.
4. A maintenance note describing when the mapping can be retired.

When mappings span multiple domains or areas, pages **must** group links by destination domain/area so readers can reach canonical sources without interpretation.

## Canonical link quality rules

Canonical destination links **must** satisfy:

- Direct links to canonical platform-spec pages (not only intermediate redirects).
- Human-readable relation labels (for example, "Canonical feature contract").
- Bi-directional discoverability when practical (canonical pages should also link to major migration bridges during active transition windows).

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMM-BRIDGE-0001` … `D-COMM-BRIDGE-0003`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Bridge documents are non-normative by default

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/adr/0001-bridge-docs-non-normative/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/adr/0001-bridge-docs-non-normative/content.md`  
**SHA-256:** `cbfad0aa63cb939a3fa9c1226b0b61856167607a238131907affc2d3534cebad`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Legacy Starlight paths and informal mapping tables were cited in reviews as if they were language law.

## Decision

Bridge documents (migration guides, mapping tables, terminology crosswalks) are **non-normative** by default unless a **Standard** platform-spec feature page explicitly declares normative status. Migration mapping pages **must not** be the final authority for platform behavior.

## Consequences

[Legacy spec mapping](/platform-spec/legacy-spec-mapping/) stays informative; normative fixes land under `platform-spec/`.

## Verification anchors

`PSC005` legacy bridge checks on **Standard** pages linking `/execution/` or `/corelib/`.
``````

</details>

### Source Record: Bridge pages must link canonical destinations

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/adr/0002-canonical-destination-links/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/adr/0002-canonical-destination-links/content.md`  
**SHA-256:** `d5b285026f3cb2646819b16870d78f73bda2430de005ace39b94138629c17bf7`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Readers stopped at bridge pages without reaching the owning **Standard** feature contract.

## Decision

Every non-normative bridge page **must** link to one or more canonical normative destinations and label those links as canonical. Near the top each bridge **must** state: non-normative status, why the page exists, and which normative page(s) own the behavior. Canonical links **must** be direct platform-spec URLs with human-readable relation labels; bi-directional discoverability is required during active migration windows when practical.

## Consequences

**Standard** pages that link legacy prefixes **must** mark those links non-normative in prose or `relatedTopics`.

## Verification anchors

`checkStaleLegacyBridge` in `platform-spec-content.ts`.
``````

</details>

### Source Record: Migration mapping page required sections

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/adr/0003-migration-mapping-page-shape/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/adr/0003-migration-mapping-page-shape/content.md`  
**SHA-256:** `55d47c5fcd79c27b2018a6ed5f4af2f58236394cca52def70436e12587b36948`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Ad-hoc mapping tables mixed partial coverage with implied normative scope.

## Decision

Migration mapping pages **must** include: (1) a one-sentence non-normative notice; (2) a **Canonical destinations** section linking target feature hubs; (3) a **Mapping scope** section stating coverage and exclusions; (4) a maintenance note for retirement timing. Multi-domain mappings **must** group links by destination domain/area.

## Consequences

Bridge pages become checklist-complete before merge; retirement removes the bridge when canonical nav suffices.

## Verification anchors

[Legacy spec mapping](/platform-spec/legacy-spec-mapping/) structure review in PR template.
``````

</details>
