## Why

Project preparation in the language server runs the native Mods of the project (Corelib depends on the Serialization Mod). Before this change, the server always used the `beskid` CLI installed next to it as the Mod host. Editors and test harnesses that run a workspace build of the toolchain could not select another host, and a failed preparation could degrade silently to structural facts without an error in the editor. rust-analyzer solves the same problem with the `procMacro.server` setting.

## What Changes

- New initialization option `initializationOptions.modHost = { "path": "<absolute beskid executable>" }` selects the native Mod host executable. Without the option, the server uses the `beskid` CLI installed next to the language server binary.
- An invalid `modHost` value fails `initialize` with the JSON-RPC `InvalidParams` error. The server never falls back to the installed Mod host.
- The selected Mod host does not bypass Mod artifact descriptor and authority qualification.
- A project preparation failure is reported as a `project-preparation` error diagnostic and as a log record. It is never dropped.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tooling--lsp--diagnostics-and-workspace-analysis`: Mod host selection at `initialize` and visible project preparation failures.

## Impact

Compiler: `beskid_lsp` (`session/mod_host.rs`, `server/backend.rs`, `diagnostics.rs`) and `beskid_tools::native_mods::ModHostSelection`. Editor extensions can pass the option; no extension change is required.

Compatibility: clients that do not send `modHost` keep the installed Mod host. A client that sends an invalid `modHost` value no longer starts a session.

Migration: none for clients without the option. A client that sends the option must send an object with exactly one `path` key that names an absolute path to an executable file.

Legacy URLs: no public route changes.

Reversion: revert this change set. No persisted artifact records the Mod host selection.
