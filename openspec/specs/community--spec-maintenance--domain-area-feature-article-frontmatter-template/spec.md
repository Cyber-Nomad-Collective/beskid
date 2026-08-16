<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Domain, Area, Feature, and Article frontmatter templates Specification

## Purpose

This specification defines the canonical frontmatter templates. The templates align with the platform-spec validators and Zod contracts.

## Requirements

### Requirement: Canonical platform-spec frontmatter templates: Decision [D-COMM-META-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding. Uppercase requirement keywords retain their BCP-14 meaning.

> New nodes **must** use the canonical templates on the parent feature hub: `specLevel` discriminates **domain**, **area**, **feature**, or **article**; `status` is required on **feature** and **article** only; `owner` and `submitter` **must** include non-empty `name` and valid `email`; every domain/area/feature hub directory **must** ship `layout.json`.

**Stable ID:** `BSP-REQ-7219808ED4A9`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/domain-area-feature-article-frontmatter-template/adr/0001-canonical-frontmatter-templates/content.md`  
**Source SHA-256:** `8c9e232ce4ae5eaba140eebabded25728cf731c4ef5caf490a6b216d5e0fd1a5`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history. They are not normative except where text was extracted into a requirement above.

### Source Record: Domain, Area, Feature, and Article frontmatter templates

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/domain-area-feature-article-frontmatter-template/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/domain-area-feature-article-frontmatter-template/content.md`  
**SHA-256:** `9112165f9e7d152d43d88997a84f95a0b06c845c07dd2714839c2af9eb113228`

<details>
<summary>Migrated source text</summary>

``````markdown
Use these templates when creating new platform-spec nodes. They match current CI validators and `trudoc` Zod contracts.

## Domain template

```yaml
---
title: <Domain title>
description: <Domain summary>
specLevel: domain
owner:
  name: <Owner name>
  email: <owner@example.com>
submitter:
  name: <Submitter name>
  email: <submitter@example.com>
relatedTopics: []
---
```

## Area template

```yaml
---
title: <Area title>
description: <Area summary>
specLevel: area
owner:
  name: <Owner name>
  email: <owner@example.com>
submitter:
  name: <Submitter name>
  email: <submitter@example.com>
relatedTopics: []
---
```

## Feature hub template

```yaml
---
title: <Feature title>
description: <Feature summary>
specLevel: feature
status: Standard
owner:
  name: <Owner name>
  email: <owner@example.com>
submitter:
  name: <Submitter name>
  email: <submitter@example.com>
relatedTopics: []
---
```

## Article template

```yaml
---
title: <Article title>
description: <Article summary>
specLevel: article
status: Standard
owner:
  name: <Owner name>
  email: <owner@example.com>
submitter:
  name: <Submitter name>
  email: <submitter@example.com>
relatedTopics: []
---
```

## Validation notes

- `status` is required for `feature` and `article`.
- `status` is not allowed on `domain` or `area`.
- `owner` and `submitter` must include non-empty `name` and valid `email`.
- Use `layout.json` for every domain/area/feature hub directory.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMM-META-0001`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Canonical platform-spec frontmatter templates

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/domain-area-feature-article-frontmatter-template/adr/0001-canonical-frontmatter-templates/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/domain-area-feature-article-frontmatter-template/adr/0001-canonical-frontmatter-templates/content.md`  
**SHA-256:** `8c9e232ce4ae5eaba140eebabded25728cf731c4ef5caf490a6b216d5e0fd1a5`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Hand-written frontmatter drifted from `platformSpecNodeSchema` and layout scanners, causing PR failures late in CI.

## Decision

New nodes **must** use the canonical templates on the parent feature hub: `specLevel` discriminates **domain**, **area**, **feature**, or **article**; `status` is required on **feature** and **article** only; `owner` and `submitter` **must** include non-empty `name` and valid `email`; every domain/area/feature hub directory **must** ship `layout.json`.

## Consequences

`verify:platform-spec-frontmatter` blocks invalid shapes before build.

## Verification anchors

`packages/trudoc/src/schema/content.ts`; `packages/trudoc/src/verify/platform-spec-frontmatter.ts`.
``````

</details>
