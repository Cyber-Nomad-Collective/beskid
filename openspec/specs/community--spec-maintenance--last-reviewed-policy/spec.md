<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Last reviewed policy Specification

## Purpose

Policy for `lastReviewed` metadata and drift detection in high-change feature pages.

## Requirements

### Requirement: lastReviewed on high-churn platform-spec pages: Decision [D-COMM-REV-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> High-churn feature pages **should** set `lastReviewed` in ISO date format. When implementation anchors change materially, `lastReviewed` **should** be updated in the same change set. Optional verification scripts **may** warn when pages with implementation anchors omit `lastReviewed`.

**Stable ID:** `BSP-REQ-B09B136ACE26`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/last-reviewed-policy/adr/0001-last-reviewed-metadata/content.md`  
**Source SHA-256:** `ed91fd3e47719c1f49ed5983e9016977739a9e3a73a40099aca3b2c1111cde14`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Last reviewed policy

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/last-reviewed-policy/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/last-reviewed-policy/content.md`  
**SHA-256:** `bcb83240ae7416ae9c02a21bb0fb0fdaeaddb2f23bb7c3c71be04d6b4a7714b3`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative platform contract

1. High-churn feature pages should set `lastReviewed` in ISO date format.
2. If implementation anchors change materially, `lastReviewed` should be updated in the same change set.
3. Optional verification scripts may warn when pages with implementation anchors omit `lastReviewed`.

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-COMM-REV-0001`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: lastReviewed on high-churn platform-spec pages

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/community/spec-maintenance/last-reviewed-policy/adr/0001-last-reviewed-metadata/`  
**Source:** `site/spec-content/platform-spec/community/spec-maintenance/last-reviewed-policy/adr/0001-last-reviewed-metadata/content.md`  
**SHA-256:** `ed91fd3e47719c1f49ed5983e9016977739a9e3a73a40099aca3b2c1111cde14`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

**Standard** feature pages listed crate paths that had drifted without any metadata signal for readers or release triage.

## Decision

High-churn feature pages **should** set `lastReviewed` in ISO date format. When implementation anchors change materially, `lastReviewed` **should** be updated in the same change set. Optional verification scripts **may** warn when pages with implementation anchors omit `lastReviewed`.

## Consequences

Release and versioning policy uses `lastReviewed` alongside Git revision as the alignment axis (see **D-COMM-VERS-0001**).

## Verification anchors

`generate-platform-spec-git-meta.mjs`; optional strict content warnings.
``````

</details>
