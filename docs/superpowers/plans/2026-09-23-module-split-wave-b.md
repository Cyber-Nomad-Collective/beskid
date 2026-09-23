# Module Split Wave B (2026-09-23)

> **Sequencing override (2026-09-23):** do not start any batch yet. The contract-system work runs on a
> separate branch (`codex/v05-contracts`, worktree `.worktrees/compiler-v05-contracts`) and its next
> slices edit the semantic pipeline (`crates/beskid_analysis/src/services/prepare.rs`), generic
> specialization (`calls/generics.rs`, `abi/specialization.rs`) and likely `model.rs`. The GC redesign
> and the try-operand lowering fix touch `crates/beskid_isle/src/facts.rs` and
> `tests/isle_adapter/enum_match_result.rs`. Splitting these files on the f6 branch first would turn
> the contracts merge into a large conflict resolution. Run wave B after contract slices 6-8 (and the
> pipeline-reorder slice) are merged, the GC redesign is green, and the try-operand fix has landed.

Re-measured at worktree commit 9fe0ac3e. Sizes moved from the task prompt; all figures below are current.

## Files and proposed layouts

**semantic_contract/layouts/enum_layout.rs (1406)** → `layouts/enum_layout/{layout.rs (1-290 impl+append_storage+align), candidate_path.rs (287-596), constructor.rs (597-696), match_materialize.rs (696-1109), scrutinee.rs (1109-1406)}`. Keep `enum_layout.rs` as re-export shim. `mod scalar_payload_tests` moves with layout.rs.

**semantic_contract/model.rs (1141)** → split by concern: `model/ids.rs` (SourceUnitId, format_* helpers, 1-117), `model/typed_program.rs` (TypedProgram, SyntaxUnitInput/Revision, 118-260), `model/resolution.rs` (ResolvedItem/Local, LocalSlot, MutableLocalAssignment, 179-350), `model/closures.rs` (Closure* structs, SpawnTarget/Diagnostic/Legality family, 212-390), `model/types.rs` (SemanticTypeId + Display, TypedArrayAllocation, ManifestBuiltin+Serialize, 390-577), `model/generics.rs` (GenericCallInstantiation/Specialization, ContractParameterWitness, 550-end). All are plain data structs — low risk, pure move.

**semantic_contract/abi/specialization.rs (1044)** → `abi/specialization/{corelib.rs (1-96 service result + entry points), inference.rs (96-522 specialization_for_call_in_environment, infer_source_substitutions), abi_fit.rs (522-758 integer/transparent-path checks), manifest_map.rs (758-920 manifest_type_to_semantic, corelib_service_abi_type), instance.rs (920-1015 generic_specialization_instance)}`, tests submodule stays with instance.rs or its own `tests.rs`.

**semantic_contract/calls/generics.rs (996)** → group by identity kind: keep header/shared types in `generics.rs`, move `generic_source_path_identity` (243-386) → `identity_path.rs`, aggregate/field identity (386-426) → `identity_field.rs`, callable-result identity (426-514) → `identity_callable.rs`, local identity (514-end) → `identity_local.rs`.

**semantic_contract/closures_spawn.rs (901)** → `closures_spawn/{capture.rs (1-572 closure_capture_declaration and helpers), fiber_binding.rs (572-671 containing_fiber_callable, fiber_type_declaration, fiber_owner_seed), spawn_diagnostics.rs (671-end)}`.

**semantic_contract/typing.rs (727)** → `typing/{aggregate.rs (1-219), callable_result.rs (219-348), match_binding.rs (348-575 join_match_arm_type, pattern_binding_abi_type/specialization, enum_match_pattern_binding), unary.rs (575-end)}`.

**semantic_contract/cleanup.rs (664)** → `cleanup/{scoped.rs (1-224 scoped_cleanup + node walk), acquisition.rs (224-368), escape.rs (368-516 fresh/scoped_resource_escape, method_escape), scope_lookup.rs (516-664 visible_units, contract_declaration, named_type, conversion_candidates)}`.

**beskid_isle/src/facts.rs (711)** → data-only file: `facts/{catalogue.rs (syntax_node_kind_catalogue, unsupported_typed_operation_kinds, 1-322), call_shapes.rs (DirectCallee, SpawnEntry, TracedFiberJoinLayout, InlineCapture/ClosureEnvironment/LambdaCall/Entry, 322-510), match_range.rs (MatchArmFact family, RangeFact, 418-510), cleanup_slots.rs (ScopedCleanupPlan, LocalSlotId, ParameterSlot, 510-711)}`.

