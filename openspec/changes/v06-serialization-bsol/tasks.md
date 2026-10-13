Evidence logs: `.build/rc29.log` (Linux x64 builder, 2026-10-13 07:50: workspace `cargo test` passed excluding `beskid_tests_interop`/`beskid_tests_projects`; `corelib_tests` 34/34 targets; `serialization_mod_tests` 3/3) and `.build/sliceA-v1.log` (2026-10-13 09:53, current target layout, per-target results quoted below). Both use a dev kit, not a release candidate.

## 1. Validate prerequisites and contracts

- [x] 1.1 Inspect direct source callers/references for edited symbols, verify pinned source/canonical capabilities and validate this change; ignore GitNexus.
  Evidence: `pnpm exec openspec validate v06-serialization-bsol --strict` passes; the Mod contract wording now names the executable artifact/discriminator (descriptor schema 3, host ABI 2) and CABI2 typed contributions that the code implements (`beskid_analysis/src/mod_host/descriptor.rs`, `native_results.rs`).
- [ ] 1.2 Add failing native Generator/structural ownership/SDK primitive/instantiated shape semantic and ISLE probes (MOD-06-01/02, SER-04).
  Host probes are written (`compiler/crates/beskid_tests_release/tests/serialization_host_v06.rs`: `mod06_01_*`, `mod06_02_*`, `ser04_*`) and compile (`.build/b-check.log`), but no RED or GREEN run against an installed prefix is recorded. Library controls pass (`beskid_analysis/tests/native_mod_dispatch_v06.rs`, `structural_contribution_arena.rs`; rc29).
- [x] 1.3 Coordinate fixed-width/f32 primitive and ABI/runtime-kit prerequisites with owning slice.
  Evidence: `PrimitiveType` has `I8`, `I16`, `U16`, `U64`, `F32` (`beskid_analysis/src/syntax/types/primitive_type.rs`); `SerializationModEligibilitySuite` covers every supported primitive (15/15 in sliceA-v1).

## 2. Introduce complete generic data foundations

- [x] 2.1 Implement fail-closed real native Collector/Generator and structural handle bridge, canonical semantic shape queries and compiler-emitted plans.
  Evidence: `NativeContractInvoker::unavailable` denies without a qualified artifact; CABI2 worker with discriminator check (`mod_host/native_worker.rs`); `ModSemanticQueryAuthority` (`beskid_queries/src/mod_semantic_authority.rs`, serialization target/template submodules); `beskid_cli/tests/native_mod_sdk_v06.rs` and `beskid_queries/tests/mod_semantic_authority.rs` passed in rc29.
- [ ] 2.2 Add failing nonzero shape/cast/fresh mapping/forced GC tests; implement registered traced dynamic cells and lossless fresh mappings (DYN-06-01..05).
  Dynamic V1 runtime exports exist (`beskid_dynamic_v1_*` in the ABI-v5 contract). `DynamicSuite` fails in sliceA-v1; `scripts/ci/release-case-bindings/corelib.json` binds only DYN-06-01/02/05 (DYN-06-03/04 unbound).
