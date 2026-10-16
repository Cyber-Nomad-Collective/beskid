# 0.6 acceptance binding source audit

Date: 2026-10-06. Read-only source audit; no Cargo runs, builder synchronization, frozen bindings or execution claims. GitNexus is excluded by explicit user instruction. This is a candidate-source map, not release evidence.

The manifest contains 101 mandatory cases across three native targets: 16 baseline targets with null assertion IDs and 85 null new bindings. Every installed qualification remains missing until a reviewed producer captures immutable candidate CLI, exact prefix, commands, assertions and retained outputs. Source declarations alone never prove installed execution.

## Immediate required gaps

1. Complete the native installed-consumer producer. `scripts/ci/woodpecker-release-evidence.mjs:259` validates retained assertion provenance and installed CLI identity, but the reviewed manifest remains `binding_required`. It rejects the unfrozen manifest at line 475. A Node/Beskid declaration validator is not a runner. Tests written in Rust must be exposed through an installed-candidate harness or actual native Beskid assertions; arbitrary Rust test names cannot become accepted Node/Beskid declarations.
2. Bridge stdio opaque ownership to admitted native image/provider and connection epoch. `openspec/changes/v06-rust-glue-integration/tasks.md:18` explicitly retains this unfinished requirement and rejects pure peer/scalar proof. `beskid_glue/src/peer.rs:3` says wire digests never authorize native images/pointers/owners; `session.rs:1` owns protocol state only. `stdio_peer.rs` tests in-memory service framing; `glue_owned.rs` tests actual artifacts separately and contains no Session/Peer/stdio/connection/epoch references. This inspection establishes a missing joined test seam, not proof that no implementation exists anywhere.
3. Preserve the full Mod-produced shape journey: GenerationTests inspect typed emitter groups, whereas explicit TypedBindingTests provide hand-written bindings. Neither alone proves generated adapters compile and execute full generic shapes through installed BSOL Read/Write. Add/bind an actual native generated consumer covering records, variants, instantiated nested containers, defaults and format independence.
4. CLI06-06 requires five fresh uncoached users and timed four-of-five discovery/workflow thresholds. No scripted help or workflow assertion substitutes for observations; retain identity-bound observations separately.
5. Do not let the 101-ID manifest hide later normative leaf scenarios: R4-OWN, R4-STDIO-20..22 and later process cases must be linked into required assertions under existing coarse IDs or expand the reviewed manifest before freezing.

## Per-case map

Coverage here means source coverage only: **full-source baseline** locates the existing named test target; **partial** locates relevant declarations but has not demonstrated every scenario and installed seam; **missing** has no substitute for the specified observation. None means passed execution. The following appendix gives exact declarations for every candidate source reference.

