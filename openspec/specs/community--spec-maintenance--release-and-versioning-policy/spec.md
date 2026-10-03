<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Release and versioning policy Specification

## Purpose

This specification defines Git as the canonical version axis. The v0.x bands label the delivery scope. The bands do not label alternate documentation URLs or parallel normative trees.

## Requirements

### Requirement: Linux package derivative provenance
A Linux package derivative SHALL bind one immutable native release identity (version, native superrepository commit, compiler commit, Linux target, bundle name and SHA-256, and SHA-256 values for `release-state.json` and `validated-evidence.json`) to one separately named distribution recipe commit and one regular-file DEB artifact and SHA-256. The verifier SHALL revalidate the retained native snapshot with the established native release-evidence reader rather than trusting the aggregate JSON self-description.

It SHALL retain machine-verifiable fresh-environment qualification evidence for an expected old-package RED and corrected-package GREEN. The evidence SHALL bind an immutable container image digest, the exact traced harness, the `Smoke.bproj`, its source, and the libc-header C probe to reviewed SHA-256 values. The GREEN SHALL prove `apt-get --no-install-recommends` installs `clang`, `cc`, `ar`, and `ranlib`; libc-header C compilation, linking, and execution; and `/usr/bin/beskid analyze`, `build --locked`, and `run --locked` against that explicit `Smoke.bproj`, with the lockfile unchanged. The verifier SHALL create a private output directory exclusively with mode `0700`, snapshot the DEB and both qualification logs, and compare the copied bytes before emitting the correction record.

The native release record is immutable. A correction SHALL be represented only by a uniquely named append-only public JSON record and the absent DEB asset. It SHALL NOT alter native state, native evidence, native assets, rolling tags, or claim Windows or macOS qualification. It SHALL NOT synthesize or accept `package-result.json` as evidence for this lane.

The verifier and publisher SHALL apply the repository publication-hold policy to the intent's version and compiler source before producing output or contacting remote transport. The external operator SHALL invoke publication only from the reviewed clean `main` checkout. Publication SHALL first copy the reviewed intent and exact correction output into a private `0700` snapshot, revalidate the snapshot, and use only those snapshotted bytes for all remote comparisons and uploads. It SHALL then preflight the immutable `cli-v<version>` tag target and both correction names declared by the finite correction intent before any write. An existing asset with unequal bytes or an existing correction record with unequal bytes is a hard error before any write; exact existing bytes are an idempotent success. Authentication, network, release-read, tag-read, inventory, and download uncertainty SHALL fail closed. An uncertain upload SHALL re-query the remote inventory and accept only verified exact bytes; it SHALL NOT blindly retry. A partial attempt with only the exact DEB present SHALL revalidate it and upload only the missing record.

**Stable ID:** `BSP-REQ-LINUX-PACKAGE-DERIVATIVE-PROVENANCE`

#### Scenario: Accepted focused recipe produces the exact correction record
- **GIVEN** an immutable native aggregate, a clean detached distribution checkout at the reviewed recipe commit, a regular-file DEB, and complete RED/GREEN evidence matching a finite correction intent
- **WHEN** the derivative verifier creates its output
- **THEN** it writes the exact append-only correction record, DEB, intent, and private qualification snapshot, without changing native release records or producing `package-result.json`

#### Scenario: Native identity drift is rejected
- **GIVEN** the native source commit, compiler commit, Linux bundle, `release-state.json`, or `validated-evidence.json` differs from the finite intent or established evidence-reader result
- **WHEN** qualification is attempted
- **THEN** it fails before correction output creation

#### Scenario: Recipe or artifact drift is rejected
- **GIVEN** the distribution checkout is dirty, is not the exact reviewed recipe and base commit, has different pinned harness or fixture bytes, or the DEB digest differs
- **WHEN** qualification is attempted
- **THEN** it fails before correction output creation

#### Scenario: Qualification evidence is incomplete or malformed
- **GIVEN** RED or GREEN evidence is missing, malformed, has a different digest, names a different container or harness, reports the wrong exit, or omits a required traced assertion
- **WHEN** qualification is attempted
- **THEN** it fails before correction output creation

#### Scenario: Symlinked consumed input is rejected
- **GIVEN** any consumed intent, aggregate JSON, aggregate asset, recipe file, DEB, qualification log, controlled parent directory, or ancestor component within a consumed path is a symbolic link
- **WHEN** qualification or publication is attempted
- **THEN** it fails without writing a correction or remote asset

