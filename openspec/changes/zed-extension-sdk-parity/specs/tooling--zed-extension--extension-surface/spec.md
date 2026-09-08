## ADDED Requirements

### Requirement: Registry-compatible package boundary

The Beskid Zed extension SHALL be rooted at `editors/zed`, SHALL use
`zed_extension_api` version `0.7.0`, and SHALL compile for `wasm32-wasip2`.

#### Scenario: Package gate builds the extension

- **WHEN** the Zed package gate runs
- **THEN** it builds `editors/zed/Cargo.toml` for `wasm32-wasip2`
- **AND** no root `extension.toml` or root Zed Rust package exists

### Requirement: Deterministic language-server binary resolution

The extension SHALL resolve the Beskid language-server binary in this exact
order: explicit trusted user override; `beskid_lsp` on PATH; `beskid` on PATH
invoked as `beskid lsp`; then the `lsp-stable` download. An override SHALL be a
user-selected nonempty path and arguments structure. The WASM extension host
SHALL validate that structure but cannot inspect arbitrary executable contents
or prove binary compatibility before launch. The download SHALL come from the
`Cyber-Nomad-Collective/beskid_compiler` GitHub release, tag `lsp-stable`, resolve
the exact `lsp-version.txt` release asset URL, and download that projection through
a disposable temporary file. The extension SHALL trim and strictly validate the
projected immutable release-version token before using it in the versioned cache
path for the exact platform-matrix asset; the rolling release tag SHALL NOT be a
cache key. A projection token SHALL start with a digit or `v` followed by a digit;
empty, traversal, path-separator, control-character, and other unsafe projection
values SHALL fail closed. Projection fetch, read, validation, or cleanup
failure SHALL report failed installation and SHALL NOT promote or poison a binary
cache entry. No other network source or guessed relative path is allowed.
Configured and PATH-resolved commands are host-owned candidates and SHALL NOT
be rejected by the release platform matrix; platform validation applies only
when resolution reaches the download fallback.

Native `beskid_lsp` SHALL remain the semantic and workspace authority. The
extension SHALL only launch and configure that server and SHALL NOT duplicate
semantic analysis, workspace discovery, diagnostics, query, graph, or domain
behavior locally.

#### Scenario: Configured executable wins deterministically

- **GIVEN** a configured Beskid server path points to a regular executable file
- **WHEN** the extension initializes the language server
- **THEN** it launches that path
- **AND** it does not search or download another binary
- **AND** an unsupported release-download platform does not invalidate the
  trusted configured command

#### Scenario: PATH and stable download fallbacks follow the fixed order

- **GIVEN** no configured override is usable
- **WHEN** binary resolution runs
- **THEN** it tries `beskid_lsp` on PATH, then `beskid lsp`, then the
  `lsp-stable` download in that order
- **AND** it never tries a later candidate before an earlier candidate fails
- **AND** platform validation occurs only after both PATH candidates are absent

#### Scenario: Rolling release projects an immutable cache version

- **GIVEN** the `lsp-stable` release exposes `lsp-version.txt` with a valid
  immutable token such as `v2`
- **WHEN** the extension reaches the release-download fallback
- **THEN** it resolves the exact `lsp-version.txt` asset URL and reads that
  projection from a disposable temporary file
- **AND** it caches the selected platform binary at a path containing `v2`, not
  `lsp-stable`
- **AND** a missing, unreadable, or unsafe projection reports failed installation
  and leaves no promoted or poisoned cache entry

#### Scenario: Missing binary fails closed

- **GIVEN** no deterministic candidate is a compatible executable file
- **WHEN** the extension initializes
- **THEN** initialization fails with an actionable error naming the expected
  configuration or installation location

#### Scenario: Ambiguous candidates fail closed

- **GIVEN** multiple candidates tie at the selected precedence
- **WHEN** binary resolution runs
- **THEN** resolution fails with an ambiguity error
- **AND** no candidate is launched

### Requirement: Fail-closed platform support

The release-download fallback SHALL declare exactly this release matrix: Linux x86-64 uses
`beskid_lsp-linux-amd64`; macOS arm64 uses `beskid_lsp-darwin-arm64`; Windows
x86-64 uses `beskid_lsp-windows-amd64.exe`. When resolution reaches that
fallback, every other host/platform pair SHALL be rejected before requesting or
launching a release asset. Unsupported release-download platforms SHALL produce
a clear diagnostic and SHALL NOT use a compatibility fallback or network
download. Trusted configured and PATH-resolved commands remain usable on hosts
outside the release matrix.

#### Scenario: Unsupported host is rejected

- **GIVEN** the extension runs on a host outside its declared release platform
  matrix and no configured or PATH command is selected
- **WHEN** resolution reaches the stable release fallback
- **THEN** activation reports the unsupported platform
- **AND** no release asset is requested or language-server process is started

#### Scenario: Host-owned command bypasses release platform mapping

- **GIVEN** the extension runs on a host outside its declared release platform
  matrix and a configured or PATH-resolved Beskid command is selected
- **WHEN** the extension initializes the language server
- **THEN** it launches the selected host-owned command
- **AND** it does not resolve or download a release asset

#### Scenario: Supported release asset is selected

- **GIVEN** a host is Linux x86-64, macOS arm64, or Windows x86-64
- **WHEN** the stable release fallback is selected
- **THEN** it selects respectively `beskid_lsp-linux-amd64`,
  `beskid_lsp-darwin-arm64`, or `beskid_lsp-windows-amd64.exe`