| Case | Source coverage | Candidate source set | Remaining seam |
|---|---|---|---|
| foundations.core_bytes | full-source baseline | `compiler/crates/beskid_tests_projects/src/projects/corelib/layout.rs` | Enumerate exact assertions; run installed candidate on all targets. |
| foundations.encoding_utf8 | full-source baseline | `compiler/crates/beskid_tests_projects/src/projects/corelib/layout.rs` | Enumerate exact assertions; run installed candidate on all targets. |
| foundations.time | full-source baseline | `compiler/crates/beskid_tests_projects/src/projects/corelib/layout.rs` | Enumerate exact assertions; run installed candidate on all targets. |
| foundations.fibers | full-source baseline | `compiler/crates/beskid_tests_projects/src/projects/corelib/layout.rs` | Enumerate exact assertions; run installed candidate on all targets. |
| foundations.channels | full-source baseline | `compiler/crates/beskid_tests_projects/src/projects/corelib/layout.rs` | Enumerate exact assertions; run installed candidate on all targets. |
| network.types | missing | Target declaration not located | Enumerate exact assertions; run installed candidate on all targets. |
| network.dns | missing | Target declaration not located | Enumerate exact assertions; run installed candidate on all targets. |
| network.tcp | missing | Target declaration not located | Enumerate exact assertions; run installed candidate on all targets. |
| network.udp | missing | Target declaration not located | Enumerate exact assertions; run installed candidate on all targets. |
| network.scope | missing | Target declaration not located | Enumerate exact assertions; run installed candidate on all targets. |
| network.shutdown | missing | Target declaration not located | Enumerate exact assertions; run installed candidate on all targets. |
| network.disposable | missing | Target declaration not located | Enumerate exact assertions; run installed candidate on all targets. |
| http.codec | missing | Target declaration not located | Enumerate exact assertions; run installed candidate on all targets. |
| http.validation | missing | Target declaration not located | Enumerate exact assertions; run installed candidate on all targets. |
| http.serialization | missing | Target declaration not located | Enumerate exact assertions; run installed candidate on all targets. |
| http.exchange | full-source baseline | `compiler/crates/beskid_codegen/tests/isle_adapter/control_flow_loop_termination.rs` | Enumerate exact assertions; run installed candidate on all targets. |
| CLI06-01 | partial | `compiler/crates/beskid_cli/tests/cli_inventory.rs` / `compiler/crates/beskid_cli/tests/line_interaction.rs` / `compiler/crates/beskid_cli/tests/pipeline_output.rs` / `compiler/crates/beskid_cli/tests/template_authoring_lock.rs` / `compiler/crates/beskid_cli/tests/toolchain_ownership_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| CLI06-02 | partial | `compiler/crates/beskid_cli/tests/cli_inventory.rs` / `compiler/crates/beskid_cli/tests/line_interaction.rs` / `compiler/crates/beskid_cli/tests/pipeline_output.rs` / `compiler/crates/beskid_cli/tests/template_authoring_lock.rs` / `compiler/crates/beskid_cli/tests/toolchain_ownership_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| CLI06-03 | partial | `compiler/crates/beskid_cli/tests/cli_inventory.rs` / `compiler/crates/beskid_cli/tests/line_interaction.rs` / `compiler/crates/beskid_cli/tests/pipeline_output.rs` / `compiler/crates/beskid_cli/tests/template_authoring_lock.rs` / `compiler/crates/beskid_cli/tests/toolchain_ownership_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| CLI06-04 | partial | `compiler/crates/beskid_cli/tests/cli_inventory.rs` / `compiler/crates/beskid_cli/tests/line_interaction.rs` / `compiler/crates/beskid_cli/tests/pipeline_output.rs` / `compiler/crates/beskid_cli/tests/template_authoring_lock.rs` / `compiler/crates/beskid_cli/tests/toolchain_ownership_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| CLI06-05 | partial | `compiler/crates/beskid_cli/tests/cli_inventory.rs` / `compiler/crates/beskid_cli/tests/line_interaction.rs` / `compiler/crates/beskid_cli/tests/pipeline_output.rs` / `compiler/crates/beskid_cli/tests/template_authoring_lock.rs` / `compiler/crates/beskid_cli/tests/toolchain_ownership_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| CLI06-06 | missing observations | `compiler/crates/beskid_cli/tests/cli_inventory.rs` / `compiler/crates/beskid_cli/tests/line_interaction.rs` / `compiler/crates/beskid_cli/tests/pipeline_output.rs` / `compiler/crates/beskid_cli/tests/template_authoring_lock.rs` / `compiler/crates/beskid_cli/tests/toolchain_ownership_v06.rs` | Five uncoached users; native installed journeys and timing evidence. |
| DEP06-01 | partial | `compiler/crates/beskid_analysis/tests/dependency_edit_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_registry_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_graph_intent_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_transaction_v06.rs` / `compiler/crates/beskid_cli/tests/offline_policy_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| DEP06-02 | partial | `compiler/crates/beskid_analysis/tests/dependency_edit_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_registry_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_graph_intent_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_transaction_v06.rs` / `compiler/crates/beskid_cli/tests/offline_policy_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| DEP06-03 | partial | `compiler/crates/beskid_analysis/tests/dependency_edit_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_registry_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_graph_intent_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_transaction_v06.rs` / `compiler/crates/beskid_cli/tests/offline_policy_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| DEP06-04 | partial | `compiler/crates/beskid_analysis/tests/dependency_edit_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_registry_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_graph_intent_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_transaction_v06.rs` / `compiler/crates/beskid_cli/tests/offline_policy_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| DEP06-05 | partial | `compiler/crates/beskid_analysis/tests/dependency_edit_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_registry_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_graph_intent_v06.rs` / `compiler/crates/beskid_analysis/tests/dependency_transaction_v06.rs` / `compiler/crates/beskid_cli/tests/offline_policy_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| SER-01 | partial | `compiler/corelib/mods/serialization_mod/Tests/GenerationTests.bd` / `compiler/corelib/mods/serialization_mod/Tests/EligibilityTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SerializationWireTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/serialization/RegistryTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| SER-02 | partial | `compiler/corelib/mods/serialization_mod/Tests/GenerationTests.bd` / `compiler/corelib/mods/serialization_mod/Tests/EligibilityTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SerializationWireTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/serialization/RegistryTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| SER-03 | partial | `compiler/corelib/mods/serialization_mod/Tests/GenerationTests.bd` / `compiler/corelib/mods/serialization_mod/Tests/EligibilityTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SerializationWireTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/serialization/RegistryTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| SER-04 | partial | `compiler/corelib/mods/serialization_mod/Tests/GenerationTests.bd` / `compiler/corelib/mods/serialization_mod/Tests/EligibilityTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SerializationWireTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/serialization/RegistryTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| SER-05 | partial | `compiler/corelib/mods/serialization_mod/Tests/GenerationTests.bd` / `compiler/corelib/mods/serialization_mod/Tests/EligibilityTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SerializationWireTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/serialization/RegistryTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| SER-06 | partial | `compiler/corelib/mods/serialization_mod/Tests/GenerationTests.bd` / `compiler/corelib/mods/serialization_mod/Tests/EligibilityTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SerializationWireTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/serialization/RegistryTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| MOD-06-01 | partial | `compiler/crates/beskid_cli/tests/native_mod_sdk_v06.rs` / `compiler/corelib/mods/serialization_mod/Tests/SyntaxTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| MOD-06-02 | partial | `compiler/crates/beskid_cli/tests/native_mod_sdk_v06.rs` / `compiler/corelib/mods/serialization_mod/Tests/SyntaxTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| DYN-06-01 | partial | `compiler/runtime/beskid/tests/runtime_semantics/src/DynamicV1Tests.bd` / `compiler/runtime/beskid/tests/runtime_semantics/src/DynamicTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| DYN-06-02 | partial | `compiler/runtime/beskid/tests/runtime_semantics/src/DynamicV1Tests.bd` / `compiler/runtime/beskid/tests/runtime_semantics/src/DynamicTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| DYN-06-03 | partial | `compiler/runtime/beskid/tests/runtime_semantics/src/DynamicV1Tests.bd` / `compiler/runtime/beskid/tests/runtime_semantics/src/DynamicTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| DYN-06-04 | partial | `compiler/runtime/beskid/tests/runtime_semantics/src/DynamicV1Tests.bd` / `compiler/runtime/beskid/tests/runtime_semantics/src/DynamicTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| DYN-06-05 | partial | `compiler/runtime/beskid/tests/runtime_semantics/src/DynamicV1Tests.bd` / `compiler/runtime/beskid/tests/runtime_semantics/src/DynamicTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| BSOL-06-01 | partial | `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SyntaxTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaStructuredTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/ImportGraphTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/MigrationTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/TypedBindingTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/CorpusTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| BSOL-06-02 | partial | `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SyntaxTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaStructuredTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/ImportGraphTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/MigrationTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/TypedBindingTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/CorpusTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| BSOL-06-03 | partial | `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SyntaxTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaStructuredTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/ImportGraphTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/MigrationTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/TypedBindingTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/CorpusTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| BSOL-06-04 | partial | `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SyntaxTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaStructuredTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/ImportGraphTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/MigrationTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/TypedBindingTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/CorpusTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| BSOL-06-05 | partial | `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SyntaxTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaStructuredTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/ImportGraphTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/MigrationTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/TypedBindingTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/CorpusTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| BSOL-06-06 | partial | `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SyntaxTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaStructuredTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/ImportGraphTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/MigrationTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/TypedBindingTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/CorpusTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| BSOL-06-07 | partial | `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SyntaxTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaStructuredTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/ImportGraphTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/MigrationTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/TypedBindingTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/CorpusTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| BSOL-06-08 | partial | `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SyntaxTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaStructuredTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/ImportGraphTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/MigrationTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/TypedBindingTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/CorpusTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| BSOL-06-09 | partial | `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SyntaxTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaStructuredTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/ImportGraphTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/MigrationTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/TypedBindingTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/CorpusTests.bd` | Review complete scenario set; expose real installed assertion runner. |
| R4-BIND-01 | partial | `compiler/crates/beskid_codegen/tests/glue_binding_facts.rs` / `compiler/crates/beskid_aot/tests/glue_declarations_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-BIND-02 | partial | `compiler/crates/beskid_codegen/tests/glue_binding_facts.rs` / `compiler/crates/beskid_aot/tests/glue_declarations_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-BIND-03 | partial | `compiler/crates/beskid_codegen/tests/glue_binding_facts.rs` / `compiler/crates/beskid_aot/tests/glue_declarations_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-BIND-04 | partial | `compiler/crates/beskid_codegen/tests/glue_binding_facts.rs` / `compiler/crates/beskid_aot/tests/glue_declarations_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-ABI-01 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-ABI-02 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-ABI-03 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-ABI-04 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-ABI-05 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-ABI-06 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-ABI-07 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-ABI-08 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-ABI-09 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-ABI-10 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-ABI-11 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-ABI-12 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-CALL-01 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-CALL-02 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-CALL-03 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-CALL-04 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-GEN-01 | partial | `compiler/crates/beskid_analysis/src/mod_host/glue.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-GEN-02 | partial | `compiler/crates/beskid_analysis/src/mod_host/glue.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-GEN-03 | partial | `compiler/crates/beskid_analysis/src/mod_host/glue.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-GEN-04 | partial | `compiler/crates/beskid_analysis/src/mod_host/glue.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-GEN-05 | partial | `compiler/crates/beskid_analysis/src/mod_host/glue.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-GEN-06 | partial | `compiler/crates/beskid_analysis/src/mod_host/glue.rs` / `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-TOOL-01 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_cli/tests/glue_rust_build_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-TOOL-02 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_cli/tests/glue_rust_build_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-TOOL-03 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_cli/tests/glue_rust_build_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-TOOL-04 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_cli/tests/glue_rust_build_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-TOOL-05 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_cli/tests/glue_rust_build_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-TOOL-06 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_cli/tests/glue_rust_build_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-TOOL-07 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_cli/tests/glue_rust_build_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-TOOL-08 | partial | `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs` / `compiler/crates/beskid_cli/tests/glue_rust_build_v06.rs` | Review complete scenario set; expose real installed assertion runner. |
| R4-PROC-01 | partial | `compiler/runtime/beskid/tests/runtime_semantics/src/ProcessIoTests.bd` | Surface-only ProcessIo test insufficient: bind actual native child/pipe/wait/cancel lifecycle controls. |
| R4-PROC-02 | partial | `compiler/runtime/beskid/tests/runtime_semantics/src/ProcessIoTests.bd` | Surface-only ProcessIo test insufficient: bind actual native child/pipe/wait/cancel lifecycle controls. |
| R4-PROC-03 | partial | `compiler/runtime/beskid/tests/runtime_semantics/src/ProcessIoTests.bd` | Surface-only ProcessIo test insufficient: bind actual native child/pipe/wait/cancel lifecycle controls. |
| R4-PROC-04 | partial | `compiler/runtime/beskid/tests/runtime_semantics/src/ProcessIoTests.bd` | Surface-only ProcessIo test insufficient: bind actual native child/pipe/wait/cancel lifecycle controls. |
| R4-PROC-05 | partial | `compiler/runtime/beskid/tests/runtime_semantics/src/ProcessIoTests.bd` | Surface-only ProcessIo test insufficient: bind actual native child/pipe/wait/cancel lifecycle controls. |
| R4-PROC-06 | partial | `compiler/runtime/beskid/tests/runtime_semantics/src/ProcessIoTests.bd` | Surface-only ProcessIo test insufficient: bind actual native child/pipe/wait/cancel lifecycle controls. |
| R4-IO-01 | partial | `compiler/crates/beskid_glue/tests/stdio_peer.rs` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/BinaryCodecTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/ControlEnvelopeTests.bd` | Join actual process pump, shared codec, native owner leases and epoch denial; installed run. |
| R4-IO-02 | partial | `compiler/crates/beskid_glue/tests/stdio_peer.rs` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/BinaryCodecTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/ControlEnvelopeTests.bd` | Join actual process pump, shared codec, native owner leases and epoch denial; installed run. |
| R4-IO-03 | partial | `compiler/crates/beskid_glue/tests/stdio_peer.rs` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/BinaryCodecTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/ControlEnvelopeTests.bd` | Join actual process pump, shared codec, native owner leases and epoch denial; installed run. |
| R4-IO-04 | partial | `compiler/crates/beskid_glue/tests/stdio_peer.rs` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/BinaryCodecTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/ControlEnvelopeTests.bd` | Join actual process pump, shared codec, native owner leases and epoch denial; installed run. |
| R4-IO-05 | partial | `compiler/crates/beskid_glue/tests/stdio_peer.rs` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/BinaryCodecTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/ControlEnvelopeTests.bd` | Join actual process pump, shared codec, native owner leases and epoch denial; installed run. |
| R4-IO-06 | partial | `compiler/crates/beskid_glue/tests/stdio_peer.rs` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/BinaryCodecTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/ControlEnvelopeTests.bd` | Join actual process pump, shared codec, native owner leases and epoch denial; installed run. |
| R4-IO-07 | partial | `compiler/crates/beskid_glue/tests/stdio_peer.rs` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/BinaryCodecTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/ControlEnvelopeTests.bd` | Join actual process pump, shared codec, native owner leases and epoch denial; installed run. |
| R4-IO-08 | partial | `compiler/crates/beskid_glue/tests/stdio_peer.rs` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/BinaryCodecTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/ControlEnvelopeTests.bd` | Join actual process pump, shared codec, native owner leases and epoch denial; installed run. |
| R4-IO-09 | partial | `compiler/crates/beskid_glue/tests/stdio_peer.rs` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/BinaryCodecTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/ControlEnvelopeTests.bd` | Join actual process pump, shared codec, native owner leases and epoch denial; installed run. |
| R4-IO-10 | partial | `compiler/crates/beskid_glue/tests/stdio_peer.rs` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/BinaryCodecTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/ControlEnvelopeTests.bd` | Join actual process pump, shared codec, native owner leases and epoch denial; installed run. |
| R4-IO-11 | partial | `compiler/crates/beskid_glue/tests/stdio_peer.rs` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/BinaryCodecTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/ControlEnvelopeTests.bd` | Join actual process pump, shared codec, native owner leases and epoch denial; installed run. |
| R4-IO-12 | partial | `compiler/crates/beskid_glue/tests/stdio_peer.rs` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/BinaryCodecTests.bd` / `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/ControlEnvelopeTests.bd` | Join actual process pump, shared codec, native owner leases and epoch denial; installed run. |

## Exact declaration inventory

These are source identifiers to inspect, not proposed frozen bindings. Rust helper functions are omitted unless directly marked `#[test]`; Beskid test declarations are enumerated. Baseline target source is included above.

