## ADDED Requirements

### Requirement: Native Mod host selection at initialize
The language server SHALL accept the initialization option `modHost` in `initializationOptions` as an object with the optional keys `path`, `runtimePrefix` and `runtimeProfile`. The object SHALL contain at least one key. The `path` value SHALL select the executable that runs the native Mods of project preparation. The `runtimePrefix` value SHALL select the installation prefix of the runtime kit that Mod artifacts are qualified and loaded against. The `runtimeProfile` value SHALL select the profile of that runtime kit, `debug` or `release`; when it is absent, the profile SHALL be `debug`. When `path` is absent, the server SHALL use the `beskid` CLI that is installed next to the language server binary. When `runtimePrefix` is absent, the server SHALL use the runtime kit that the server process resolves for itself. The server SHALL read the selected runtime kit only from this selection and SHALL NOT read it from the process environment while it loads or qualifies Mod artifacts for a selection that contains `runtimePrefix`. The server SHALL validate the option during `initialize`. The server SHALL fail `initialize` with the JSON-RPC `InvalidParams` error when `modHost` is not an object, when it is empty, when it contains a key other than `path`, `runtimePrefix` and `runtimeProfile`, when a value is not a non-empty string, when `path` is a relative path or does not name an existing executable file, when `runtimePrefix` is a relative path, does not name an existing directory or does not hold an exact runtime kit for the native host target and the selected profile, when `runtimeProfile` is not `debug` or `release`, or when `runtimeProfile` is present without `runtimePrefix`. After such a failure, the server SHALL NOT fall back to the installed Mod host or the installed runtime kit. The selected Mod host and runtime kit SHALL NOT bypass Mod artifact descriptor qualification or Mod authority qualification; the server SHALL apply the same qualification to the selection as to the installed host and kit.

#### Scenario: A valid Mod host is selected
- **GIVEN** an absolute path to an existing executable `beskid` CLI
- **WHEN** the client sends `initialize` with `initializationOptions` `{ "modHost": { "path": "<that path>" } }`
- **THEN** `initialize` succeeds
- **AND** project preparation runs native Mods in that executable

#### Scenario: The option is absent
- **GIVEN** an `initialize` request without a `modHost` key in `initializationOptions`
- **WHEN** the server prepares a project with native Mods
- **THEN** it runs the Mods in the `beskid` CLI installed next to the language server binary

#### Scenario: A runtime kit is selected
- **GIVEN** an absolute path to an installation prefix that holds an exact `debug` runtime kit for the native host target
- **WHEN** the client sends `initialize` with `initializationOptions` `{ "modHost": { "path": "<beskid>", "runtimePrefix": "<that prefix>", "runtimeProfile": "debug" } }`
- **AND** the server process environment does not name a runtime kit
- **THEN** `initialize` succeeds
- **AND** project preparation qualifies and loads Mod artifacts against that runtime kit

#### Scenario: An invalid Mod host fails initialize
- **GIVEN** an `initialize` request with `modHost` set to `"beskid"`, `{}`, `{ "path": "" }`, `{ "path": "relative/beskid" }`, `{ "path": "<missing file>" }`, `{ "server": "/usr/bin/beskid" }`, `{ "runtimePrefix": "relative/prefix" }`, `{ "runtimePrefix": "<directory without a runtime kit>" }`, `{ "runtimePrefix": "<prefix>", "runtimeProfile": "fast" }` or `{ "runtimeProfile": "debug" }`
- **WHEN** the server handles `initialize`
- **THEN** it returns the JSON-RPC `InvalidParams` error with a message that names the `modHost` option
- **AND** it does not start a session with the installed Mod host

#### Scenario: The selected host does not bypass qualification
- **GIVEN** a selected Mod host or runtime kit and a Mod artifact whose descriptor or authority does not qualify
- **WHEN** project preparation loads the Mod
- **THEN** preparation fails with the same qualification error as with the installed host

### Requirement: Visible project preparation failures
When project preparation fails, the language server SHALL publish an error diagnostic with the code `project-preparation` for the affected document. The message SHALL start with `project preparation failed:` and SHALL contain the cause. The server SHALL also write a log record for the failure. The server SHALL NOT drop the failure, and SHALL NOT report only structural facts without the error diagnostic.

#### Scenario: A Mod without a current artifact
- **GIVEN** a project whose native Mod has no current artifact
- **WHEN** the client opens a source file of the project
- **THEN** the server publishes an error diagnostic with the code `project-preparation` that names the cause
- **AND** the server writes a log record for the failure