**beskid_isle/src/context/calls.rs (711)** — single `impl IsleContext` block plus `corelib_service_native_signature`. Splitting an `impl` block across files needs `impl` fragments in each submodule (fine in Rust) named by call-shape groups; read method names before committing to a cut — not done in this pass. Flag as **needs a closer read**, not blocked by other work.

**beskid_codegen/src/isle_adapter/facts_node.rs (779) and facts_helpers.rs (635)** — both are a single `impl NodeFacts`/`impl SyntaxNodeFacts` block each. Same caveat as calls.rs: safe to split by method-group once sub-boundaries are read; `facts_helpers.rs` additionally carries `select_typed_corelib_value_service` + its test module (595-635) which can move out cleanly first as a low-risk win.

**beskid_analysis/src/services/prepare.rs (875, was 855)** → `prepare/{options.rs (PrepareOptions, PreparedCompilation, 1-108), entry_points.rs (prepare_compilation*, 108-245), spine.rs (run_prepare_spine, 245-545 — largest chunk, re-check seams before cutting), diagnostics.rs (dedupe, collect_analyzer_*, semantic_facts_errors_to_diagnostics, 533-634), fingerprint.rs (typed_fingerprint*, 625-644)}`.

**Large test files** (`enum_match_result.rs` 2025, `module_emission_specialization.rs` 1395, `parsed_project_isle_harness.rs` 1068): split by scenario grouping (`#[test] fn` blocks are independent). `parsed_project_isle_harness.rs` uses `include_str!("../src/services.rs")` and `../src/lib.rs` relative paths — any submodule split must stay inside `tests/isle_adapter/` (or `tests/`) at the same depth or these paths break.

**runtime/beskid/src/Runtime/Fiber/Scheduler/Core.bd (713)**: no `mod`/`use`/`pub mod` statements found — likely a flat top-level `.bd` file relying on directory-based module resolution. Do not split without first reading `.bd` module-file conventions (Runtime/Fiber/Scheduler/ neighbors) — unverified in this pass, flag as unknown risk.

## Other files >600 lines, not wave-A-covered (non-generated, non-build-artifact)
`crates/beskid_queries/src/semantic_contract/layouts/field_access.rs` (615), `crates/beskid_queries/src/semantic_contract/queries.rs` (602), `crates/beskid_analysis/src/mod_host/api.rs` (607), `crates/beskid_cli/src/commands/matrix_test.rs` (665). Below the ~600 threshold's clear priority tier; include only if wave B has spare capacity.
`crates/beskid_queries/src/semantic_contract/contracts.rs` is 576 — under threshold, and is the active contract-slice file; exclude entirely.

## Risks
- No `#[salsa::tracked]` functions found in any wave-B target file (grep confirmed) — lower risk than wave A's Salsa-heavy files.
- `generated_call_methods!` macro lives in `beskid_isle/src/context.rs`, not `context/calls.rs` — no direct collision, but confirm the macro doesn't reference `calls.rs` paths by name before moving methods.
- `parsed_project_isle_harness.rs` `include_str!` relative paths are the one concrete file-path hazard found.
- `impl` blocks in `context/calls.rs`, `facts_node.rs`, `facts_helpers.rs` need one more read pass to find real method-group seams before cutting.
- `.bd` split rules for `Core.bd` are unverified — treat as blocked on doc/convention check, not on other workstreams.

## Execution order (avoiding collisions)
1. **Safe now, no dependency**: `model.rs`, `facts.rs` (data-only), `abi/specialization.rs`, `typing.rs`, `cleanup.rs`, `closures_spawn.rs`, `calls/generics.rs`, `prepare.rs`, the three large test files, `facts_helpers.rs`'s low-risk tail extraction.
2. **Wait for contract-slice/generic-specialization workstream to clear `semantic_contract/contracts.rs` and generic specialization**: `enum_layout.rs` (touches enum constructor/match specialization, adjacent to generics) — do this batch after batch 1 lands and contract-slice work rebases past it.
3. **Needs a follow-up read (impl-block seam finding), not blocked by other workstreams**: `context/calls.rs`, `facts_node.rs`, remainder of `facts_helpers.rs`.
4. **Blocked/unknown — do not touch until GC/scheduler workstreams confirm safe windows and `.bd` module rules are checked**: `Core.bd` (scheduler work owns `Fiber/Scheduler/**` directly).