### `compiler/crates/beskid_cli/tests/cli_inventory.rs`

- `new_rejects_removed_tui_picker_and_graph_keeps_its_tui_flag` — line 4.
- `hi_is_not_discoverable_or_dispatched_and_graph_remains_available` — line 30.
- `hi_shell_launcher_and_app_are_absent_from_production_tools` — line 56.

### `compiler/crates/beskid_cli/tests/line_interaction.rs`

No direct test declarations; implementation seam only.

### `compiler/crates/beskid_cli/tests/pipeline_output.rs`

No direct test declarations; implementation seam only.

### `compiler/crates/beskid_cli/tests/template_authoring_lock.rs`

- `new_template_authoring_project_locks_corelib_and_replays_after_relocation` — line 106.
- `template_authoring_lock_rejects_an_explicit_compile_target_without_outputs` — line 169.

### `compiler/crates/beskid_cli/tests/toolchain_ownership_v06.rs`

- `v06_toolchain_status_describes_running_executable_without_provisioning` — line 3.
- `v06_toolchain_update_rejects_unowned_running_binary_before_release_resolution` — line 24.

### `compiler/crates/beskid_analysis/tests/dependency_edit_v06.rs`

- `dep06_preserves_bsol_bytes_and_crlf_when_adding` — line 16.
- `dep06_remove_preserves_surrounding_comments_and_shared_intent` — line 29.
- `dep06_path_intent_remains_relative_and_conflicts_fail` — line 45.
- `dep06_update_changes_only_selected_version_bytes` — line 57.
- `dep06_ambiguous_project_requires_explicit_selection` — line 76.
- `dep06_duplicate_dependencies_are_rejected_without_rewrite` — line 89.
- `dep06_escaped_intents_and_unresolved_versions_fail_closed` — line 97.
- `dep06_update_ignores_matching_versions_in_comments_and_other_blocks` — line 114.
- `dep06_workspace_selection_does_not_pick_first_member` — line 132.

