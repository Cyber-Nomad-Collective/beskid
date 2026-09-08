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

The extension resolves the Beskid language-server binary in exactly this order:
(1) configured override; (2) `beskid_lsp` on PATH; (3) `beskid` on PATH,
invoked as `beskid lsp`; (4) the `lsp-stable` download. It SHALL validate that
the selected path is a regular executable file compatible with the host and
shall report an actionable error if all candidates fail. The download is
restricted to `github.com/Cyber-Nomad-Collective/beskid_compiler/**`; no other
network source, guessed relative path, or incompatible host binary is allowed.

Native `beskid_lsp` remains the semantic and workspace authority. The Zed
extension only launches and configures that server; it SHALL NOT rebuild,
duplicate, or locally reinterpret semantic analysis, workspace discovery,
diagnostics, queries, or graph/domain behavior.

### Supported platforms and forwarding

The release matrix is exact: Linux x86-64 uses
`beskid_lsp-linux-amd64`, macOS arm64 uses `beskid_lsp-darwin-arm64`, and
Windows x86-64 uses `beskid_lsp-windows-amd64.exe`. Other host/platform pairs
fail closed with a clear diagnostic. The extension forwards the configured
server path and the initialization options plus workspace `settings` payloads
into the LSP flow. A server-path change restarts the client; ordinary settings
changes use configuration notifications.

### Language and runnable assets

The package ships the Beskid language definition, query files, snippets, and
runnable/task definitions required for `.bd` editing and execution. Assets are
owned by the Zed package, use stable repository-relative paths, and are checked
by the package gate so a source checkout and registry artifact expose the same
surface.

### Capability and UI boundary

The capability allowlist is: process launch only for Beskid executable forms
`beskid_lsp [args]` and `beskid lsp [args]`; read/write access only to the
workspace and extension-managed runtime cache; download access only to
`github.com/Cyber-Nomad-Collective/beskid_compiler/**`; and editor/LSP
configuration plus the approved task commands. No other process, filesystem,
network, telemetry, or UI capability is requested. The extension does not claim
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