#### Scenario: Native release state cannot be mutated
- **GIVEN** a valid correction intent and immutable native aggregate
- **WHEN** the derivative verifier succeeds
- **THEN** the native state, native evidence, native assets, rolling tags, and platform claims remain byte-for-byte unchanged

#### Scenario: Remote correction names are absent
- **GIVEN** the immutable tag resolves to the reviewed compiler commit and both correction names are absent
- **WHEN** the external publisher runs with exact local inputs
- **THEN** it uploads precisely the DEB and correction record without creating, moving, or editing a tag or release

#### Scenario: Held source and local publication races are rejected
- **GIVEN** the correction source is covered by a tracked repository publication hold, or the operator's original correction output changes after publication preflight begins
- **WHEN** verification or external publication is attempted
- **THEN** a held source produces no correction and no remote call, while publication uses only the already validated private snapshot and never accepts or uploads the changed original bytes

#### Scenario: Remote correction names are exact or mismatched
- **GIVEN** either correction name already exists
- **WHEN** the external publisher preflights both names
- **THEN** exact bytes are idempotent and unequal or ambiguous bytes fail before any write

#### Scenario: Immutable publication resumes only a verified partial attempt
- **GIVEN** `cli-v<version>` exists and the exact DEB is present but the correction record is absent
- **WHEN** the external publisher reruns with the same verified local inputs
- **THEN** it uploads only the missing record and does not create, edit, replace, or retag a release

#### Scenario: Uncertain transport outcome fails closed
- **GIVEN** authentication, network, remote-read, or upload outcome is uncertain
- **WHEN** the external publisher cannot re-query and compare exact remote bytes
- **THEN** it stops without a blind retry or overwrite

### Requirement: Git is the canonical specification version axis: Decision [D-COMM-VERS-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding. Uppercase requirement keywords retain their BCP-14 meaning.

> The platform specification under [/platform-spec/](/platform-spec/) is versioned by **Git** (typically `main`). Readers and tooling **must** treat the spec at a given commit as the contract for that commit; there is **no** parallel normative URL hierarchy such as `/platform-spec/v0.2/...`.

**Stable ID:** `BSP-REQ-F1FF04F3A53F`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0001-git-version-axis/content.md`  
**Source SHA-256:** `75bf150224133ea12ee0f44a47697ac17a9a7c0178f0f9b9de4bbd6de4bea0ad`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Stable platform-spec URLs across releases: Decision [D-COMM-VERS-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding. Uppercase requirement keywords retain their BCP-14 meaning.

> Feature and language-meta paths **must** remain stable across releases. Behavioral change is expressed by editing normative text and metadata (`status`, `lastReviewed`, embedded decisions), not by introducing version segments in site paths.

**Stable ID:** `BSP-REQ-678089357DFA`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0002-stable-urls/content.md`  
**Source SHA-256:** `562f2b4466b7391f925e105e45b23e2a11950473ec901d88c7fc625a75e6471e`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: v0.x bands label delivery scope not doc editions: Decision [D-COMM-VERS-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding. Uppercase requirement keywords retain their BCP-14 meaning.

> Labels such as **v0.1**, **v0.2**, or roadmap bands describe **what the reference platform targets shipping**, not separate specification editions. A page may mention a band when scoping work; it **must not** imply an older band remains authoritative at the same URL without explicit **Superseded** decision notes.

**Stable ID:** `BSP-REQ-EF3713F8E147`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0003-v0x-delivery-bands/content.md`  
**Source SHA-256:** `1db195579397dc7a3d29dbec249a9a011c0101dade8bd259b0963f5c4c05d9a1`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Single normative platform-spec tree: Decision [D-COMM-VERS-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding. Uppercase requirement keywords retain their BCP-14 meaning.

> The [Platform specification](/platform-spec/) domain is the **one** normative documentation tree for language and platform contracts. Legacy trees are **non-normative** only: informative [`/execution/`](/execution/) and [`/corelib/`](/corelib/) Starlight paths, plus book and guides, unless explicitly bridged per [Non-normative bridge docs policy](/platform-spec/community/spec-maintenance/non-normative-bridge-docs-policy/).

**Stable ID:** `BSP-REQ-92F3862E47CB`  
**Legacy source:** `site/spec-content/platform-spec/community/spec-maintenance/release-and-versioning-policy/adr/0004-single-normative-tree/content.md`  
**Source SHA-256:** `2ea4cb9264942f222683e7ed4f352ec72afe0dd78af269c76578d15b4f736da2`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history. They are not normative except where text was extracted into a requirement above.

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

Normative content tracks Git revisions; `lastReviewed` records alignment dates.

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