### `compiler/crates/beskid_analysis/tests/dependency_registry_v06.rs`

- `dep06_registry_bare_add_records_highest_stable_exact_intent_and_repeated_add_is_noop` — line 155.
- `dep06_registry_selected_refresh_preserves_unselected_pin` — line 171.
- `dep06_registry_offline_warm_cache_is_verified_without_http_and_tampering_fails_read_only` — line 190.
- `dep06_registry_offline_cold_cache_fails_without_http_or_project_writes` — line 215.
- `dep06_registry_unavailable_malformed_and_yanked_selection_fail_before_project_writes` — line 229.
- `dep06_ordinary_prepare_offline_cold_cache_is_read_only_and_never_contacts_registry` — line 279.
- `dep06_ordinary_prepare_offline_requires_the_exact_lock_even_with_a_warm_verified_cache` — line 304.
- `dep06_ordinary_prepare_offline_locked_rejects_missing_lock_even_with_verified_cache` — line 346.

### `compiler/crates/beskid_analysis/tests/dependency_graph_intent_v06.rs`

- `dep06_planning_uses_edited_intent_without_writing_or_rebasing_paths` — line 6.
- `dep06_proposed_graph_rejects_invalid_root_intent` — line 29.

### `compiler/crates/beskid_analysis/tests/dependency_transaction_v06.rs`

