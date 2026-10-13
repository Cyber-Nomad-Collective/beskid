## 1. Validate

- [ ] 1.1 Move this change to `openspec/changes/v06-query-front-end/` in the root repository, validate it with `openspec validate v06-query-front-end --strict` and regenerate `openspec/catalog.json`. (Moved, and strict validation passes; `openspec/catalog.json` is not yet regenerated.)

## 2. Introduce

- [x] 2.1 Retire the legacy `TypeChecker` from the prepare spine; require the query authority on both paths; assemble `ExecutableFrontEnd` for codegen (`compiler/docs/design/2026-10-12-query-front-end.md`; `beskid_analysis::services::front_end::ExecutableFrontEnd`).
- [x] 2.2 Remove `DependencyTypingPolicy`, the typed session fingerprints, the HIR-era lowering phase ids, the stage-7 try precheck and the dead type-descriptor artifact path.
- [x] 2.3 Judge standalone `.bd` files by the query gate over a synthetic `App` plan.
- [x] 2.4 Prove array iterables in `for_iterator_fact` (`ForIterableSource::Array`), type and classify the loop variable by the element identity, and add `for_iterator_specialization` for generic elements.
- [x] 2.5 Lower `for` over arrays in ISLE (`ForIterableKind::Array`, `emit_array_for`) from the codegen `array_for_fact`.
- [x] 2.6 Share `PROGRAM_ENTRY_FUNCTION` between the analysis rules, the AOT entrypoint default and the CLI; exempt the entry function from W1504 in the entry unit of `App` and `Test` targets.
- [x] 2.7 Port the legacy checker tests to the query authority (`beskid_queries` parity module `parity_front_end`, `v06_front_end_authority`, codegen prepared-syntax tests).
- [x] 2.8 Prove nominal iterators (`ForIterableSource::Iterator`, `for_iterator_protocol`), lower them in ISLE (`ForIterableKind::Iterator`, `emit_iterator_for`) from the codegen `iterator_for_fact`, collect `Next()` specializations in module emission, and make the check gate report **E1215** for every unproven iterable outside generic items.

## 3. Verify

- [ ] 3.1 Run `cargo test --locked -p beskid_analysis -p beskid_queries -p beskid_isle -p beskid_codegen -p beskid_lsp -p beskid_cli -p beskid_tests_projects` on the builder.
- [ ] 3.2 Run the Corelib check gate and the fixture matrix.