- [ ] 2.3 Add failing full shape matrix/incremental/eligibility tests; implement Serialization Mod, generated typed adapters and stable descriptors (SER-01..04).
  Eligibility passes (`SerializationModEligibilitySuite` 15/15, `serialization_mod_tests` 2/2 in sliceA-v1). SER-04 host cells not run.
  Typed field decoder factory correspondence (2026-10-13): `Reader.ReadField<T,R>` with the compiler-issued `FieldDecoderBridge` (`beskid_queries/src/semantic_contract/serialization_field_decoder.rs`, `mod_semantic_authority/field_decoder.rs`), codegen fixpoint and forward body (`beskid_codegen/src/module_emission/{specialization,serialization}.rs`), canonical scalar/container reads (`PrimitiveDecoders.bd`, `ContainerDecoders.bd`), `Decoding.IssuedField`/`FieldFor`/`DecoderFor` and `Core.Bsol.Serialization.Read<T>`. The Mod reads every nominal field through `ReadField` (decoder group: adapter type, field decoder factory, Decoder impl). Builder evidence (`.build/fd-v3.log`): `serialization_mod_tests` 2/2, `SerializationSuite` 33/33, `beskid_queries` `mod_semantic_authority` 25/25, `unavailable_inventory` 2/2, `runtime_fixture` 6/6, `beskid_tests_projects` reader bridge unit test passes. `GeneratedTests.bd` is rewritten to typed top-level decode through BSOL and a JSON test reader (SER-01/03); it does not pass yet because every Serialization Mod canonical route is absent in the Mod semantic scope: `mod_semantic_scope.rs` builds its typed program without Corelib services, so `canonical_corelib_source_path` has no entry for `Core/Results/Results.bd` (`canonical route declaration Core.Results.Result is absent (0 candidates)`).
  Attribution, cross-database identity and generated-code lowering (2026-10-13/14; compiler 423f5afe, a0df9f6b, 52943e8b, 5c519a45; corelib b046465): every typed program of one generation registers the same contribution attribution table; retained serialization payloads hold path-based `RetainedDeclaration`s and rebind in the isolated lowering database; descriptor shapes come from the exact target correspondence (one per target, groups and templates agreeing); the Serialization Mod keeps member callees. General lowering gaps fixed with per-gap query, ISLE and native regressions: `?` on generic calls inside specializations (environment-aware try fact), field reads and member receivers in specializations, enum constructors as struct literal field values and explicitly applied in specializations, unary operators over field reads, receiver-field collection owners (`this.items = Array.Append(this.items, v)`), empty array literals in assignments, match/block values in managed positions, GC handle helper imports. Builder evidence (`attr-at18`, slot w1): `SerializationGeneratedSuite` 11/11, `SerializationSuite` 33/33, `BsolSerializationWireTests` 25/25 (with `BESKID_BSOL_CORPUS`; its earlier failure was the unset corpus root), `serialization_mod_tests` 2/2, `isle_adapter` 353/353, `v06_serialization_compiled_shape` 12/12, `mod_semantic_authority` 25/25, `semantic_facts` 327/327, `serialization_host_v06::ser_contracts_only_import_builds_runs_and_round_trips_bsol` passes against a release-shaped prefix.
- [ ] 2.4 Add boundary/error/allocation/cycle tests; implement bounded generic values and policies with small JSON independence fixture (SER-05/06).
  `SerializationSuite` 33/33 passes (SER-06). SER-05 is bound to `BsolSerializationWireTests`, which fails in sliceA-v1; the JSON independence test is now `serialization_generated_record_uses_one_descriptor_and_decoder_for_bsol_and_json` in `GeneratedTests.bd` (blocked by the canonical route gap above).

## 3. Introduce native syntax and profiles

- [x] 3.1 Add shared syntax/diagnostic/canonical corpus including corrected lexical cases (BSOL-06-01/02/09).
  Evidence: `beskid_bsol/conformance/cases/` (`v06-values.bsol`, `runtime-manifest-v5.bsol`, schema and `serialization-v1` case sets) consumed by native tests through `BESKID_BSOL_CORPUS`.
- [ ] 3.2 Implement Beskid lexer/parser/writer and align standalone Rust/tree-sitter grammar without Rust forwarding.
  Native `Lexer.bd`/`Parser.bd`/`Writer.bd` exist with no `Extern` in `compiler/corelib/packages/bsol/src`; tree-sitter uses `@` attributes. Remaining: `BsolSuite` 30/32 in sliceA-v1 (`bsol_parse_write_parse_preserves_kinds_labels_attributes_and_references_across_whitespace_and_comments`, `bsol_each_configured_limit_boundary_admits_and_plus_one_rejects_atomically` fail).