## Appendix B — .bd module split convention

**(1) File→module mapping.** `infer_logical_module_path` (`crates/beskid_analysis/src/projects/assembly/module_index/path_inference.rs:29-63`) strips the source root, drops the `.bd` extension, and turns path segments into module path segments; `collapse_homonymous_module_segment` (`:65-72`) special-cases `Foo/Foo.bd` → module `[…, Foo]`. So `Scheduler/Core.bd` maps to module `Runtime.Fiber.Scheduler.Core` (a *child* of `Runtime.Fiber.Scheduler`), while `Scheduler.bd` itself maps to `Runtime.Fiber.Scheduler` (collapsed). One type/namespace per file is convention, not enforced; a `Name/` directory holds `Name.bd`'s split-out children.

**(2) `pub mod` is registration only, not re-export.** `Scheduler.bd:6-13` lists eight `pub mod Runtime.Fiber.Scheduler.X;` lines. `collect_items` (`crates/beskid_analysis/src/resolve/collect.rs:376-386`) only calls `module_graph.ensure_module_path` for a `ModuleDeclaration` — no scope merge. Items become visible in a *using* file only via `collect_use_declaration` → `import_public_items_from_module` (`collect.rs:398-451`), which requires an explicit `use` and copies only `Visibility::Public` `Function|Enum|Type|Contract` items into the importer's scope.

**(3) Visibility.** `import_public_items_from_module` filters on `info.visibility != Visibility::Public` (`collect.rs:433`), so non-`pub` fns/types stay file-private even to sibling files in the same directory. `ConstantDefinition = { "const" ~ Identifier ~ "=" ~ IntegerLiteral ~ ";" }` (`crates/beskid_analysis/src/beskid.pest:200`) has no `pub` alternative — consts are always file-private; cross-file numeric constants must be re-declared per file (see (5)) or exposed via a `pub` accessor function, precedent `TypeDescriptorArrayFlag()` in `runtime/beskid/src/Runtime/Bootstrap/Objects.bd:66`.

**(4) Runtime embedding.** New split files must be added to `canonical_runtime_sources()` in `crates/beskid_abi/src/runtime_source/sources.rs` as an `include_str!` `SourceUnit` (pattern at `:229-244`, existing Scheduler entries `:125-141`) plus a `CANONICAL_SCHEDULER_*_SOURCE_PATH` const (`sources.rs:18-26`). `canonical_runtime_source_hash()` (`sources.rs:468-470`) hashes the full `canonical_runtime_sources()` list via `canonical_source_hash` (`crates/beskid_abi/src/abi_v5.rs:437-451`, sorts by `logical_path`, errors on duplicate paths) — any split changes this hash, and `crates/beskid_abi/src/runtime_source/kits.rs:29-48` fails closed on a kit/compiler hash mismatch, so a runtime kit rebuild is required. `CorelibService` (`crates/beskid_abi/src/runtime_source/corelib_services/`) and the codegen-side `corelib_services` collection (`crates/beskid_codegen/src/module_emission/imports.rs:137-186`) key off callee identity, not source path, so a pure code-move doesn't need service-table edits — but existing tests assert exact paths (`crates/beskid_abi/tests/canonical_scheduler_sources.rs:1-19`) and must gain new path assertions.

**(5) Existing split precedent.** `Runtime/Mem/Gc/{State,Marking,Sweep}.bd` and `Runtime/Fiber/Scheduler/*.bd` are the working examples. Shared numeric constants are **redeclared per file**, sometimes with a disambiguating suffix when both the raw name and a purpose-qualified name are needed in the same file set (`State.bd:13 HEAP_FIRST_REGION` vs `Marking.bd:45 HEAP_FIRST_REGION_MARKING`; `Sweep.bd` reuses `HEAP_FIRST_REGION`/`REGION_NEXT`/etc. unchanged) — this works only because `const` is file-private (3), so no cross-file collision occurs. No shared "constants.bd" file is used anywhere in the runtime tree.

