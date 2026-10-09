## ADDED Requirements

### Requirement: Native Mod host selection at initialize
The language server SHALL accept the initialization option `modHost` in `initializationOptions` with the form `{ "path": "<absolute path>" }`. The `path` value SHALL select the executable that runs the native Mods of project preparation. When the option is absent, the server SHALL use the `beskid` CLI that is installed next to the language server binary. The server SHALL validate the option during `initialize`. The server SHALL fail `initialize` with the JSON-RPC `InvalidParams` error when `modHost` is not an object, when it contains a key other than `path`, when `path` is missing, is not a string, is empty or is a relative path, or when `path` does not name an existing executable file. After such a failure, the server SHALL NOT fall back to the installed Mod host. The selected Mod host SHALL NOT bypass Mod artifact descriptor qualification or Mod authority qualification; the server SHALL apply the same qualification to the selected host as to the installed host.

#### Scenario: A valid Mod host is selected
- **GIVEN** an absolute path to an existing executable `beskid` CLI
- **WHEN** the client sends `initialize` with `initializationOptions` `{ "modHost": { "path": "<that path>" } }`
- **THEN** `initialize` succeeds
- **AND** project preparation runs native Mods in that executable

#### Scenario: The option is absent
- **GIVEN** an `initialize` request without a `modHost` key in `initializationOptions`
- **WHEN** the server prepares a project with native Mods
- **THEN** it runs the Mods in the `beskid` CLI installed next to the language server binary

#### Scenario: An invalid Mod host fails initialize
- **GIVEN** an `initialize` request with `modHost` set to `"beskid"`, `{}`, `{ "path": "" }`, `{ "path": "relative/beskid" }`, `{ "path": "<missing file>" }` or `{ "server": "/usr/bin/beskid" }`
- **WHEN** the server handles `initialize`
- **THEN** it returns the JSON-RPC `InvalidParams` error with a message that names the `modHost` option
- **AND** it does not start a session with the installed Mod host

#### Scenario: The selected host does not bypass qualification
- **GIVEN** a selected Mod host and a Mod artifact whose descriptor or authority does not qualify
- **WHEN** project preparation loads the Mod
- **THEN** preparation fails with the same qualification error as with the installed host

### Requirement: Visible project preparation failures
When project preparation fails, the language server SHALL publish an error diagnostic with the code `project-preparation` for the affected document. The message SHALL start with `project preparation failed:` and SHALL contain the cause. The server SHALL also write a log record for the failure. The server SHALL NOT drop the failure, and SHALL NOT report only structural facts without the error diagnostic.

#### Scenario: A Mod without a current artifact
- **GIVEN** a project whose native Mod has no current artifact
- **WHEN** the client opens a source file of the project
- **THEN** the server publishes an error diagnostic with the code `project-preparation` that names the cause
- **AND** the server writes a log record for the failure