- [x] 3.3 Add schema self-validation/import/reference/composition/constraint cases; implement complete v1/v2 profile loader, explicit controlled resolver, validation and references (BSOL-06-03..06).
  Evidence: sliceA-v1 `BsolSchemaTests` 9/9 (both profile versions, all fourteen builtin profiles), `BsolSchemaRulesSuite` 40/40 (constraints, patterns, composition, references); import tests in `BsolSuite` are not among its two failures; CLI `--schema-import-root`/`--schema-import-lock` in `beskid_cli/src/commands/validate_bsol.rs`.

## 4. Migrate consumers and delete obsolete behavior

- [ ] 4.1 Add structural migration route/rewrite/revalidation cases; align native/Rust migration and remove substring rewrites (BSOL-06-07).
  Native `BsolMigrationTests` 8/8 pass (sliceA-v1). Remaining: standalone `beskid_bsol/crates/bsol-analysis/src/migrate.rs` still rewrites with `rfind('}')` and `String::replace`.
- [ ] 4.2 Add full generic typed representation roundtrips; implement Read<T>/Write<T> and installed configuration example (BSOL-06-08).
  `Core.Bsol.Typed` exists; `BsolSerializationWireTests` fails in sliceA-v1; no installed configuration example run.
- [ ] 4.3 Remove required-Mod stub success, serialized source generation, zero-shape wrapping, ignored mapping and retired dynamic lowering authority.
  Production stub success is removed (`NativeContractInvoker`). Remaining: native `codeOutputs` are accepted and reparsed (`mod_host/native_results.rs`, `mod_host/reparse.rs`).

## 5. Verify complete release scope

- [ ] 5.1 Run focused red-green tests and required semantic/ISLE/runtime/corelib integration gates after each slice; preserve exact evidence.
  Current state is not green (sliceA-v1: `DynamicSuite`, `SerializationGeneratedSuite`, `BsolSuite`, `BsolSerializationWireTests`, `ProcessSuite` fail).
- [ ] 5.2 Run identical shared Rust/native corpus and installed generic configuration journey on Linux x64/macOS arm64/Windows x64 candidate bytes.
- [ ] 5.3 Require every SER/MOD/DYN/BSOL cell executed/pass in existing release evidence validator; reject missing/skipped/timeout/mismatched provenance.
  Bindings exist as fragments (`scripts/ci/release-case-bindings/{corelib,host}.json`); the manifest is `binding_required` and DYN-06-03/04 are unbound.
- [ ] 5.4 Document authoritative APIs/limits/import/migration behavior, review the exact diff before commits and hand root a complete integration packet.
## Nested collection owner prerequisite

- [ ] Retain native RED: direct local append passes while Loader.Profile.Roots append fails with UnprovenCollectionOwner.
  No retained RED log was found; the profile loader now passes (`BsolSchemaTests` 9/9).
- [ ] Add canonical owner-fact and native multi-growth/scalar/managed cases before implementing publication.
  Owner-fact and provenance cases exist (`beskid_queries/tests/nested_collection_owner.rs`: `user_array_path_collision_does_not_gain_intrinsic_authority`, `exact_copied_canonical_array_without_physical_authority_is_ordinary_source`); no native multi-growth/scalar/managed case was found.
- [x] Retain actual receiver key and rooted ancestor separately through query facts and codegen adapter; root receiver across value evaluation/growth and publish into its proven terminal field.
  Evidence: `nested_collection_owner_retains_terminal_receiver_and_rooted_ancestor` (`beskid_queries/tests/nested_collection_owner.rs`); collection intrinsics use registered `corelib_source_paths` (`beskid_queries/src/semantic_contract/queries.rs`); passed in rc29.
- [ ] Verify focused native cases and BSOL schema suite using exact candidate CLI/runtime kit; no source-local alias workaround.
  Verified only with a dev kit (sliceA-v1), not a candidate.