### Convention (write-up)
- **Layout**: for a hub `Name.bd` that grows too large, create `Name/` beside it holding the split files, and turn `Name.bd` into a thin facade: doc comment + one `pub mod Parent.Name.Child;` per new file, in dependency order (see `Scheduler.bd`). Each child file's module path is `Parent.Name.Child`.
- **Naming**: name each child file for its responsibility group (`Storage`, `Queue`, `Loop`, `Exports`, etc.), not `partN`.
- **Constants**: redeclare needed `const`s in every file that uses them (copy, don't import — consts can't be `pub`). Prefer identical names; add a suffix only when a file already has a same-named constant with different intent.
- **Callers**: any `.bd` file that calls a `pub` fn/type now living in a child module must add `use Runtime.Fiber.Scheduler.Child;` — same-directory siblings do **not** see each other's `pub` items automatically (2).
- **Embedding/build**: (a) add each new file to `canonical_runtime_sources()` + a `CANONICAL_*_SOURCE_PATH` const in `sources.rs`; (b) expect `canonical_runtime_source_hash()` to change and rebuild/re-sign the runtime kit per `kits.rs`; (c) add/extend a `canonical_*_sources_exist` test (pattern: `crates/beskid_abi/tests/canonical_scheduler_sources.rs`); (d) grep `corelib_services`/`CorelibService` call sites only if the split renames or removes a service-callable symbol, not for a pure move.
- **Tests proving behaviour-neutrality**: (1) the existing `crates/beskid_abi/tests/scheduler_lifecycle_sources.rs`-style path-existence test extended with new paths; (2) `crates/beskid_engine/tests/spawn_scheduler.rs` and `runtime/beskid/tests/runtime_semantics/src/SchedulerTests.bd` re-run unchanged (same runtime semantics, just recompiled from more source units) — a diff-free pass is the behaviour-neutrality proof; (3) `canonical_runtime_source_hash()` changing is expected and must be reflected everywhere it's pinned (grep the new hash literal across `crates/beskid_abi`).

### Applied to Core.bd (713 lines)
Item inventory (line ranges from `runtime/beskid/src/Runtime/Fiber/Scheduler/Core.bd`):
- 13-26: fiber-state/join discriminant consts (`FIBER_STATE_*`, `FIBER_JOIN_*`)
- 28-101: scheduler-table/fiber-record layout doc + offset consts (`FIBER_OUTCOME_*_OFFSET`, `FIBER_TABLE_MAX`, `FIBER_NONE`, `FIBER_STACK_*_SIZE`, `SCHEDULER_*_OFFSET`)
- 104-165: table/record accessors — `SchedTable`, `FiberRecord`, `FiberGeneration`, `FiberSetGeneration`, `FiberExists`, `FiberHandle`, `FiberHandleIndex`, `FiberHandleValid`, `FiberAllocationFailed`
- 178-260: `FiberAlloc`
- 260-322: `SchedulerStackCheck`, `SchedulerStackOverflowObserved`, `FiberJoinStatusWord`
- 323-434: current-fiber/mutator-token/local-state — `SchedulerCurrentFiber`, `SchedulerAcquireMutatorToken`, `SchedulerReleaseMutatorToken`, `SchedulerSetCurrentFiber`, `SaveFiberLocalState`, `RestoreFiberLocalState`, `MarkRootFrameChain`, `MarkSuspendedFiberRoots`, `FiberYield`, `FiberCurrentId`
- 446-530: run-queue + fiber state — `RunQueuePush`, `RunQueuePop`, `RunQueueEmpty`, `FiberSetState`, `FiberState`, `FiberParked`, `FiberFinished`
- 510-596: `FiberReleaseStackRoots`, `FiberCleanup`, `FiberDone`, `SchedulerContext`
- 604-693: lifecycle — `SchedInit`, `SchedShutdown`, `SchedShutdownForced`
- 693-713: `SchedulerSpawn`

