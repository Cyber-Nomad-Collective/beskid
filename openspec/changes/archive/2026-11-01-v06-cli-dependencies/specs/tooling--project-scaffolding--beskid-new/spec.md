## ADDED Requirements

### Requirement: Bundled default application creation
New SHALL accept new <name> [--template <template>], using <name> as output directory and primary name by default. With no template override it SHALL create a usable bundled app offline without prior template installation or prompts. New --list and --help SHALL expose available templates without provisioning. Existing nonempty output SHALL be rejected unchanged unless scoped force or interactive overwrite is authorized. Template cache management SHALL use package template list/install/uninstall rather than new subcommand dispatch. Online update checks SHALL be advisory and SHALL NOT replace selected template bytes or block offline bundled creation.

#### Scenario: CLI06-02 Offline default
- **GIVEN** empty template cache, network disabled and installed CLI
- **WHEN** new hello runs
- **THEN** hello contains a valid app manifest/source and requires no manual manifest edit or prompt

#### Scenario: CLI06-02 Template override
- **GIVEN** an installed named template
- **WHEN** new hello --template <template> runs
- **THEN** that template is used with explicit name/output binding

#### Scenario: CLI06-02 Existing output
- **GIVEN** a nonempty hello directory and noninteractive stdin
- **WHEN** new hello runs without force
- **THEN** it fails and leaves every existing byte unchanged


### Requirement: Offline template lifecycle preserves verified source authority
New --offline SHALL permit bundled templates, explicitly selected local template directories, and installed templates whose recorded identity and checksum match their current manifest and complete payload. Offline resolution SHALL reject absent, ambiguous, unverified or tampered installed selections before creating output. Offline SHALL perform no Git or registry requests, including advisory version checks. Remote selectors lacking a verified installed match SHALL fail with cache guidance. Template post-actions SHALL preserve offline dependency policy; arbitrary command actions lacking enforceable offline behavior SHALL fail before output creation rather than execute or silently skip.

#### Scenario: CLI06-NEW-OFFLINE-LOCAL Local selection
- **GIVEN** a valid local template directory and an unreachable registry
- **WHEN** new local --offline --path selects that directory
- **THEN** it creates the selected local payload without any network request

#### Scenario: CLI06-NEW-OFFLINE-CACHE Verified installed selection
- **GIVEN** an installed template whose identity and payload checksum match its installation snapshot
- **WHEN** new warm --offline --template selects its short name
- **THEN** it creates the verified payload without registry advisory requests

#### Scenario: CLI06-NEW-OFFLINE-TAMPER Changed installed payload
- **GIVEN** an installed template with changed payload bytes or mismatched manifest identity
- **WHEN** new tampered --offline selects it
- **THEN** it reports an integrity failure before creating output and performs no network request

#### Scenario: CLI06-NEW-OFFLINE-ACTION Dependency post-action
- **GIVEN** a local template with a dependency lock post-action and unavailable dependency cache
- **WHEN** new --offline instantiates it
- **THEN** the post-action receives offline resolution policy, fails with a cache diagnostic, and makes no network request

#### Scenario: CLI06-NEW-OFFLINE-COMMAND Unconstrained post-action
- **GIVEN** a selected template containing an arbitrary command post-action
- **WHEN** new --offline is requested
- **THEN** it rejects that unsupported action before creating output without executing the command

### Requirement: Installed template digest binds the copied regular-file inventory
Template installation SHALL preflight a single regular-file inventory before replacing existing installed state. It SHALL reject symbolic links, directory cycles and special files. Copying and checksum computation SHALL use the same inventory, excluding Git metadata and only the root installation receipt. Nested files named manifest.snapshot.json SHALL remain payload. Digests SHALL include an explicit algorithm version and unambiguous framing of normalized relative paths and content lengths. Unsupported historical digest versions SHALL fail offline verification with explicit reinstall guidance. Installation SHALL verify staged payload before switching installed state and restore previous state if switching fails.

#### Scenario: CLI06-CACHE-GIT Git metadata is not installed payload
- **GIVEN** a valid local template containing Git metadata
- **WHEN** it is installed and subsequently selected offline
- **THEN** Git metadata is excluded consistently from copied payload and digest, and the verified template succeeds offline

#### Scenario: CLI06-CACHE-LINK Invalid replacement preserves installation
- **GIVEN** a verified installed template and a replacement source containing a symbolic link or directory cycle
- **WHEN** installation is requested
- **THEN** it rejects the replacement before modifying the existing installed payload or receipt

#### Scenario: CLI06-CACHE-FRAMING Distinct path and byte boundaries
- **GIVEN** trees whose raw concatenated relative paths and content are equal but their path/content boundaries differ
- **WHEN** their digests are computed
- **THEN** their versioned framed digests differ

#### Scenario: CLI06-CACHE-NESTED Nested receipt-like filenames are payload
- **GIVEN** an installed template containing nested/manifest.snapshot.json
- **WHEN** that nested file changes
- **THEN** offline verification rejects the changed payload

#### Scenario: CLI06-CACHE-OLD Unsupported historical digest
- **GIVEN** an installed template with an unversioned historical checksum
- **WHEN** it is selected offline
- **THEN** selection fails before output with explicit reinstall guidance
