Revision 2026-10-13: the structural ABI v1 request/table/callbacks were retired (MOD-06-28). Items that named them now name the delivered executable-artifact and CABI2 equivalents; the original wording is kept in parentheses. "rc29" means the Linux x64 builder run `.build/rc29.log` (2026-10-13): `cargo test --workspace` (excluding `beskid_tests_interop`, `beskid_tests_projects`) passed, `serialization_mod_tests` 3/3 targets passed.

## 1. Validate
- [x] 1.1 Retain native entrypoint RED and arena API RED; validate the executable Mod descriptor schema and discriminator (was: explicit V1 ABI schema and actual layout tests).
  Evidence: `beskid_analysis/tests/native_mod_descriptor_v06.rs` (`v06_native_mod_rejects_legacy_object_descriptor_before_loading`), `native_mod_dispatch_v06.rs` (4 stub-denial tests), `structural_contribution_arena.rs` (7 tests); passed in rc29.
- [x] 1.2 Add real native generator positive, foreign/stale/kind/closed negative and assembly-generation handoff tests before implementation (was: V1 callback-builder tests).
  Evidence: `beskid_cli/tests/native_mod_sdk_v06.rs` (`v06_qualified_mod_worker_generates_callable_and_generic_record_for_real_host`), `structural_contribution_arena.rs` (`structural_materialization_rejects_foreign_owner_generation_and_kind`, `closed_structural_arena_rejects_existing_and_new_handles`), `beskid_queries/tests/mod_semantic_authority.rs` (`mod_shape_authority_rejects_stale_foreign_and_non_type_keys_and_tokens`), generation handoff unit test in `beskid_analysis/src/mod_host/context.rs`; passed in rc29.
## 2. Introduce
- [ ] 2.1 Implement static AST arena and terminal native Generator invocation/materialization with provenance.
  Arena (`mod_host/structural.rs`) and terminal invocation (`NativeContractInvoker::unavailable` denies; CABI2 worker `native_worker.rs`) exist. Remaining: native output (`native_results.rs`) decodes directly into `GeneratorOutcome.typed_items` without the arena, and `GeneratorOutcome` carries no per-item source/generator/span provenance.
- [x] 2.2 Freeze the executable descriptor and host ABI discriminator with the root ABI owner (was: freeze ModStructuralGenerationRequestV1/table/result/spec layouts).
  Evidence: `NATIVE_MOD_DESCRIPTOR_SCHEMA = 3`, `NATIVE_MOD_HOST_ABI = 2`, `artifact_kind == "executable-shared-library"` checks in `beskid_analysis/src/mod_host/descriptor.rs`; producer `beskid_aot/src/mod_artifact.rs` (`BuildOutputKind::SharedLib`, exported `discriminator_symbol`); worker check `discriminator() != 2` in `native_worker.rs`.
- [x] 2.3 Implement invocation-scoped context and bounded typed contributions; a real Mod library creates new function and generic record nodes (was: through V1 callbacks).
  Evidence: `invoke_entry` rejects zero generation/session (`native_worker.rs`); depth 128 and 65536-element bounds in `native_correspondence.rs`; `v06_qualified_mod_worker_generates_callable_and_generic_record_for_real_host` passed in rc29.
## 3. Migrate
- [x] 3.1 Carry real assembly/Salsa generation through context and pipeline; connect read-only semantic query authority.
  Evidence: `syntax_generation_id: Some(assembly.generation)` in `beskid_analysis/src/services/prepare/spine.rs` and `mod_host/semantic_scope.rs`; `ModSemanticQueryAuthority` in `beskid_queries/src/mod_semantic_authority.rs`; `mod_semantic_authority` tests passed in rc29.
- [x] 3.2 Merge/materialize real native emitted nodes and validate/lower through canonical typed/query/ISLE path.
  Evidence: `native_results.rs` decodes typed declarations, `merge_generated_syntax` issues a fresh generation (`mod_host/api.rs`); `native_mod_sdk_v06.rs` runs `beskid run` on the merged program; passed in rc29.
## 4. Delete
- [ ] 4.1 Remove required Generator stub success, raw AST pointer casts, parser-based structural alternatives and hardcoded authority epochs.
  Done: production stub success (`NativeContractInvoker` denies), raw V1 bridge and pointer handles (MOD-06-28). Remaining: native `codeOutputs` are still accepted (`native_results.rs`) and reparsed (`mod_host/reparse.rs`, `api.rs` `reparse_if_needed`); `ModGenerationRequest` maps an absent generation to 0 (`context.rs`).
## 5. Verify
- [x] 5.1 Run serialized focused native/arena/generation tests RED/GREEN, then affected Mod/query/semantic suites.
  Evidence: rc29 workspace run (all `beskid_analysis`, `beskid_queries`, `beskid_cli`, `beskid_tests_mods` targets passed) and `serialization_mod_tests` 3/3.