Proposed split (mirrors the Gc/State-Marking-Sweep and Scheduler/Storage-Queue-Loop precedent already in the same directory — note `Storage.bd`, `Queue.bd`, `Loop.bd` are sibling files, so some of the above may already logically belong there and should be checked for duplication before moving, not copied blind):
- `Scheduler/Records.bd` — table/record layout consts + accessors (lines 13-260: state/join consts, offset consts, `SchedTable`/`FiberRecord`/`FiberGeneration*`/`FiberExists`/`FiberHandle*`/`FiberAllocationFailed`/`FiberAlloc`).
- `Scheduler/RunState.bd` — run queue + fiber state transitions (446-530: `RunQueue*`, `FiberSetState`, `FiberState`, `FiberParked`, `FiberFinished`).
- `Scheduler/Roots.bd` — mutator token, local-state save/restore, GC root marking, yield (323-434 minus `SchedulerCurrentFiber` which `RunState`/`Lifecycle` both need — keep `SchedulerCurrentFiber` in `Records.bd` alongside `SchedTable` and re-declare nothing, just call across via `use`).
- `Scheduler/Lifecycle.bd` — `SchedulerStackCheck`/`SchedulerStackOverflowObserved`/`FiberJoinStatusWord`, `FiberReleaseStackRoots`/`FiberCleanup`/`FiberDone`/`SchedulerContext`, `SchedInit`/`SchedShutdown*`/`SchedulerSpawn` (260-322, 510-713).
Each new file adds `use Runtime.Fiber.Scheduler.Records;` etc. for cross-file `pub` calls (e.g. `Lifecycle.bd` calling `SchedTable`), and `Scheduler.bd`'s facade gains four more `pub mod` lines in dependency order (`Records` before `RunState`/`Roots`/`Lifecycle`). All moved consts stay file-private per (3); none are currently referenced outside `Core.bd` per a same-directory grep, so no redeclaration is needed yet — only if a sibling file later needs one of these offsets.

### OpenSpec
Module/visibility semantics ((1)-(3)) are existing, already-normative compiler behavior, not new — no new OpenSpec requirement needed for the split itself, since it changes no observable behavior (source reorganization only, hash change is a build artifact, not a spec-level contract). If wave-B work ever changes *visibility rules themselves* (e.g. adding `pub const`), that would need an OpenSpec change; splitting `Core.bd` does not.

## Appendix A — seams for single-impl files

Precedent confirmed: `beskid_isle/src/context/` already splits `impl IsleContext<'_,'_,'_,'_>` across `calls.rs`, `aggregate.rs`, `enums.rs`, etc. (each file `use super::*;` + its own `impl` block), and `beskid_analysis/.../lowering_prep/walker/` does the same for `impl PrepWalker`. All three target files below follow that pattern one level deeper — turning one already-a-submodule file into a small directory of submodules.

### `beskid_isle/src/context/calls.rs` (711 lines, `impl IsleContext<'_,'_,'_,'_>`)

Methods (all `pub(super)` unless noted): `emit_corelib_service_call` 4-25, `import_direct_call` 27-67, `adapt_corelib_service_call` (private) 69-104, `emit_bulk_call` 113-183, `materialize_canonical_runtime_direct_constant` 189-204, `emit_collection_operation_value` 205-382, `direct_call` 384-398, `traced_value_move_call` (private) 400-432, `traced_channel_send_call` (private) 434-473, `inline_lambda_call` 475-499, `emit_inline_closure_environment` 501-534, `symbol_global` 536-544, `import_runtime_helper` 546-564, `direct_call_statement` 566-578; free fn `corelib_service_native_signature` 581-606; macro `generated_call_methods!` 608-711 (invoked once, from `context.rs:334`, as `calls::generated_call_methods!()` — the trait-dispatch shim for `emit_direct_call`, `emit_bulk_call`, `emit_collection_operation`, `emit_direct_call_statement`, `emit_spawn`, `emit_lambda`, `emit_inline_lambda_call`; `emit_spawn`/`emit_lambda` currently have full bodies inlined in the macro, not delegated).

Call graph groups:
- **direct.rs** (~230 lines): `emit_corelib_service_call`, `import_direct_call`, `adapt_corelib_service_call`, `direct_call`, `direct_call_statement`, `materialize_canonical_runtime_direct_constant`, `corelib_service_native_signature`. All feed the plain direct-call path; `direct_call`/`direct_call_statement` are the macro's delegation targets.
- **traced.rs** (~80 lines): `traced_value_move_call`, `traced_channel_send_call` — fiber-join/channel-send ABI-value moves, called only from `direct_call`/`direct_call_statement`.
- **collections.rs** (~180 lines): `emit_collection_operation_value` (Capacity/Append/Clear/RemoveLast) — self-contained, only calls shared helpers.
- **closures.rs** (~150 lines): `inline_lambda_call`, `emit_inline_closure_environment`, plus two **new** inherent methods extracted from the macro body — `spawn_value` (was inline `emit_spawn` body) and `lambda_trampoline_value` (was inline `emit_lambda` body). These three are the closure/trampoline/spawn family and all call `emit_inline_closure_environment`.
- **helpers.rs** (~35 lines): `symbol_global`, `import_runtime_helper` — used by direct.rs, collections.rs, closures.rs alike; keep as a small shared leaf so no group depends on another group's file.
- **mod.rs** (~40 lines): `mod direct; mod traced; mod collections; mod closures; mod helpers;` plus the `generated_call_methods!` macro (shrunk: `emit_spawn`/`emit_lambda` arms become one-line delegations to `self.spawn_value`/`self.lambda_trampoline_value`, matching the existing delegation style of the other five arms).

