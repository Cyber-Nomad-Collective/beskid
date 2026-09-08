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
order: configured override; `beskid_lsp` on PATH; `beskid` on PATH invoked as
`beskid lsp`; then the `lsp-stable` download. It SHALL select only a present,
regular executable file compatible with the declared host platform, and SHALL
report an actionable error when all candidates fail. The download SHALL be
restricted to `github.com/Cyber-Nomad-Collective/beskid_compiler/**`; the
extension SHALL NOT select a guessed relative path or an incompatible host
binary.

Native `beskid_lsp` SHALL remain the semantic and workspace authority. The
extension SHALL only launch and configure that server and SHALL NOT duplicate
semantic analysis, workspace discovery, diagnostics, query, graph, or domain
behavior locally.

#### Scenario: Configured executable wins deterministically

- **GIVEN** a configured Beskid server path points to a regular executable file
- **WHEN** the extension initializes the language server
- **THEN** it launches that path
- **AND** it does not search or download another binary

#### Scenario: PATH and stable download fallbacks follow the fixed order

- **GIVEN** no configured override is usable
- **WHEN** binary resolution runs
- **THEN** it tries `beskid_lsp` on PATH, then `beskid lsp`, then the
  `lsp-stable` download in that order
- **AND** it never tries a later candidate before an earlier candidate fails

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

The extension SHALL declare exactly this release matrix: Linux x86-64 uses
`beskid_lsp-linux-amd64`; macOS arm64 uses `beskid_lsp-darwin-arm64`; Windows
x86-64 uses `beskid_lsp-windows-amd64.exe`. Every other host/platform pair
SHALL be rejected before launching a server. Unsupported platforms SHALL
produce a clear diagnostic and SHALL NOT use a compatibility fallback, network
download, or host-binary substitution.

#### Scenario: Unsupported host is rejected

- **GIVEN** the extension runs on a host outside its declared platform matrix
- **WHEN** activation resolves runtime support
- **THEN** activation reports the unsupported platform
- **AND** no language-server process is started

#### Scenario: Supported release asset is selected

- **GIVEN** a host is Linux x86-64, macOS arm64, or Windows x86-64
- **WHEN** the stable release fallback is selected
- **THEN** it selects respectively `beskid_lsp-linux-amd64`,
  `beskid_lsp-darwin-arm64`, or `beskid_lsp-windows-amd64.exe`

### Requirement: LSP and settings forwarding parity

The extension SHALL initialize the Beskid language server with initialization
options containing the resolved server path and workspace roots, plus the
workspace `settings` payload containing supported Beskid settings. It SHALL
forward subsequent supported setting changes through LSP configuration
notifications.
A server-path change SHALL restart the language client; ordinary setting or
focus changes SHALL NOT restart it unless the LSP contract requires restart.

#### Scenario: Initialization forwards workspace and settings

- **GIVEN** a supported workspace and configured Beskid settings
- **WHEN** the language client initializes
- **THEN** the initialize/configuration payload contains the workspace roots
  and supported settings

#### Scenario: Server path change restarts the client

- **GIVEN** an initialized client and a changed server path setting
- **WHEN** the setting change is applied
- **THEN** the existing client is stopped and restarted with the new path

#### Scenario: Non-path setting change is notified

- **GIVEN** an initialized client and a changed non-path Beskid setting
- **WHEN** the setting change is applied
- **THEN** the client receives a configuration notification
- **AND** the client is not restarted

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

The extension SHALL request and use only this capability allowlist: process
launch for Beskid executable forms `beskid_lsp [args]` and `beskid lsp [args]`;
read/write access to the workspace and extension-managed runtime cache;
download access to `github.com/Cyber-Nomad-Collective/beskid_compiler/**`; and
editor/LSP configuration plus the approved task commands `test`, `run`,
`build`, `analyze`, `fetch`, and `lock`. It SHALL NOT request or use any other
filesystem, network, process, telemetry, or UI capability, and SHALL keep
secrets out of extension configuration.

#### Scenario: Capability manifest is minimal

- **WHEN** the package manifest is inspected
- **THEN** every requested capability maps to an approved language or runnable
  behavior
- **AND** no undeclared capability is present

#### Scenario: Download scope is restricted

- **WHEN** the extension performs the `lsp-stable` download
- **THEN** its URL is under `github.com/Cyber-Nomad-Collective/beskid_compiler/**`
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
