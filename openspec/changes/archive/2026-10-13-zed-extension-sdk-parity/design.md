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
(1) explicit trusted user override; (2) `beskid_lsp` on PATH; (3) `beskid` on
PATH, invoked as `beskid lsp`; (4) the `lsp-stable` release download. An
override is a user-selected nonempty path and arguments structure. The WASM
extension host validates that structure but cannot inspect arbitrary executable
contents or prove binary compatibility before launch. Each named PATH lookup
uses Zed's `Worktree::which`; Zed returns the host-selected executable according
to worktree PATH order, so the extension neither receives a tied candidate set
nor adds a conflicting ambiguity policy. The download comes from
the `Cyber-Nomad-Collective/beskid_compiler` GitHub release, tag `lsp-stable`,
resolves the exact `lsp-version.txt` release asset URL first, downloads that
projection through a disposable temporary file, and trims then strictly validates
its immutable release-version token before using it in the versioned cache path
for the exact platform-matrix asset. The rolling release tag itself is never a
cache key. A projection token starts with a digit or `v` followed by a digit;
empty, traversal, path-separator, control-character, and other unsafe projection
values fail closed; projection fetch/read/cleanup failures report a
failed installation and cannot promote or poison a binary cache entry. No other
network source or guessed relative path is allowed.
The release matrix is evaluated only for that final download fallback;
configured and PATH-resolved commands are host-owned and remain usable on
hosts outside the release matrix.

Native `beskid_lsp` remains the semantic and workspace authority. The Zed
extension only launches and configures that server; it SHALL NOT rebuild,
duplicate, or locally reinterpret semantic analysis, workspace discovery,
diagnostics, queries, or graph/domain behavior.

### Supported platforms and forwarding

The release matrix is exact: Linux x86-64 uses
`beskid_lsp-linux-amd64`, macOS arm64 uses `beskid_lsp-darwin-arm64`, and
Windows x86-64 uses `beskid_lsp-windows-amd64.exe`. Other host/platform pairs
fail closed with a clear diagnostic only if resolution reaches the release
download fallback; they do not invalidate a configured or PATH-resolved server
command. The extension forwards the configured server path and the exact Zed
keys `lsp.beskid-lsp.binary.path`,
`lsp.beskid-lsp.arguments`, `lsp.beskid-lsp.env`,
`lsp.beskid-lsp.initialization_options`, and `lsp.beskid-lsp.settings` into the
LSP flow. Initialization options and settings are opaque JSON forwarded
unchanged. The host applies binary and initialization-option changes on its
next Zed-managed language-server restart; workspace settings are returned
unchanged whenever Zed requests configuration. The extension has no
event-listener/restart API and does not claim to perform those host behaviors.

### Language and runnable assets

The package ships the Beskid language definition, query files, snippets, and
runnable/task definitions required for `.bd` editing and execution. It also
registers standalone `.bsol` as `Beskid BSOL` and maps it to the existing
`beskid-lsp` server using the `bsol` language ID. Native `beskid_lsp` owns
generic BSOL diagnostics and its small generic completion/hover surface; no
second Zed adapter or installer exists.

Zed's grammar manifest supports a repository-relative path, so the extension
pins `beskid_bsol` at its exact submodule commit and selects
`grammars/tree-sitter-bsol`. It packages an adapted highlights query against
the grammar's actual node fields. This preserves one adapter and avoids
incorrectly reusing the Beskid source grammar. Assets are owned by the Zed
package, use stable repository-relative paths, and are checked by the package
gate so a source checkout and registry artifact expose the same surface.

### Capability and UI boundary

The capability allowlist is only `download_file` for the exact GitHub release
repository path and `process:exec` narrowly scoped to launching explicit,
PATH-resolved, or downloaded Beskid server commands. Zed's static matcher
requires `command = "*"`, `args = ["**"]` to preserve trusted configured
arguments unchanged and to permit arbitrary explicit or versioned cache paths;
the extension keeps that capability operationally narrow by constructing only
the selected Beskid server command. Workspace file access and task execution
are host-owned capabilities and are not claimed by the extension. No other
process, filesystem, network, telemetry, or UI capability is requested. The extension does not claim
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
