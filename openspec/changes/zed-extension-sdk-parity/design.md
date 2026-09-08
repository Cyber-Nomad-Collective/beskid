## Context

The Zed extension is a separate package consumed by the Zed registry. Its
package boundary and WASI target must remain unambiguous, while the language
server must be selected predictably across supported hosts. The existing
`tooling--vscode-extension--extension-surface` capability is the source for
language-client, settings, and language-feature parity, but its activity-bar
and webview UI is not portable to Zed.

## Decisions

### Package and SDK boundary

The extension is rooted at `editors/zed`, with `editors/zed/Cargo.toml` as its
only Zed Rust package and the extension manifest owned by that package. The
package uses `zed_extension_api` version `0.7.0` and compiles for
`wasm32-wasip2`. A root `extension.toml` or root Zed Rust package is forbidden
so registry packaging cannot accidentally select a second implementation.

### Binary resolution

The extension resolves the Beskid language-server binary from the configured
installation/runtime location using a documented, deterministic candidate
order. It SHALL validate that the selected path is a regular executable file,
and SHALL reject ambiguous or missing candidates with an actionable error. It
must not silently fall back to PATH, a network download, a guessed relative
path, or an incompatible host binary.

### Supported platforms and forwarding

The manifest declares only the supported host/platform combinations. Unsupported
platforms fail closed with a clear diagnostic. The extension forwards the
configured server path and relevant Beskid settings into the LSP initialization
and configuration flow, and changes to server-path settings restart the client;
ordinary settings changes use configuration notifications.

### Language and runnable assets

The package ships the Beskid language definition, query files, snippets, and
runnable/task definitions required for `.bd` editing and execution. Assets are
owned by the Zed package, use stable repository-relative paths, and are checked
by the package gate so a source checkout and registry artifact expose the same
surface.

### Capability and UI boundary

The extension requests only the Zed capabilities required for language-server
startup, editor configuration, and approved runnable actions. It does not claim
to provide VS Code activity-bar views, webview panels, status-bar modal cards,
or the VS Code package/project/outline UI. Documentation must distinguish
implemented parity from unsupported UI rather than implying that those views
exist in Zed.

## Consequences

- Registry packaging has one discoverable owner and one SDK/target contract.
- Runtime failures are explicit and diagnosable instead of silently selecting a
  wrong binary.
- Zed receives the language and execution parity that is portable from VS Code,
  while unsupported editor-specific UI remains honestly documented.
- Adding a host requires an explicit manifest, binary, and verification update.
