## 1. Validate

- [ ] 1.1 Validate this change with `openspec validate v06-field-visibility --strict` and regenerate `openspec/catalog.json`. (Strict validation passes; `openspec/catalog.json` is not yet regenerated.)

## 2. Introduce

- [x] 2.1 Use one field visibility predicate in `beskid_queries` for field reads, nominal projection chains and struct literals.
- [x] 2.2 Report cross-unit non-`pub` field reads and constructions as E1211 in the query gate and in the `beskid_analysis` checker, with help to mark the field `pub`. (The `beskid_analysis` checker was later retired by `v06-query-front-end`; the query gate, `legality/members.rs` `MemberReferenceKind::InaccessibleStructField`, is now the only reporter.)
- [x] 2.3 Attest the canonical Network resource, socket and Mutex guard sources for their exact private-field admissions.

## 3. Migrate

- [x] 3.1 Emit `pub` fields from `beskid_ast_reflect_gen` and apply the output to `Beskid/Syntax/Nodes/*.bd` and `Beskid/Compiler/Query.bd`.
- [x] 3.2 Mark compiler SDK request, workspace, compilation and catalog fields `pub`.
- [x] 3.3 Mark shared Corelib data record fields `pub`; keep resource handles private.
- [x] 3.4 Update compiler test fixtures that read or build another unit's fields.
- [x] 3.5 Decide the `ConcurrencyFiberHandleTests` target, which builds `Fiber { handle }` from a test unit. (The target was merged into `corelib_tests` `src/concurrency/ConcurrencySuite.bd`; its tests use the public `spawn`/`Join`/`Cancel`/`Detach` API only and build no `Fiber` literal.)
- [ ] 3.6 Reinstall the Corelib kit and regenerate lockfiles if their source hashes change. (Not verifiable from source; needs a builder run.)

## 4. Verify

- [ ] 4.1 Run the `beskid_ast_reflect_gen`, `beskid_abi`, `beskid_analysis`, `beskid_queries`, `beskid_codegen`, `beskid_tests_projects`, `beskid_tests_mods` and Corelib test gates on the builder.