- `dep06_pair_success_and_missing_lock_state` — line 57.
- `dep06_pair_rejects_concurrent_manifest_and_lock_bytes` — line 67.
- `dep06_pair_restores_every_replacement_and_durability_failure` — line 82.
- `dep06_pair_guard_excludes_a_second_commit` — line 129.
- `dep06_pair_recovers_process_death_after_first_replace` — line 164.
- `dep06_recovery_preserves_external_bytes_after_interruption` — line 189.
- `dep06_pair_rejects_symlink_destinations` — line 200.
- `dep06_directory_sync_failure_after_visible_write_restores_pair` — line 232.
- `dep06_corrupt_journal_fails_closed_without_changing_files` — line 253.
- `dep06_journal_directory_and_files_are_private` — line 266.
- `dep06_public_pair_preserves_existing_file_permissions` — line 279.
- `dep06_rollback_preserves_existing_permissions` — line 292.
- `dep06_new_lock_uses_ordinary_file_creation_permissions` — line 312.

### `compiler/crates/beskid_cli/tests/offline_policy_v06.rs`

- `v06_offline_cold_registry_fails_before_everyday_command_preparation_without_http` — line 63.
- `v06_new_explicit_offline_uses_bundled_app_without_registry_requests` — line 100.
- `v06_new_offline_uncached_registry_template_fails_before_output_without_http` — line 111.
- `v06_locked_direct_mutations_preserve_manifest_lock_and_materialized_bytes` — line 134.
- `v06_frozen_direct_add_cold_registry_fails_without_http_or_intent_writes` — line 172.
- `v06_new_offline_local_template_resolves_without_network` — line 205.
- `v06_new_offline_installed_template_checks_bytes_before_output` — line 221.
- `v06_new_offline_rejects_unconstrained_post_action_before_writes` — line 260.
- `v06_new_offline_installed_git_metadata_uses_installed_payload_checksum` — line 279.
- `v06_template_install_rejects_symlink_payload_and_cycle_before_cache_writes` — line 301.
- `v06_new_offline_old_cache_digest_requires_explicit_reinstallation` — line 327.
- `v06_template_install_preflight_preserves_existing_verified_cache` — line 352.

### `compiler/corelib/mods/serialization_mod/Tests/GenerationTests.bd`

- `serialization_generic_record_emits_encoder_then_decoder_group` — line 224.
- `serialization_nested_generic_instantiations_get_distinct_field_decoders` — line 244.
- `serialization_word_scalar_requires_exact_declared_width_on_both_directions` — line 258.
- `serialization_every_supported_primitive_reads_and_ineligible_ones_fail_closed` — line 276.
- `serialization_bytes_policy_requires_exact_u8_array` — line 300.
- `serialization_payload_enum_emits_encoder_and_decoder_group` — line 318.
- `serialization_payload_enum_rejects_unreadable_payload_type` — line 335.
- `serialization_record_without_default_generates_complete_decoder_group` — line 346.
- `serialization_skip_deserialize_without_typed_default_fails_before_generation` — line 352.
- `serialization_skip_both_directions_with_default_keeps_decoder_free_of_that_field_binding` — line 360.
- `serialization_skip_deserialize_written_field_is_consumed_and_discarded` — line 410.
- `serialization_skip_both_directions_has_no_wire_branch` — line 423.
- `serialization_skip_deserialize_written_field_is_not_captured_by_catchall` — line 429.
- `serialization_skip_deserialize_written_field_requires_decoder_binding_for_nominal_type` — line 441.
- `serialization_skip_serialize_removes_parameter_bound_from_encoder` — line 449.
- `serialization_policy_count_mismatch_fails_closed` — line 460.
- `serialization_policies_reject_conflicting_wire_names_unless_directions_differ` — line 468.
- `serialization_policies_reject_invalid_literals_and_unknown_arguments` — line 483.
- `serialization_policy_word_width_literal_accepts_only_declared_widths` — line 504.
- `serialization_generated_type_depth_stops_at_128` — line 522.
- `serialization_container_sites_dispatch_list_map_and_optional_reads` — line 567.
- `serialization_unproven_container_spelling_stays_a_typed_binding` — line 590.
- `serialization_container_fields_bind_only_their_nominal_elements` — line 599.
- `serialization_container_writes_list_optional_and_ordinal_map` — line 617.
- `serialization_record_with_map_field_generates_encoder` — line 652.
- `serialization_variant_policies_reject_asymmetric_skip_present_default_and_catchall` — line 669.
- `serialization_payload_word_width_and_bytes_policies_apply` — line 685.
- `serialization_payload_skipped_both_ways_uses_default_and_needs_no_binding` — line 702.
- `serialization_catchall_policy_is_exclusive_and_not_a_wire_field` — line 722.
- `serialization_catchall_record_reads_unknown_fields_as_its_value_type` — line 742.
- `serialization_catchall_fails_closed_without_map_proof` — line 756.
- `serialization_catchall_flattens_after_declared_fields_in_ordinal_order` — line 769.
- `serialization_catchall_with_skip_serialize_stays_decode_only` — line 799.
- `serialization_missing_canonical_path_plan_is_a_generation_error` — line 814.
- `serialization_ambiguous_canonical_path_plan_is_a_generation_error` — line 823.

