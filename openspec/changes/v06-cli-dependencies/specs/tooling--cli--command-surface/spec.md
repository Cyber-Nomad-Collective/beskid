## MODIFIED Requirements

### Requirement: Stable CLI command families
The CLI SHALL expose exactly these root command families: `new`, `check`, `build`, `run`, `test`, `fmt`, `doc`, `add`, `remove`, `update`, `package`, `toolchain`, `doctor`, and `dev`. It SHALL expose `package search|info|pack|publish|login|logout` and `package template list|install|uninstall`, and `toolchain status|update`. Compiler inspection and maintenance SHALL have canonical routes under `dev`: `syntax parse|tree|clif`, `project fetch|lock|graph`, `corelib`, `runtime-kit`, `mod`, `lsp`, `bsol validate|migrate`, `build` backend inspection and `repl`. It SHALL remove old and duplicate dispatch, including dev routes for ordinary test/fmt/doc/update. It SHALL reject old root spellings with usage status and exact canonical replacement where one exists; it SHALL NOT expose `hi` or hidden compatibility dispatch.

Every root command SHALL provide a concise user-facing action description in help. Help SHALL NOT substitute internal argument-structure documentation for that description.

#### Scenario: Required families are present
- **GIVEN** an installed 0.6 CLI
- **WHEN** root and dev help are requested
- **THEN** the exact root families and canonical internal routes are listed and duplicate routes are absent

#### Scenario: Removed Hi command is rejected
- **GIVEN** a user invokes analyze, pckg, up, fetch or lsp at root
- **WHEN** the CLI parses the invocation
- **THEN** it exits 2 without executing the old handler and names check, package, toolchain, dev project fetch or dev lsp respectively

#### Scenario: CLI06-HELP02 Everyday actions have readable descriptions
- **GIVEN** root or command help for build, run, test, doc, remove, update, package or toolchain
- **WHEN** a user reads its description
- **THEN** it states the user action, is nonempty, and does not expose internal argument-structure documentation

### Requirement: Ordinary terminal interaction
Commands SHALL NOT enter alternate-screen or raw-input mode except explicit `beskid dev project graph --tui`. New SHALL use line-oriented prompts when interaction is needed and SHALL NOT offer --tui. Confirmed overwrite SHALL have the same scoped authority as --force; declined or noninteractive conflict SHALL preserve output. TTY progress SHALL remain bounded and leave readable summaries; redirected and --plain output SHALL contain no cursor-control sequences. No ordinary command SHALL wait for a picker or completion keypress with noninteractive input.

#### Scenario: Confirmed template overwrite
- **GIVEN** a selected existing output and interactive stdin
- **WHEN** the user confirms overwrite
- **THEN** only selected output is replaced without full-screen interaction

#### Scenario: Noninteractive template conflict
- **GIVEN** existing output and redirected stdin
- **WHEN** new runs without --force
- **THEN** the command reports conflict and preserves output

#### Scenario: CLI06-04 Redirected completion
- **GIVEN** redirected build/test streams
- **WHEN** the operation completes
- **THEN** it returns without keypress, picker, ANSI cursor controls or alternate screen

### Requirement: Manifest commands share project graph policy
Add, remove, update, dev project fetch/lock/graph and application compile flows SHALL use the same project graph and source-resolution authority. CLI mutation SHALL NOT create a second solver or semantic frontend.

#### Scenario: Dependency command uses compile graph policy
- **GIVEN** a project with path and registry dependencies
- **WHEN** dependency or compilation commands resolve it
- **THEN** graph policy, overrides and source identities follow the same authority

## ADDED Requirements

### Requirement: Discoverable help and scoped provisioning
Root help SHALL explain that add declares a project dependency and SHALL show a concrete new/add/run sequence. Command help SHALL explain effects, project targeting and recovery. Help, package queries, doctor and new --list SHALL NOT provision Corelib or require compilation tools. Backend tracing SHALL live under dev; ordinary commands SHALL retain structured diagnostics and verbosity.

#### Scenario: CLI06-01 First-use help
- **GIVEN** a fresh installed CLI
- **WHEN** root help is requested
- **THEN** a dependency add example and new/add/run sequence appear

#### Scenario: CLI06-04 No unrelated provisioning
- **GIVEN** no installed Corelib and network disabled
- **WHEN** help, new --list or doctor runs
- **THEN** the CLI returns useful output without provisioning or credential mutation

### Requirement: Versioned CLI-owned output and statuses
CLI-owned operations SHALL return 0 on success, 1 on operation failure and 2 on usage error. Check/build/test/add/remove/update/doctor SHALL support --json with newline-delimited JSON records containing schemaVersion=1, command, event and status, plus diagnostics or change data appropriate to that event. Diagnostics SHALL carry stable code, message and source span when available; mutation data SHALL list deterministic added/removed/retained coordinates with old/new version and digest when applicable. JSON stdout SHALL contain no human tables, progress or ANSI. Progress and compiler diagnostics SHALL use stderr. Run SHALL reserve stdout for program output and reject --json with usage guidance. Quiet/verbose and color auto/always/never SHALL be supported; non-TTY execution SHALL imply plain progress. Errors SHALL identify failed action, cause and next valid command without secret credentials.

#### Scenario: CLI06-04 Machine mutation
- **GIVEN** a dependency update dry-run
- **WHEN** --json is requested
- **THEN** stdout contains only schemaVersion=1 change/result records and stderr owns progress

#### Scenario: CLI06-04 Child JSON rejection
- **GIVEN** run with program output
- **WHEN** run --json is requested
- **THEN** the CLI exits 2 before executing and explains supported machine output commands

#### Scenario: CLI06-04 Read-only doctor
- **GIVEN** an incomplete installation
- **WHEN** doctor runs
- **THEN** it reports actionable missing tool/kit findings without installing software or changing credentials

