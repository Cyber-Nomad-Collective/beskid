## ADDED Requirements

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
