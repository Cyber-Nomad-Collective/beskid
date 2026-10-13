## 1. Validate

- [ ] 1.1 Validate this change with `openspec validate v06-lsp-mod-host --strict` and regenerate `openspec/catalog.json`.
  - Remaining: `openspec validate v06-lsp-mod-host --strict --no-interactive` passes on 2026-10-13; the catalog is regenerated when the change is applied.

## 2. Introduce

- [x] 2.1 Parse and validate `initializationOptions.modHost` at `initialize`; reject invalid values with JSON-RPC `InvalidParams`. Evidence: `mod_host_from_initialization_options` in `compiler/crates/beskid_lsp/src/session/mod_host.rs` (with its invalid-option unit tests); `jsonrpc::Error::invalid_params` in `compiler/crates/beskid_lsp/src/server/backend.rs`.
- [x] 2.2 Run project preparation Mods in the selected Mod host with the same artifact descriptor and authority qualification as the installed host. Evidence: `ModHostSelection` (`beskid_tools::native_mods`) is passed into `ProjectPreparation` in `compiler/crates/beskid_lsp/src/diagnostics.rs`; `RuntimeKitSelection::explicit` in `compiler/crates/beskid_analysis/src/mod_host/host.rs` resolves an exact kit through `resolve_installed_runtime_kit`.
- [x] 2.3 Report project preparation failures as a `project-preparation` error diagnostic and a log record. Evidence: `project_preparation_failure` and the `tracing::warn!` record in `compiler/crates/beskid_lsp/src/diagnostics.rs`; `compiler/crates/beskid_lsp/src/features/intellisense_tests.rs` asserts the `project-preparation` code.
- [x] 2.4 Accept `modHost.runtimePrefix` and `modHost.runtimeProfile`; validate the prefix as an exact runtime kit at `initialize` and fail closed. Evidence: `compiler/crates/beskid_lsp/src/session/mod_host.rs` (`runtimeProfile` requires `runtimePrefix`; kitless prefix rejected with "holds no exact").
- [x] 2.5 Carry the runtime kit as one value (`RuntimeKitSelection`) through Mod qualification and loading; remove process-environment reads from Mod loading and environment mutation from the test Mod host harness. Evidence: `RuntimeKitSelection` in `compiler/crates/beskid_analysis/src/mod_host/host.rs`; the only environment reads (`BESKID_RUNTIME_PREFIX`, `BESKID_RUNTIME_KIT_PROFILE` in `native_mod_runtime_profile`) are in `RuntimeKitSelection::installed`, the process self-resolution used when `runtimePrefix` is absent; `compiler/crates/beskid_lsp/src/test_mod_host.rs` sets no environment variables.

## 3. Verify

- [ ] 3.1 Run the `beskid_lsp`, `beskid_tools`, `beskid_analysis` (`mod_host`) and `beskid_engine` gates on the builder.
  - Remaining: no run log is recorded in the repository.
