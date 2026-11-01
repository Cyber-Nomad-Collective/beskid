## 1. Validate

- [ ] 1.1 Validate this change with `openspec validate v06-qualified-dependency-paths --strict` and regenerate `openspec/catalog.json`. (Strict validation passes; `openspec/catalog.json` is not yet regenerated.)

## 2. Introduce

- [x] 2.1 Resolve each logical module path against every effective root and fail closed with `AmbiguousModulePath` (E1104) when more than one package provides it; one canonical file is one provider.
- [x] 2.2 Fail import-closure assembly with `AssemblyError::AmbiguousModulePath` for `use`, parent-module, qualified-reference and module-declaration lookups.
- [x] 2.3 Report E1104 `ResolveAmbiguousModulePath` from semantic legality for a qualified path that more than one assembled module declares.
- [x] 2.4 Resolve fully qualified dependency paths without a `use` and let lexical names shadow the absolute lookup. (`beskid_queries::semantic_contract::resolution::qualified_module_resolution`; tests `qualified_call_into_transitive_dependency_module_resolves_without_use` and `lexical_inline_module_shadows_dependency_module_of_the_same_root` in `beskid_queries/tests/v06_qualified_dependency_module_paths.rs`.)
- [x] 2.5 Report E1107 for a private item reached through a fully qualified path. (`UnresolvedCallKind::PrivateItemInModule` mapped to `SemanticIssueKind::ResolvePrivateItemInModule` in `semantic_contract/legality.rs`; test `qualified_call_to_private_dependency_item_stays_inaccessible`.)

## 3. Verify

- [x] 3.1 Confirm that no two Corelib packages or Corelib Mods provide the same logical module path.
- [ ] 3.2 Run the `beskid_analysis` (`projects::assembly`, `module_namespace_v06`), `beskid_queries`, `beskid_tests_projects` and `beskid_e2e_tests` gates on the builder.