### `compiler/corelib/mods/serialization_mod/Tests/EligibilityTests.bd`

- `serialization_eligibility_rejects_ineligible_declared_types_with_field_spans` — line 180.
- `serialization_eligibility_admits_data_types_and_fully_skipped_fields` — line 193.
- `serialization_eligibility_requires_public_nested_targets` — line 203.
- `serialization_closure_proves_foundation_containers_by_package_identity` — line 218.
- `serialization_closure_treats_user_list_spelling_as_nominal` — line 249.
- `serialization_closure_rejects_non_string_map_keys` — line 261.
- `serialization_closure_rejects_nested_opaque_references_and_resources` — line 276.
- `serialization_closure_rejects_direct_record_cycles_but_admits_indirection` — line 292.
- `serialization_closure_rejects_syntax_semantic_divergence` — line 314.
- `serialization_enum_closure_admits_recursive_payloads_and_rejects_opaque_ones` — line 325.
- `serialization_default_factory_resolves_across_modules_and_packages` — line 355.
- `serialization_default_factory_denies_unresolvable_and_private_routes` — line 364.
- `serialization_default_factory_requires_exact_zero_argument_return` — line 375.
- `serialization_default_factory_compares_nominal_applications_by_handle` — line 393.
- `serialization_closure_rejects_host_gated_resources` — line 411.

### `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SerializationWireTests.bd`

- `bsol_serialization_wire_exact_unsigned_width` — line 103.
- `bsol_serialization_wire_float_preserves_negative_zero` — line 122.
- `bsol_serialization_wire_strict_canonical_base64` — line 136.
- `bsol_serialization_wire_optional_cardinality_and_tag` — line 155.
- `bsol_serialization_wire_rejects_unknown_duplicate_and_malformed_fields` — line 176.
- `bsol_serialization_wire_char_scalar_and_depth_policy` — line 200.
- `bsol_serialization_wire_array_list_shapes_are_distinct` — line 216.
- `bsol_serialization_wire_record_declared_order_and_required_fields` — line 277.
- `bsol_serialization_wire_map_ordinal_keys_and_duplicate_rejection` — line 327.
- `bsol_serialization_wire_variant_exact_discriminant_and_payload` — line 365.
- `bsol_serialization_stream_encoder_validates_shape_and_transaction` — line 415.
- `bsol_serialization_stream_encoder_checks_nested_arity` — line 439.
- `bsol_serialization_shared_generic_encoder_decoder_constructs_fresh_t` — line 486.
- `bsol_serialization_shared_tagged_corpus_uses_same_native_policy` — line 504.
- `bsol_serialization_active_path_rejects_cycle_not_shared_siblings` — line 517.
- `checked_array_append_publishes_scalar_and_managed_owners` — line 538.
- `serialization_failure_publication_has_no_mutable_payload` — line 551.
- `wire_encoder_prepares_fallible_work_before_nonallocating_commit` — line 569.

### `compiler/corelib/beskid_corelib/tests/corelib_tests/src/serialization/RegistryTests.bd`

- `serialization_signature_sha256_exact` — line 52.
- `serialization_registration_conflict_is_atomic_and_owned` — line 59.
- `serialization_signature_limit_returns_checked_error` — line 83.
- `serialization_graph_missing_edge_keeps_existing_table` — line 95.
- `serialization_graph_admits_complete_recursive_closure` — line 110.
- `serialization_graph_signature_budget_failure_does_not_publish` — line 119.

### `compiler/crates/beskid_cli/tests/native_mod_sdk_v06.rs`

- `v06_real_compiler_sdk_collector_generator_builds_executable_descriptor` — line 4.
- `v06_qualified_mod_worker_generates_callable_and_generic_record_for_real_host` — line 55.

### `compiler/corelib/mods/serialization_mod/Tests/SyntaxTests.bd`

- `serialization_ast_builder_retains_origin_and_unique_labels` — line 11.
- `serialization_scalar_generation_rejects_pointer_and_unconfigured_word` — line 22.
- `serialization_scalar_generation_preserves_fixed_width_profile` — line 35.
- `serialization_read_rejects_unbound_nominal_factory` — line 49.
- `serialization_read_array_uses_typed_locals` — line 58.
- `serialization_field_policy_retains_direction_name_and_default_syntax` — line 88.
- `serialization_field_policy_rejects_repeated_arguments_and_missing_skip_default` — line 111.
- `serialization_mod_declares_typed_field_policy_parameters` — line 122.

### `compiler/runtime/beskid/tests/runtime_semantics/src/DynamicV1Tests.bd`

- `dynamic_v1_registered_cell_only_root_survives_collection` — line 20.
- `dynamic_v1_registered_mapping_is_fresh_and_preserves_source` — line 38.
- `dynamic_v1_zero_tokens_and_unknown_mapping_fail_closed` — line 63.

### `compiler/runtime/beskid/tests/runtime_semantics/src/DynamicTests.bd`

