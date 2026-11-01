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

### Requirement: Candidate-bound release source
A stable release SHALL run on the checked-out commit HEAD and SHALL publish the per-platform builds of one candidate commit C. C SHALL be the `superrepo_commit` of the committed CLI06-06 record of the version when that record exists, else the release gate input, else HEAD; when the record and the input both name a candidate, they SHALL be equal. C SHALL be HEAD or an ancestor of HEAD. The build identity of a commit SHALL be its `compiler`, `beskid_bsol` and `beskid_distrib` gitlinks and the sha256 of the release-case manifest; HEAD SHALL have the build identity of C. Each platform handoff SHALL come from C or from another source commit P of that platform; P SHALL be HEAD or an ancestor of HEAD, SHALL have the build identity of C, and the root diff between C and P SHALL touch only an explicit allowlist of paths that no build step reads. At least one platform source SHALL be C. The release SHALL verify the checksums of every handoff, SHALL record C as the source identity of the release state and of every published stream, and SHALL record each platform's source commit and the shared build identity in the release state. Commits between C and HEAD that change only root files, such as CI scripts, documentation or the record, SHALL NOT require a rebuild. The release SHALL fail before it prepares any release output when one of these conditions is not met.

#### Scenario: A root-only commit after the candidate does not force a rebuild
- **GIVEN** candidate C with complete checksum-verified builds on all three targets
- **AND** HEAD descends from C and changes only CI scripts and documentation
- **WHEN** the release runs on HEAD
- **THEN** it publishes the builds of C with C as the source identity and does not require a build of HEAD

#### Scenario: One platform is rebuilt on a later root commit
- **GIVEN** macOS and Windows handoffs of candidate C and a Linux handoff of commit D
- **AND** D has the build identity of C and changes only gate scripts and OpenSpec files
- **WHEN** the release runs
- **THEN** it publishes the three builds with C as the source identity and records D as the Linux source and the shared build identity

#### Scenario: A platform source with a changed build script is refused
- **GIVEN** a Linux handoff source that changes a packaging script relative to candidate C
- **WHEN** the release runs
- **THEN** the release fails before it collects any handoff and names the changed path

#### Scenario: A changed compiler pointer is refused
- **GIVEN** HEAD descends from candidate C
- **AND** the `compiler` gitlink of HEAD differs from that of C
- **WHEN** the release runs on HEAD
- **THEN** the release fails before it collects any handoff

#### Scenario: A changed release-case manifest is refused
- **GIVEN** HEAD descends from candidate C
- **AND** the release-case manifest at HEAD has a different sha256 than at C
- **WHEN** the release runs on HEAD
- **THEN** the release fails before it collects any handoff

#### Scenario: A candidate that is not an ancestor is refused
- **GIVEN** a record or a gate input that names a commit which is not HEAD or an ancestor of HEAD
- **WHEN** the release runs on HEAD
- **THEN** the release fails before it collects any handoff

### Requirement: Release gates protect artifacts, not process preferences
A release gate SHALL block publication only when it protects the identity or the checksums of the published artifacts, the observable behavior of the installed artifacts, the authority to publish, or the integrity of the build inputs. The release cases on installed artifacts, the checksum and provenance chain, the manual main-only publish lane with a scoped token, the workspace-mutation guard and the tamper checks of runtime kits and Mods SHALL remain fail-closed. A usability target that has no users to measure SHALL be published as evidence and SHALL NOT block publication. A gate SHALL NOT search source text for retired identifiers. Clippy SHALL run in the release gate as a report: it SHALL log its findings and their count, and it SHALL NOT block the release.

#### Scenario: A retired identifier inside a longer name does not fail the gate
- **GIVEN** compiler sources that contain the text `ExpectedTypeContext`
- **WHEN** the compiler gate lint phase runs
- **THEN** it runs clippy as a report and does not fail

#### Scenario: Clippy findings do not block the release
- **GIVEN** a candidate whose release cases and Corelib gate pass and whose compiler sources have clippy findings
- **WHEN** the compiler release gate runs
- **THEN** it logs the findings with their count and the gate result depends on the runtime-kit and workspace tests only

#### Scenario: A missing usability observation does not block
- **GIVEN** a candidate with passing release cases and no committed CLI06-06 record
- **WHEN** the release state is prepared
- **THEN** publication is not blocked and the release state and notes state `CLI06-06 observation: not performed`

### Requirement: Corelib publish set derives from the workspace
The Corelib publisher SHALL derive its package set from the members declared in the Corelib workspace manifest `CoreLib.bws`. It SHALL publish every member that is not named in one explicit exclusion list, and each exclusion SHALL record its reason. An exclusion that names no workspace member SHALL fail. A member added to the workspace SHALL be published without a publisher change, or SHALL fail with a message that names its missing metadata. Every dependency of a published package SHALL be in the publish set. The version policy SHALL be the pipeline input `BESKID_PCKG_VERSION_BUMP` with the values `patch`, `minor`, `major` or an exact `MAJOR.MINOR.PATCH` version, and the default SHALL be `patch`. An exact version that is not greater than the latest registry version of a package SHALL fail before any registry mutation.