### Requirement: Canonical consumer and capability migration
CLI SHALL provide a versioned capability description of CLI version, canonical commands and supported output schemas through dev capabilities --json. Editor, templates, docs copy snippets, completions and active CI gates SHALL consume canonical operations; incompatible capabilities SHALL fail with upgrade guidance without trying old dispatch. Historical versioned evidence SHALL remain historical.

#### Scenario: CLI06-05 Editor negotiation
- **GIVEN** an editor requiring check and dev lsp
- **WHEN** a connected CLI lacks those capabilities
- **THEN** the editor reports required upgrade and does not invoke retired commands

#### Scenario: CLI06-05 Active consumers
- **GIVEN** 0.6 release consumers
- **WHEN** inventory/help/completion and invocation tests run
- **THEN** every active command matches canonical grammar and historical artifacts remain unchanged

### Requirement: Installed beginner workflow acceptance
Release qualification SHALL repeat create/add/use/check/build/run and path dependency workflows using installed immutable candidate artifacts outside checkout on Linux x64, macOS arm64 and Windows x64. Five fresh users SHALL receive installed CLI and help alone; at least four SHALL find add within 60 seconds and at least four SHALL complete create/add/use/run within five minutes. Evidence SHALL record commands, times, failures and candidate source/artifact identities; coaching or snapshots SHALL NOT substitute for observations.

#### Scenario: CLI06-06 Qualification
- **GIVEN** a frozen installed candidate on all three native targets
- **WHEN** scripted journeys and five uncoached observations are performed
- **THEN** all native cells pass and both four-of-five thresholds have identity-bound evidence


### Requirement: Toolchain operations bind to the running installation owner
Toolchain status SHALL describe the actual running executable, its installed prefix, version and verified installation owner without provisioning. Runtime-prefix overrides or an unrelated configured direct-install store SHALL NOT substitute another installation's identity. Toolchain update SHALL permit direct-download activation only when the running executable belongs to the verified active installation in that store. Package-manager and native-installer ownership SHALL be recorded by closed versioned receipts binding the complete installed payload inventory, release version and target. Receipts SHALL be checked through the existing installed-prefix runtime and Corelib validators. Unknown, malformed, conflicting or tampered ownership SHALL fail update before release lookup, download or filesystem mutation. Verified manager-owned installations SHALL receive fixed owner-specific update guidance instead of being overwritten by the direct updater.

#### Scenario: CLI06-OWNER-STATUS Actual running executable
- **GIVEN** an executable outside the installed bin layout and an unrelated empty direct-install store
- **WHEN** toolchain status is requested
- **THEN** it describes that executable and unknown ownership without creating the store or substituting its active version

#### Scenario: CLI06-OWNER-DIRECT Active direct installation
- **GIVEN** a verified direct installation whose active store coordinate and actual executable match
- **WHEN** toolchain update is requested
- **THEN** the existing source-bound manifest and archive verification path installs and activates the qualified replacement

#### Scenario: CLI06-OWNER-MANAGER Manager-owned installation
- **GIVEN** a complete installation with a valid Homebrew or Debian ownership receipt
- **WHEN** toolchain update is requested
- **THEN** it provides the corresponding fixed package-manager guidance and makes no direct-install mutation or download

#### Scenario: CLI06-OWNER-INVALID Invalid ownership authority
- **GIVEN** absent, conflicting, malformed or payload-mismatched ownership receipts
- **WHEN** toolchain update is requested
- **THEN** it fails with actionable ownership guidance before resolving a release URL or modifying installed state

### Requirement: Installation owner receipt production is explicit and prefix bound
The internal `dev toolchain-owner` command SHALL stamp a closed installation owner receipt only for its actual executable's complete private installed prefix, after the shared installed runtime and Corelib validators accept the requested release version and target. It SHALL NOT accept a prefix override, create a direct-install receipt outside the verified archive installer, overwrite a conflicting receipt, or consult credentials. Local installation SHALL preserve user-owned data outside this closed payload and validate its staged receipt before publishing the private prefix. Package staging SHALL keep the original qualified bundle unchanged and produce an owner receipt only in the channel's private copy.

#### Scenario: CLI06-OWNER-PRODUCER Qualified staged executable
- **GIVEN** a staged complete private prefix and its executable
- **WHEN** `dev toolchain-owner --owner manual --version <release> --target <target>` is invoked from that executable
- **THEN** the shared validator checks that exact prefix and emits its inventory-bound manual receipt without provisioning or accessing credentials

#### Scenario: CLI06-OWNER-PRODUCER-INVALID Invalid owner or layout
- **GIVEN** a binary outside the installed bin layout, a mismatched coordinate, an unknown owner, or a conflicting receipt
- **WHEN** owner receipt production is requested
- **THEN** it fails before writing a receipt or changing existing installation state

### Requirement: Dependency change reports preserve source coordinates
Every dependency change report SHALL identify whether a dependency was added, removed, changed, or refreshed and retain its actual source coordinate before and after the operation. A path or Git dependency without a registry version SHALL NOT be described as absent merely because its version is unset. Structured version fields SHALL remain absent for unversioned sources; human output SHALL identify their path or Git coordinate.

#### Scenario: CLI06-DEP-REPORT Path add and remove
- **WHEN** a local path dependency is added or removed
- **THEN** the human report identifies the operation and the actual path
- **AND** its structured version fields remain null rather than manufacturing a version

#### Scenario: CLI06-DEP-REPORT Source replacement
- **WHEN** an existing dependency changes its source coordinate
- **THEN** the report retains both the previous and replacement coordinate
- **AND** neither coordinate is inferred solely from the presence of a registry version