- `dynamic_zero_shape_is_rejected` — line 27.
- `dynamic_unknown_source_shape_is_checked` — line 31.
- `dynamic_mapping_rejects_zero_token_without_source_alias` — line 37.
- `dynamic_mapping_rejects_unknown_token_without_source_alias` — line 43.
- `dynamic_cell_rejects_unregistered_payload` — line 49.
- `dynamic_box_preserves_canonical_descriptor_across_collection` — line 55.
- `dynamic_null_input_fails_closed` — line 67.

### `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SyntaxTests.bd`

- `bsol_ordered_blocks_assignments_and_byte_spans` — line 20.
- `bsol_strict_escaped_unicode_and_invalid_surrogates` — line 50.
- `bsol_attributes_references_empty_map_inline_blocks_and_numbers` — line 211.
- `bsol_limits_fail_before_unbounded_work` — line 237.
- `bsol_normative_limits_defaults_are_explicit` — line 303.
- `bsol_scalar_limit_uses_decoded_utf8_bytes` — line 324.
- `bsol_output_limit_is_independent_of_input_limit` — line 341.
- `bsol_aggregate_nodes_include_comment_entries` — line 357.
- `bsol_writer_output_may_exceed_original_input_cap` — line 372.

### `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaTests.bd`

- `bsol_native_profile_v1_and_v2_declared_rule_load` — line 136.
- `bsol_native_schema_valid_primitives_return_checked_document` — line 158.
- `bsol_native_schema_missing_required_field` — line 168.
- `bsol_native_schema_duplicate_field_keeps_both_spans` — line 173.
- `bsol_native_schema_unknown_field_rejects_without_extras` — line 178.
- `bsol_native_schema_wrong_primitive_kind_and_integer_range` — line 183.
- `bsol_native_schema_invalid_profile_fails_at_profile_boundary` — line 194.

### `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/SchemaStructuredTests.bd`

- `bsol_schema_compound_types_have_checked_structural_arena` — line 93.
- `bsol_schema_valid_union_map_inline_reference_and_local_attributes` — line 124.
- `bsol_schema_union_list_and_map_values_check_each_element` — line 138.
- `bsol_schema_inline_fields_and_reference_qualifier_are_checked` — line 146.
- `bsol_schema_block_and_field_attribute_allowlists_are_local` — line 154.
- `bsol_schema_unknown_union_alternative_rejects_profile` — line 162.
- `bsol_schema_absent_attribute_allowlists_reject_unlisted_attributes` — line 185.

### `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/ImportGraphTests.bd`

- `bsol_typed_write_reowns_profile_before_invoking_binding` — line 52.
- `bsol_imported_alias_composes_defaults_and_revalidates_owned_closure` — line 82.
- `bsol_imported_private_keys_do_not_shadow_quoted_local_rule_names` — line 109.
- `bsol_imported_reference_aliases_share_one_owned_target` — line 126.
- `bsol_imported_qualifier_parser_rejects_empty_segments` — line 154.
- `bsol_import_graph_diamond_deduplicates_owned_source_and_keeps_namespaces` — line 161.
- `bsol_import_graph_cycles_and_missing_cache_never_publish_partial_graph` — line 175.
- `bsol_import_graph_limits_cover_the_whole_closure` — line 189.
- `bsol_import_graph_preserves_supported_schema_version_in_owned_cache` — line 203.

### `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/MigrationTests.bd`

- `bsol_migration_stage_is_fresh_and_requires_declared_definition` — line 20.
- `bsol_migration_selected_typed_nodes_preserve_other_strings_and_original` — line 113.
- `bsol_migration_ambiguous_routes_report_both_definitions` — line 166.
- `bsol_migration_self_cycle_rejects` — line 171.
- `bsol_migration_no_route_and_already_target_are_distinct` — line 176.
- `bsol_migration_destination_collision_preserves_original` — line 183.
- `bsol_migration_chain_reaches_target_without_mutating_input` — line 204.
- `bsol_migration_chain_cycles_are_checked_before_application` — line 217.

### `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/TypedBindingTests.bd`

- `bsol_explicit_typed_binding_reads_exact_integer_after_validation` — line 127.
- `bsol_explicit_typed_binding_write_roundtrip_is_profile_checked` — line 139.
- `bsol_typed_binding_missing_duplicate_and_wrong_kind_reject` — line 161.

### `compiler/corelib/beskid_corelib/tests/corelib_tests/src/bsol/CorpusTests.bd`

- `bsol_shared_corpus_values_and_runtime_manifest` — line 48.

### `compiler/crates/beskid_codegen/tests/glue_binding_facts.rs`

- `canonical_glue_facts_preserve_logical_managed_and_scalar_identity` — line 20.
- `canonical_glue_metadata_decodes_escapes_and_rejects_decoded_nul` — line 38.
- `canonical_glue_metadata_is_closed_and_unique` — line 45.
- `canonical_glue_type_closure_bounds_wide_signatures` — line 55.
- `canonical_glue_generic_reference_keeps_its_declaration_and_position` — line 64.
- `canonical_glue_handle_brand_retains_qualified_owner_and_arguments` — line 73.
- `opaque_shape_projection_preserves_applied_arguments_without_scalar_brand_grants` — line 88.

### `compiler/crates/beskid_aot/tests/glue_declarations_v06.rs`

- `glue_declarations_select_only_manifest_glue_libraries` — line 38.

### `compiler/crates/beskid_tests_interop/src/interop/glue_owned.rs`