Visibility: today's `pub(super)` on these methods means "visible to `crate::context`" (siblings of `calls.rs`). Once split one level deeper, a method still needed by `context.rs` or another `context/*.rs` sibling (e.g. `direct_call`, `direct_call_statement`, `emit_inline_closure_environment` — check callers with `rg 'self\.(direct_call|direct_call_statement|emit_inline_closure_environment)\b' crates/beskid_isle/src/context` before cutting) must be `pub(in crate::context)`, not bare `pub(super)` (which would only reach `crate::context::calls`). Methods used only within the new `calls/` group (e.g. `adapt_corelib_service_call`, `traced_value_move_call`, `symbol_global`) can stay `pub(super)`/private at the new depth.

Edit order: helpers.rs first (no internal deps) → traced.rs and collections.rs (leaf groups) → direct.rs (depends on helpers) → closures.rs (depends on helpers; extract the two macro-inline bodies) → mod.rs last (shrink macro, wire `mod` declarations, fix visibility per the grep above).

### `beskid_codegen/src/isle_adapter/facts_node.rs` (779 lines, `impl NodeFacts for SyntaxNodeFacts<'_>`)

This is a **trait impl** — it cannot be split into multiple `impl NodeFacts for ...` blocks across files the same way inherent impls can (one coherent trait impl must live in one place). Resolution: keep one thin `impl NodeFacts for SyntaxNodeFacts<'_>` in `facts/node.rs` where every trait method is a one-line delegator to a same-named (or `_impl`-suffixed where it collides with a helper already named that in `facts_helpers.rs`, e.g. `scalar_type` vs the helper's `scalar_semantic_type` — no actual collision found) inherent method defined in a submodule's inherent `impl SyntaxNodeFacts<'_>` block (inherent impls split freely, same precedent as `calls.rs`).

Trait methods grouped by the concept groups given in the task, with line ranges from the current file:
- **shape.rs**: `scoped_cleanup` 4-28, `node_kind` 29-37, `literal_kind` 39-47, `child` 82-121, `statement_count` 123-155, `block_result` 157-162, `let_initializer` 164-168, `local_slot` 170-197, `mutable_local_assignment_slot` 199-202, `index_target_is_string` 270-272, `clif_block_body` 470-472.
- **literals.rs**: `constant_integer` 49-51, `canonical_runtime_constant_integer` 53-59, `integer_literal` 474-483, `boolean_literal` 485-490, `float_literal` 492-497, `char_literal` 499-503, `string_literal` 506-511.
- **types.rs**: `operator_fact` 61-80, `primitive_numeric_conversion` 242-244, `semantic_type` 246-256, `managed_reference` 258-260, `scalar_type` 513-556, `try_expression_fact` 262-264, `try_return_layout` 266-268, `range_fact` 673-676.
- **calls.rs**: `call_kind` 204-240, `direct_callee` 331-361, `call_signature` 363-391, `call_arguments` 393-396, `inline_lambda_call` 398-429, `runtime_intrinsic_kind` 274-297, `spawn_entry` 678-705, `traced_fiber_join_layout` 707-723, `traced_channel_send_layout` 725-743, `lambda_entry` 745-778.
- **collections.rs**: `collection_operation` 299-324, `collection_element_type` 326-329.
- **structs.rs**: `struct_fields` 558-560, `struct_layout` 562-566, `managed_struct_allocation` 568-577, `field_index` 579-581, `field_receiver_slot` 583-590, `array_elements` 431-433, `array_layout` 435-444, `managed_array_allocation` 446-453, `function_parameters` 455-468.
- **enums.rs**: `enum_layout` 592-594, `binary_enum_layout` 596-633, `enum_variant_index` 635-639, `enum_payloads` 641-648, `match_arms` 650-671.

Each of these becomes an inherent `impl SyntaxNodeFacts<'_>` block in `isle_adapter/facts/<name>.rs`; `facts/node.rs` keeps only the trait impl with ~35 one-line delegators (~90 lines). Every group file lands well under 200 lines.

### `beskid_codegen/src/isle_adapter/facts_helpers.rs` (635 lines, inherent `impl SyntaxNodeFacts<'_>`, freely splittable) + free fn `select_typed_corelib_value_service` + its `#[cfg(test)]` module (595-635)

Groups (all inherent, no trait constraint):
- **type_dispatch.rs** (~110 lines): `typed_corelib_value_service` 7-19, `managed_reference_in_context` 24-94, `specialized_local_managed_reference` 96-110, `generic_parameter_name_for_declaration` 112-124, plus the free fn `select_typed_corelib_value_service` 595-607 and its test module 609-635 (keep the free fn + its tests colocated — this is the "low-risk win" already flagged in the plan body above).
- **struct_layout.rs** (~100 lines): `aggregate_literal_layout_in_context` 130-136, `struct_fields_in_layout_order` 138-153, `aggregate_field_access_in_context` 155-163, `struct_layout_for_literal` 195-198, `struct_layout_for_access` 200-206, `struct_layout_from_object` (private) 212-229.
- **array_layout.rs** (~90 lines): `array_index_element_type_in_context` 165-171, `array_elements_for_literal` 331-334, `array_layout_for_literal` 336-342, `array_layout_for_bulk` 350-356, `typed_array_plan` 358-360, `array_layout_for_typed_allocation` 362-368, `callee_bulk_parameter` 376-390.
- **enum_layout.rs** (~100 lines): `specialized_enum_constructor` 173-179, `enum_layout_for` 231-238, `enum_match_in_context` 240-244, `enum_layout_from_fact` 246-252, `match_payload_pattern` 254-295, `build_enum_layout` (private) 298-329.
- **call_context.rs** (~55 lines): `generic_call_specialization_in_context` 181-193, `runtime_intrinsic` 392-395, `scheduler_compiler_operation` 397-400, `collect_function_parameters` 402-464.
- **node_walk.rs** (~95 lines): `scalar_semantic_type` 466-537, `specialized_pattern_binding` (private) 539-545, `literal` 547-551, `clif_block_body_for` 553-555, `children` 557-570, `raw_children` 572-574, `unwrap_transparent` 576-592.

Visibility: `facts_node.rs`'s new `facts/*.rs` group files and `facts_helpers.rs`'s new `facts_helpers/*.rs` (or merge both sets under one `facts/` directory — recommended, since node.rs's groups and helpers' groups call each other, e.g. `structs.rs` calls `struct_layout_for_literal` from `struct_layout.rs`) need `pub(in crate::isle_adapter)` on any method called from a sibling group file outside their own new submodule, mirroring the `calls.rs` visibility note above. Today's flat `pub(super)` (meaning `pub(in crate::isle_adapter)`, since both files are direct children of `isle_adapter/`) already resolves correctly only if the new files stay direct children of `isle_adapter/facts/` rather than nesting one level deeper than that.

Edit order: extract `select_typed_corelib_value_service` + tests first (zero risk, already flagged) → `node_walk.rs` and `call_context.rs` (leaf-ish, few internal deps) → `array_layout.rs`, `struct_layout.rs`, `enum_layout.rs` (each depends on node_walk/call_context helpers) → `type_dispatch.rs` (depends on several of the above) → finally split `facts_node.rs` into `facts/node.rs` (thin trait dispatcher) + its six group files, since those delegate into the now-split helper groups and are easiest to verify last with a full `cargo check -p beskid_codegen`.

Method that resists clean grouping: `managed_reference_in_context` (facts_helpers.rs 24-94) reads call-context, runtime-intrinsic, operator, and scalar-type facts in one cascade — it genuinely spans `type_dispatch`, `call_context`, and `node_walk` concerns. Keep it in `type_dispatch.rs` (its primary purpose) but expect it to need `pub(in crate::isle_adapter::facts)` on some of node_walk's/call_context's helpers it calls, and flag it for one extra look during the actual edit rather than assuming the split is friction-free.