- [ ] 5.2 Qualify real constructors and generated adapters on required native targets with exact source/tool/input/output identity; full serialization remains required beyond this milestone.
  Only Linux x64 builder evidence exists; MOD-06-01/02 host cells (`beskid_tests_release/tests/serialization_host_v06.rs`) are not executed.
## Semantic authority and complete adapters

- [x] Observe RED for `cargo test -p beskid_queries --test mod_semantic_authority -- --nocapture` using real materialized/registered assembly authority.
  Evidence: `docs/reports/2026-10-04-v06-decisions.md` (Gate 54628, rc18 20/20); passes in rc29.
- [x] Implement the analysis read-only issued-handle trait and queries adapter over canonical registered type/field/generic/ownership facts; reject all foreign/stale/unavailable inputs.
  Evidence: `beskid_analysis/src/mod_host/semantic.rs`, `ModSemanticQueryAuthority::validate_key` in `beskid_queries/src/mod_semantic_authority.rs`.
- [ ] Add and observe RED for partial assembly registration, then require every registered unit's project/generation/syntax identity before issuing authority.
  Implemented (`validate_registration` checks every unit's project, generation and expanded tree); no dedicated partial-registration test found.
- [x] Test issuer closure/non-reuse and generation revalidation on every lookup; retain identities only, with no duplicate semantic shape cache.
  Evidence: `validate_key` calls `validate_registration` on every lookup; issuer tokens never reused ("semantic issuer tokens exhausted"); tests `mod_shape_authority_rejects_stale_foreign_and_non_type_keys_and_tokens`, `catchall_requires_exact_owned_map_field_and_live_invocation`.
- [ ] Add ordinary recursive nominal positive and cyclic substitution/depth/node-limit negative tests; exact applied arity and unapplied generic rejection remain mandatory.
  Positive and unapplied cases exist (`mod_shape_enum_retains_ordered_unit_and_recursive_payload_declarations`, `mod_shape_applied_enum_substitutes_payload_and_rejects_unapplied_generic`); `DEPTH_LIMIT` exists but has no negative depth/node-limit or cyclic-substitution test.
- [ ] Freeze independent semantic table ABI layout/version/capability and lifetime tests before exposing native semantic queries.
  Superseded: no native semantic table exists; semantic queries reach the worker as CABI2 host services (`mod_host/native_services.rs`). Needs a coordinator ruling to reword or remove.
- [ ] Observe RED for provenance beyond arena, then retain item-aligned source/generator/origin metadata through GeneratorOutcome and typed merge.
  Not implemented: `GeneratorOutcome` (`mod_host/invoker/outcomes.rs`) has no per-item provenance.
- [ ] Freeze an explicitly versioned complete typed constructor extension and observe real native primitive/composite field adapter bodies before implementation.
  Typed SDK contributions carry complete declarations (`native_results.rs`), and the Serialization Mod emits adapters (`serialization_mod_tests` 3/3 in rc29). Remaining: no explicitly versioned constructor extension; the SDK mirror schema is the de facto contract.
- [ ] Verify adapters call canonical codecs and pass current semantic validation with applied generics, full supported primitives and managed ownership; generic-only/empty bodies do not complete this task.
  Bound to SER-01/SER-03 (`SerializationGeneratedSuite`); not yet qualified on installed candidates.
- [x] Add real canonical-SDK Beskid Generator end-to-end RED fixture: production Mod build, executable artifact/discriminator, native invocation, new static AST contribution and generated host function execution.
  Evidence: `beskid_cli/tests/native_mod_sdk_v06.rs` (`v06_qualified_mod_worker_generates_callable_and_generic_record_for_real_host`, runs `beskid run`), passed in rc29.
- [x] Freeze executable Mod descriptor/entry/runtime-attachment contracts and prove canonical SDK primitive/schema prerequisites; reject relocatable objects as executable artifacts.
  Evidence: `mod_host/descriptor.rs` (schema 3, host ABI 2), `v06_native_mod_rejects_legacy_object_descriptor_before_loading`.
- [ ] Emit checked structural C trampolines and link exact runtime-attached shared libraries with deterministic cache/output closure and unique registration entries.
  Shared-library production with exported discriminator (`beskid_aot/src/mod_artifact.rs`) and ambiguous-cache rejection (`mod_host/load.rs`) exist; no installed multi-target qualification.
- [ ] Verify unsupported SDK fields, target/ABI/tool/runtime drift and stale context fail closed, then replace Pest codeOutputs-only emission with complete typed structural generation.
  Not done: `corelib/mods/corelib_pest_gen/Src/Emit.bd` `BuildAll` still returns `Contribution.FromCodeOutputs`.