- `v06_glue_driver_denied_from_build_tree` — line 239.
- `v06_glue_driver_admitted_only_from_private_prefix` — line 248.
- `v06_glue_driver_denied_when_sibling_tampered` — line 263.
- `v06_glue_driver_denied_when_sibling_missing` — line 271.
- `v06_glue_driver_denied_when_sibling_escapes_prefix` — line 280.
- `v06_glue_owned_roundtrip_all_representations` — line 829.
- `v06_glue_owned_opaque_borrow_survives_release` — line 840.
- `v06_glue_owned_denies_missing_import_row` — line 883.
- `v06_glue_owned_denies_consumer_without_owner_domain` — line 905.
- `v06_glue_owned_denies_duplicate_owner_library` — line 919.
- `v06_glue_owned_rejects_foreign_owner_brand` — line 935.
- `v06_glue_owned_rust_owner_fails_closed_outside_prefix` — line 948.
- `v06_glue_cli_builds_owned_fixture_alone` — line 1171.
- `v06_glue_cli_published_images_fail_closed_on_substitution` — line 1200.
- `v06_glue_cli_ignores_inherited_rust_environment` — line 1253.
- `v06_glue_cli_rejects_ancestor_cargo_config` — line 1272.
- `v06_glue_cli_rebuild_replaces_and_failed_rebuild_preserves` — line 1292.
- `v06_native_test_object_compiles_shared_helper_once_and_links_distinct_entries` — line 1340.

### `compiler/crates/beskid_codegen/tests/rust_glue_backend.rs`

- `production_rust_backend_emits_from_registered_manual_export_inputs` — line 32.
- `checked_exports_validate_scalars_and_resolve_managed_inputs_before_effects` — line 94.
- `production_rust_backend_rejects_foreign_item_generation` — line 164.
- `registered_managed_exports_emit_normalized_adapters_and_compiled_shapes` — line 179.
- `generated_peer_executes_typed_dispatch_and_denies_before_effects` — line 223.
- `exact_width_range_and_arity_precede_service_effects` — line 253.

### `compiler/crates/beskid_analysis/src/mod_host/glue.rs`

- `empty_session_returns_program_unchanged` — line 183.
- `counts_only_glue_contract_registrations` — line 191.
- `is_glue_registration_matches_all_seven_glue_contracts` — line 209.
- `is_glue_registration_rejects_non_glue_contracts` — line 224.
- `is_glue_attribute_recognizes_the_three_glue_names` — line 229.
- `is_glue_attribute_rejects_non_glue_names` — line 236.
- `glue_attribute_kind_from_name_round_trips` — line 244.
- `collect_glue_annotations_returns_empty_for_plain_program` — line 255.
- `collect_glue_annotations_collects_all_three_attributes` — line 262.
- `run_glue_counts_glue_annotations_and_returns_program_unchanged` — line 302.

### `compiler/crates/beskid_cli/tests/glue_rust_build_v06.rs`

- `glue_dotnet_is_unavailable` — line 104.
- `stale_backend_message_is_gone` — line 111.
- `glue_rust_without_tool_flags_names_the_required_form` — line 122.
- `rust_toolchain_conflicts_with_cargo` — line 129.
- `cargo_without_rustc_is_rejected` — line 148.
- `missing_linker_is_rejected` — line 157.
- `tool_flags_are_rejected_for_clif` — line 165.
- `non_shared_kind_is_rejected` — line 173.
- `app_and_test_targets_are_rejected` — line 182.
- `glue_rust_without_glue_block_is_rejected` — line 191.
- `glue_blocks_with_default_clif_backend_are_rejected` — line 198.
- `glue_block_without_referencing_binding_is_rejected` — line 205.
- `unreferenced_glue_block_is_rejected` — line 212.

### `compiler/runtime/beskid/tests/runtime_semantics/src/ProcessIoTests.bd`

- `process_and_byte_io_surface_is_target_consistent` — line 7.

### `compiler/crates/beskid_glue/tests/stdio_peer.rs`

- `exact_handshake_and_binding_admission_precede_effects` — line 30.
- `malformed_values_and_incompatible_handshake_never_dispatch` — line 61.
- `typed_errors_cancel_and_shutdown_are_protocol_frames` — line 86.
- `cancellation_is_bound_to_original_method_and_output_failure_is_terminal` — line 108.
- `premature_eof_and_closed_service_cannot_admit_or_wait` — line 141.
- `service_drives_partial_frames_and_flushes_ack_before_return` — line 170.

### `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/BinaryCodecTests.bd`

- `glue_signed_value_uses_shared_exact_width_and_twos_complement` — line 8.
- `glue_codec_rejects_out_of_range_values_before_output` — line 30.
- `glue_float_negative_zero_preserves_exact_ieee_bits` — line 42.

### `compiler/corelib/beskid_corelib/tests/corelib_tests/src/glue/ControlEnvelopeTests.bd`

- `glue_shutdown_has_empty_payload_and_exact_canonical_wire_offsets` — line 15.
- `glue_cancel_and_shutdown_reject_binary_unit_as_control_payload` — line 36.

## Authority and limits

Normative sources: `openspec/changes/v06-cli-dependencies/specs/`, `openspec/changes/v06-serialization-bsol/specs/`, `openspec/changes/v06-rust-glue-integration/specs/`, and `openspec/changes/v06-release-qualification/specs/compiler--conformance--conformance-evidence-policy/spec.md`. Current run/repair evidence remains in `docs/reports/2026-10-06-v06-standard-evidence-audit.md`; this report does not replace it. The source tree is dirty and changing under the coordinator; re-review declarations and source hashes before freezing. No source-level partial row may be promoted merely because an unrelated Cargo binary passes.
