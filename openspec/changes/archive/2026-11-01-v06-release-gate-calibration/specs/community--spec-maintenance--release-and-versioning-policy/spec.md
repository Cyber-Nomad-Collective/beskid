## ADDED Requirements

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
