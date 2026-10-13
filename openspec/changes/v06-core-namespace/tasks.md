## 1. Validate

- [ ] 1.1 Validate this change with `openspec validate v06-core-namespace --strict` and regenerate `openspec/catalog.json`. (Strict validation passes; `openspec/catalog.json` is not yet regenerated.)
- [x] 1.2 Confirm that dependency labels never become module path segments (`module_namespace_v06`). (`beskid_analysis/tests/module_namespace_v06.rs` `core_graph_keeps_host_unprefixed_and_corelib_package_native` asserts `Helpers`, `Core.Output`, `Testing.Assert`, `Concurrency.Fiber` and `Beskid.Compiler.Collect` under a `Core` label.)

## 2. Introduce

- [x] 2.1 Infer package-native logical module paths for host and dependency units.
- [x] 2.2 Inject the implicit Corelib dependency as `Core`; reserve the label for the Corelib aggregate and require `source = path`.
- [x] 2.3 Report `Std`-qualified paths as ordinary E1105/E1108 unknown module paths (the migration hint was removed by the 2026-10-12 test audit: no users).

## 3. Migrate

- [x] 3.1 Move fixtures, tests, LSP tests and formatter fixtures to package-native paths.
- [x] 3.2 Move Docs, Book and informative OpenSpec examples to package-native paths.
- [x] 3.3 Regenerate every `Project.lock` with `beskid update --all --offline --project <bproj>`. (No tracked `Project.lock` in the root, compiler or Corelib repository records `Std`.)

## 4. Delete

- [x] 4.1 Delete the `Std` prefixing, the `Std.` disk-lookup candidate, the App-only alias registry and the `Std.Concurrency.Fiber` lookup.

## 5. Verify

- [ ] 5.1 Run the `beskid_analysis`, `beskid_queries`, `beskid_tests_projects`, `beskid_lsp`, `beskid_cli` and `beskid_e2e_tests` gates on the builder.
