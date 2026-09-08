## 1. Normative contract

- [x] 1.1 Add the Zed extension-surface capability delta.
- [x] 1.2 Validate the change strictly with the non-interactive OpenSpec gate.
- [x] 1.3 Review every requirement against the existing VS Code extension
  capability and the approved design.

## 2. Package and runtime parity

- [ ] 2.1 Create the registry-owned `editors/zed` package with
  `zed_extension_api = 0.7.0` and the `wasm32-wasip2` target.
- [ ] 2.2 Implement deterministic binary resolution with executable-file
  validation and actionable, fail-closed errors.
- [ ] 2.3 Declare supported platforms and reject unsupported platforms without
  fallback or download behavior.
- [ ] 2.4 Forward server-path and supported Beskid settings through LSP
  initialization/configuration, restarting only when required.

## 3. Assets and capability boundary

- [ ] 3.1 Add and package the Beskid language definition and query files.
- [ ] 3.2 Add snippets and runnable/task definitions with stable package paths.
- [ ] 3.3 Restrict requested Zed capabilities to the approved language and
  runnable surface.
- [ ] 3.4 Document supported parity and unsupported VS Code-specific UI.

## 4. Verification and promotion

- [ ] 4.1 Add package-layout and manifest checks proving no root Zed package or
  root `extension.toml` exists.
- [ ] 4.2 Add target-build, binary-resolution, platform-failure, forwarding,
  asset, capability, and documentation tests.
- [ ] 4.3 Run the strict OpenSpec validation and package gate before accepting
  the change.
