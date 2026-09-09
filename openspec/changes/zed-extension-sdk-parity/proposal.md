## Why

The Beskid editor integrations need a normative contract for a registry-compatible
Zed extension. Without one, package ownership, SDK and target selection, runtime
binary lookup, and the boundary between supported parity and unsupported UI can
drift from the existing VS Code extension capabilities.

## What Changes

- Define the Zed extension package boundary at `editors/zed`.
- Pin the Zed SDK and compilation target required by the registry.
- Define deterministic, fail-closed resolution of the Beskid language-server
  binary and forwarding of LSP/settings configuration.
- Require parity assets for the Beskid language, queries, snippets, and
  runnables, while restricting extension capabilities to the approved surface.
- Document supported parity and explicitly identify UI that Zed does not claim
  to implement.
- Define verification gates for package layout, target compilation, assets, and
  binary/platform behavior.

## Capabilities

### New Capabilities

- `tooling--zed-extension--extension-surface`: Normative Zed extension package,
  SDK, runtime, asset, capability, and verification contract.

### Modified Capabilities

- `tooling--vscode-extension--extension-surface`: consumed as the parity source;
  no VS Code behavior is changed by this proposal.

## Impact

The future Zed implementation and package gate must follow the new
`editors/zed` boundary and the specified SDK/target pins. The contract creates
explicit obligations for the language-server launcher, LSP initialization,
settings forwarding, language assets, and truthful feature documentation. It
does not claim parity for VS Code-specific views, webviews, status-bar modal
overlays, or other UI that Zed cannot provide.
