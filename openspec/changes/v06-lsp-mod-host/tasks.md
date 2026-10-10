## 1. Validate

- [ ] 1.1 Validate this change with `openspec validate v06-lsp-mod-host --strict` and regenerate `openspec/catalog.json`.

## 2. Introduce

- [x] 2.1 Parse and validate `initializationOptions.modHost` at `initialize`; reject invalid values with JSON-RPC `InvalidParams`.
- [x] 2.2 Run project preparation Mods in the selected Mod host with the same artifact descriptor and authority qualification as the installed host.
- [x] 2.3 Report project preparation failures as a `project-preparation` error diagnostic and a log record.
- [x] 2.4 Accept `modHost.runtimePrefix` and `modHost.runtimeProfile`; validate the prefix as an exact runtime kit at `initialize` and fail closed.
- [x] 2.5 Carry the runtime kit as one value (`RuntimeKitSelection`) through Mod qualification and loading; remove process-environment reads from Mod loading and environment mutation from the test Mod host harness.

## 3. Verify

- [ ] 3.1 Run the `beskid_lsp`, `beskid_tools`, `beskid_analysis` (`mod_host`) and `beskid_engine` gates on the builder.
