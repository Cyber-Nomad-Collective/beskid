## 1. Normative contract

- [x] 1.1 Add the Zed extension-surface capability delta.
- [x] 1.2 Validate the change strictly with the non-interactive OpenSpec gate.
  Focused strict validation passed with the project-pinned OpenSpec 1.6.0 via
  `pnpm dlx`; repository-local `node_modules` were unavailable.
- [x] 1.3 Review every requirement against the existing VS Code extension
  capability and the approved design.

## 2. Package and runtime parity

- [x] 2.1 Create the registry-owned `editors/zed` package with
  `zed_extension_api = 0.7.0` and the `wasm32-wasip2` target.
- [x] 2.2 Implement deterministic binary resolution with executable-file
  validation and actionable, fail-closed errors.
- [x] 2.3 Declare supported download platforms and reject unsupported download
  fallback while preserving configured and PATH-resolved servers.
- [x] 2.4 Forward server-path and supported Beskid settings through LSP
  initialization/configuration, taking effect on Zed's next managed restart.

## 3. Assets and capability boundary

- [x] 3.1 Add and package the Beskid language definition and query files.
- [x] 3.2 Add snippets and runnable/task definitions with stable package paths.
- [x] 3.3 Restrict requested Zed capabilities to the approved language and
  runnable surface.
- [x] 3.4 Document supported parity and unsupported VS Code-specific UI.
- [x] 3.5 Register standalone `.bsol` with the existing native `beskid_lsp`
  adapter and document the intentionally deferred Tree-sitter surface.

## 4. Verification and promotion

- [x] 4.1 Add package-layout and manifest checks proving no root Zed package or
  root `extension.toml` exists.
- [x] 4.2 Add target-build, binary-resolution, platform-failure, forwarding,
  asset, capability, and documentation tests.
- [x] 4.3 Run the strict OpenSpec validation and package gate before accepting
  the change. Focused strict validation and all Zed gates passed. The full
  repository-local `pnpm openspec:validate` suite was not run because its
  dependencies were unavailable and local disk space was constrained.