### Requirement: LSP and settings forwarding parity

The extension SHALL forward the exact Zed keys `lsp.beskid-lsp.binary.path`,
`lsp.beskid-lsp.arguments`, `lsp.beskid-lsp.env`,
`lsp.beskid-lsp.initialization_options`, and `lsp.beskid-lsp.settings`.
Initialization options and settings SHALL be opaque JSON forwarded unchanged.
Workspace settings SHALL be returned unchanged whenever Zed requests
configuration. Binary and initialization-option changes SHALL take effect on
the next Zed-managed language-server restart. The extension has no
event-listener/restart API and SHALL NOT claim to perform those host behaviors.

#### Scenario: Initialization forwards workspace and settings

- **GIVEN** a supported workspace and configured values for the exact Zed keys
  `lsp.beskid-lsp.binary.path`, `.arguments`, `.env`,
  `.initialization_options`, and `.settings`
- **WHEN** the language client initializes
- **THEN** initialization options and workspace `settings` contain the exact
  opaque JSON values unchanged

#### Scenario: Server path change restarts the client

- **GIVEN** an initialized client and changed binary or initialization-option
  values
- **WHEN** Zed performs its next managed language-server restart
- **THEN** the new values are used
- **AND** the extension itself does not claim to stop or restart the client

#### Scenario: Non-path setting change is notified

- **GIVEN** an initialized client and a workspace settings request from Zed
- **WHEN** the extension responds to the configuration request
- **THEN** it returns the `lsp.beskid-lsp.settings` JSON unchanged

#### Scenario: Native server remains authority

- **GIVEN** a request for semantic analysis or workspace data
- **WHEN** the Zed extension handles the request
- **THEN** it obtains the result from native `beskid_lsp`
- **AND** it does not rebuild or reinterpret the result locally

### Requirement: Language, query, snippet, and runnable assets

The registry package SHALL include the Beskid `.bd` language definition, its
query files, snippets, and runnable/task definitions. Each asset SHALL be
owned by `editors/zed`, referenced by a stable package-relative path, and
included in the built registry artifact.

#### Scenario: Beskid editing assets are packaged

- **WHEN** the package artifact is assembled
- **THEN** the language definition, queries, and snippets are present at their
  declared paths
- **AND** `.bd` files resolve to the Beskid language configuration

#### Scenario: Runnable asset is available

- **GIVEN** a supported Beskid project
- **WHEN** a user invokes a declared runnable/task
- **THEN** the package resolves the declared runnable definition and forwards
  the action to the Beskid toolchain

### Requirement: Restricted extension capabilities

The extension SHALL request and use only `download_file` for the exact GitHub
release repository path and `process:exec` for launching explicit,
PATH-resolved, or downloaded Beskid server commands. Because Zed's static
capability matcher cannot enumerate trusted configured paths or arguments that
the extension forwards unchanged, the manifest SHALL declare the minimum
schema-compatible process capability: `command = "*"`, `args = ["**"]`. Its
operational scope SHALL remain limited: the extension SHALL construct only the
selected Beskid server command after deterministic resolution. Workspace file
access and task execution are host-owned capabilities and SHALL NOT be claimed
by the extension. The approved task commands are `beskid test`,
`beskid run ... --entrypoint ...`, `beskid build`, `beskid analyze`,
`beskid fetch`, and `beskid lock`; the extension SHALL only declare their runnable
definitions. No other capability is requested, and secrets SHALL stay out of
extension configuration.

#### Scenario: Capability manifest is minimal

- **WHEN** the package manifest is inspected
- **THEN** every requested capability maps to an approved language or runnable
  behavior
- **AND** it contains exactly one `process:exec` declaration with
  `command = "*"` and `args = ["**"]`
- **AND** no undeclared capability is present

#### Scenario: Download scope is restricted

- **WHEN** the extension performs the `lsp-stable` download
- **THEN** its binary and `lsp-version.txt` projection URLs are exact
  `lsp-stable` release assets from repository
  `Cyber-Nomad-Collective/beskid_compiler`
- **AND** the selected asset is exact for the declared platform matrix and the
  cache path contains the validated `lsp-version.txt` projection
- **AND** no other host or path is contacted

### Requirement: Honest unsupported-UI documentation

The extension documentation SHALL identify the supported Zed parity surface
and SHALL explicitly state that VS Code-specific activity-bar views, webview
panels, status-bar modal cards, and package/project/outline UI are not provided
unless separately implemented and verified in Zed. Documentation SHALL NOT
claim those unsupported surfaces as available.

#### Scenario: Unsupported UI is clearly disclosed

- **WHEN** a user reads the Zed extension documentation
- **THEN** supported language/LSP/runnable behavior is distinguishable from
  unsupported VS Code-specific UI
- **AND** no unsupported view is presented as a Zed feature

### Requirement: Normative parity verification

The Zed package gate SHALL verify the package boundary, SDK version, target,
declared platform matrix, deterministic binary resolution, LSP/settings
forwarding, packaged assets, restricted capabilities, and unsupported-UI
documentation. The gate SHALL fail when any required check is absent or
violated.

#### Scenario: Parity gate rejects an incomplete package

- **GIVEN** a package missing a required asset, target declaration, or
  unsupported-UI disclosure
- **WHEN** the Zed package gate runs
- **THEN** the gate fails with the violated contract identified

#### Scenario: Complete package passes verification

- **GIVEN** a package satisfying all Zed extension-surface requirements
- **WHEN** the strict package and OpenSpec gates run
- **THEN** both gates complete successfully
