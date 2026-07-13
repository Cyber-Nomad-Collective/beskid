<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Release and versioning policy Specification

## Purpose

Git as the canonical version axis; v0.x bands label delivery scope, not alternate documentation URLs or parallel normative trees.

## Requirements

### Requirement: Git is the canonical specification version axis: Decision [D-COMM-VERS-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The platform specification under [/platform-spec/](/platform-spec/) is versioned by **Git** (typically `main`). Readers and tooling **must** treat the spec at a given commit as the contract for that commit; there is **no** parallel normative URL hierarchy such as `/platform-spec/v0.2/...`.

**Stable ID:** `BSP-REQ-F1FF04F3A53F`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0001-git-version-axis/content.md`  
**Source SHA-256:** `75bf150224133ea12ee0f44a47697ac17a9a7c0178f0f9b9de4bbd6de4bea0ad`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Stable platform-spec URLs across releases: Decision [D-COMM-VERS-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Feature and language-meta paths **must** remain stable across releases. Behavioral change is expressed by editing normative text and metadata (`status`, `lastReviewed`, embedded decisions), not by introducing version segments in site paths.

**Stable ID:** `BSP-REQ-678089357DFA`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0002-stable-urls/content.md`  
**Source SHA-256:** `562f2b4466b7391f925e105e45b23e2a11950473ec901d88c7fc625a75e6471e`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: v0.x bands label delivery scope not doc editions: Decision [D-COMM-VERS-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Labels such as **v0.1**, **v0.2**, or roadmap bands describe **what the reference platform targets shipping**, not separate specification editions. A page may mention a band when scoping work; it **must not** imply an older band remains authoritative at the same URL without explicit **Superseded** decision notes.

**Stable ID:** `BSP-REQ-EF3713F8E147`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0003-v0x-delivery-bands/content.md`  
**Source SHA-256:** `1db195579397dc7a3d29dbec249a9a011c0101dade8bd259b0963f5c4c05d9a1`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Single normative platform-spec tree: Decision [D-COMM-VERS-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The [Platform specification](/platform-spec/) domain is the **one** normative documentation tree for language and platform contracts. Legacy trees are **non-normative** only: informative [`/execution/`](/execution/) and [`/corelib/`](/corelib/) Starlight paths, plus book and guides, unless explicitly bridged per [Non-normative bridge docs policy](/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/).

**Stable ID:** `BSP-REQ-92F3862E47CB`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0004-single-normative-tree/content.md`  
**Source SHA-256:** `2ea4cb9264942f222683e7ed4f352ec72afe0dd78af269c76578d15b4f736da2`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Release and versioning policy

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/release-and-versioning-policy/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/release-and-versioning-policy/content.md`  
**SHA-256:** `451139038894b15f49c62e0909d9b4e48abd51e0fd8ef1e9816ae6d12152b5e9`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative platform contract

1. **Canonical version axis** — The platform specification under [/platform-spec/](/platform-spec/) is versioned by **Git** (typically `main` as the rolling integration branch). Readers and tooling **must** treat the spec at a given commit as the contract for that commit; there is **no** parallel normative URL hierarchy such as `/platform-spec/v0.2/...`.
2. **Stable URLs** — Feature and language-meta paths **must** remain stable across releases. Behavioral change is expressed by editing normative text and metadata (`status`, `lastReviewed`, embedded decisions), not by introducing version segments in site paths.
3. **v0.x bands are delivery scope, not doc versions** — Labels such as **v0.1**, **v0.2**, or roadmap bands describe **what the reference platform targets shipping**, not separate specification editions. A page may mention a band in prose when scoping implementation work; it **must not** imply that an older band remains authoritative at the same URL without explicit **Superseded** decision notes.
4. **Single normative entry** — The [Platform specification](/platform-spec/) domain is the **one** normative documentation tree for language and platform contracts. Legacy trees ([`/execution/`](/execution/), [`/corelib/`](/corelib/), informative book and guides) are **non-normative** unless explicitly bridged per [Non-normative bridge docs policy](/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/).

## How bands interact with maturity

| Label | Role in documentation |
| --- | --- |
| Git revision / `lastReviewed` | When the normative text was last aligned with implementation |
| `status: Proposed` | Contract still forming; band mentions are expectations, not guarantees |
| `status: Standard` | Enforceable at the current Git revision; band mentions scope verification targets |
| Embedded **Superseded** decisions | Historical choice retired at a noted revision; replacement section owns current law |

## Tooling and release artifacts

- CLI and package publication may use rolling tags (for example `cli-latest`) for **binaries**; that does not fork the spec URL space.
- Registry-assigned package versions and lockfiles are **tooling/execution** concerns; their normative definitions live under platform-spec features with `relatedTopics` links, not under version-prefixed doc paths.

## Maintainer expectations

When a delivery band closes a gap (for example promoting fibers from Proposed to Standard), update normative prose, verification anchors, and `lastReviewed` in the **same change set** as the implementation merge when possible. Do not leave **Standard** pages describing behavior that only exists on another branch without a **Proposed** downgrade or an explicit decision noting the gap.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMM-VERS-0001` … `D-COMM-VERS-0004`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Git is the canonical specification version axis

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0001-git-version-axis/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0001-git-version-axis/content.md`  
**SHA-256:** `75bf150224133ea12ee0f44a47697ac17a9a7c0178f0f9b9de4bbd6de4bea0ad`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Version-segmented doc sites diverged from the implementation on `main`. Inception record **D-INC-0007** states the platform-wide choice.

## Decision

The platform specification under [/platform-spec/](/platform-spec/) is versioned by **Git** (typically `main`). Readers and tooling **must** treat the spec at a given commit as the contract for that commit; there is **no** parallel normative URL hierarchy such as `/platform-spec/v0.2/...`.

## Consequences

Site deploy and release policy track `main`; `lastReviewed` records alignment dates.

## Verification anchors

[D-INC-0007](/platform-spec/community/project-inception/adr/0007-git-main-version-axis/).
``````

</details>

### Source Record: Stable platform-spec URLs across releases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0002-stable-urls/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0002-stable-urls/content.md`  
**SHA-256:** `562f2b4466b7391f925e105e45b23e2a11950473ec901d88c7fc625a75e6471e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Renaming or version-prefixing feature paths broke bookmarks and `relatedTopics` links across domains.

## Decision

Feature and language-meta paths **must** remain stable across releases. Behavioral change is expressed by editing normative text and metadata (`status`, `lastReviewed`, embedded decisions), not by introducing version segments in site paths.

## Consequences

Redirects handle legacy Starlight paths; normative slugs under `platform-spec/` stay fixed.

## Verification anchors

`site/website` Astro routes; platform-spec nav tree generation.
``````

</details>

### Source Record: v0.x bands label delivery scope not doc editions

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0003-v0x-delivery-bands/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0003-v0x-delivery-bands/content.md`  
**SHA-256:** `1db195579397dc7a3d29dbec249a9a011c0101dade8bd259b0963f5c4c05d9a1`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Readers interpreted **v0.2** labels as alternate authoritative spec trees at the same URL.

## Decision

Labels such as **v0.1**, **v0.2**, or roadmap bands describe **what the reference platform targets shipping**, not separate specification editions. A page may mention a band when scoping work; it **must not** imply an older band remains authoritative at the same URL without explicit **Superseded** decision notes.

## Consequences

`status: Proposed` plus band mentions are expectations; `status: Standard` plus bands scope verification targets.

## Verification anchors

Feature hub maturity tables; embedded **Superseded** ADR links.
``````

</details>

### Source Record: Single normative platform-spec tree

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0004-single-normative-tree/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0004-single-normative-tree/content.md`  
**SHA-256:** `2ea4cb9264942f222683e7ed4f352ec72afe0dd78af269c76578d15b4f736da2`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Parallel **non-normative** legacy trees (`/execution/`, `/corelib/`, Starlight guides) were cited as law alongside platform-spec.

## Decision

The [Platform specification](/platform-spec/) domain is the **one** normative documentation tree for language and platform contracts. Legacy trees are **non-normative** only: informative [`/execution/`](/execution/) and [`/corelib/`](/corelib/) Starlight paths, plus book and guides, unless explicitly bridged per [Non-normative bridge docs policy](/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/).

## Consequences

Public site exposes **Platform specification** and **Book** only; bridge pages link canonical destinations.

## Verification anchors

[Legacy spec mapping](/platform-spec/legacy-spec-mapping/); `PSC005` stale legacy bridge checks.
``````

</details>