#### Scenario: A new workspace member is published
- **GIVEN** a Corelib workspace member that no publisher list names
- **WHEN** the publication plan is derived
- **THEN** the plan contains that member

#### Scenario: An excluded member is not published
- **GIVEN** the test project `corelib_tests` in the workspace
- **WHEN** the publication plan is derived
- **THEN** the plan does not contain it

#### Scenario: The bump policy is a pipeline input
- **GIVEN** `BESKID_PCKG_VERSION_BUMP=minor` and a package whose latest registry version is `0.3.4`
- **WHEN** the publication plan is derived
- **THEN** the planned version of that package is `0.4.0`

### Requirement: Bounded source-coherent release loop
The beskid 0.6.0 release program SHALL reconcile published source, accepted main and recoverable drafts once before assigning implementation obligations. It SHALL progress through baseline reconciliation, normative scope freeze, complete implementation, candidate source freeze, native and installed qualification, reviewed manual publication, public readback and delivery closure. Each failed gate SHALL produce a recorded blocker with reproduction evidence, affected requirements, selected researched remedy and the next affected gate. Unchanged successful evidence SHALL be reused only when all declared consumed inputs remain unchanged; a new source identity SHALL still have a coherent complete candidate packet. A human administration dependency SHALL record the exact required action and verification condition rather than repeatedly running an unchanged failing gate. Required scope SHALL NOT be reduced to make the release green.

#### Scenario: A known unchanged failure does not restart the program
- **GIVEN** a failed Windows case has retained evidence and a diagnosed remedy
- **WHEN** no consumed input or relevant external state has changed
- **THEN** the program retains that blocker and does not restart unrelated green phases or claim the case passed

#### Scenario: A blocker remedy changes source
- **GIVEN** a researched fix changes a candidate's runtime or harness
- **WHEN** qualification resumes
- **THEN** affected evidence is regenerated and the aggregate rejects mixed candidate identities

### Requirement: Qualified immutable publication and readback
Stable 0.6.0 publication SHALL occur only after the complete candidate packet passes its required gates and records completed review. The established manual publisher SHALL use an immutable clean source identity and exact reviewed artifact bytes; credential-free build services SHALL NOT acquire publication credentials. Before candidate freeze, the program SHALL record required existing delivery channels and their acceptance conditions. The record SHALL include immutable CLI and LSP releases, complete Linux, Windows and macOS bundles and platform packages, Homebrew, public first-party package and template consumption, and public documentation. Each configured editor marketplace's submission and acceptance state SHALL be recorded independently from downloadable artifact availability. Exact existing remote bytes SHALL be idempotent; unequal bytes or uncertain remote identity SHALL fail closed without overwrite. Public readback SHALL verify immutable tags, downloaded artifact digests and fresh installed-consumer journeys before claiming availability. Waivers from earlier releases SHALL NOT automatically qualify a new candidate.

#### Scenario: A prior installer waiver does not transfer
- **GIVEN** 0.5.2 recorded an exact-artifact installer waiver
- **WHEN** a different 0.6 installer is qualified
- **THEN** the earlier waiver provides no passing evidence for the new installer

#### Scenario: Partial publication is resumed precisely
- **GIVEN** some required remote assets exist with exact reviewed bytes and others are absent
- **WHEN** the publisher resumes with the same qualified intent
- **THEN** it verifies all existing identities and publishes only absent approved assets without replacing or retagging published artifacts

#### Scenario: Downloadability is distinguished from marketplace acceptance
- **GIVEN** an editor extension is downloadable but its marketplace has not accepted the submitted version
- **WHEN** release availability is reported
- **THEN** those states are reported separately and acceptance is not claimed from the download alone

### Requirement: Evidence-backed delivery closure
Release closure SHALL reconcile revisioned OpenSpec requirement links and retained conformance/publication evidence into Tracker SQLite without overwriting independent delivery work. Seeds, task checkmarks, issue titles and unexecuted plans SHALL NOT prove delivery. Every required 0.6 obligation SHALL have verified completed evidence before the release goal or umbrella is closed. Deferred .NET stretch items SHALL remain explicitly separate from required Rust delivery.

#### Scenario: A seed file is not live delivery
- **GIVEN** a 0.6 seed bundle exists but no successful reconciliation or delivery evidence is retained
- **WHEN** closure is audited
- **THEN** Tracker import and delivery remain unproven

#### Scenario: Required work is incomplete
- **GIVEN** one native BSOL or Rust Glue requirement has no passing required-target evidence
- **WHEN** the release umbrella is audited
- **THEN** it remains open with that obligation retained

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
