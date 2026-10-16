## 1. Gate skeleton and E1201

- [x] 1.1 Add `SemanticFinding` and `SemanticError::unavailable_at` in `beskid_queries::semantic_contract::model`.
- [x] 1.2 Generalize `unresolved_declared_generic_argument` into `unresolved_type_reference` (let, parameter, return, field, lambda parameter, explicit call type argument positions).
- [x] 1.3 Add `beskid_queries::semantic_contract::legality::check_items` and call it from `lower_syntax_program` before and after specialization/witness discovery.
- [x] 1.4 Tests: extended `beskid_queries` `semantic_facts/local_type_resolution.rs` per position; `isle_adapter` full suite green (240/240); negative `heap_growth_native` engine fixture variant (missing `use Concurrency.FiberError;`) asserts E1201 and no `MissingRuleOrFact`.

## 2. Generic call findings (partial)

- [x] 2.1 `call_arity_mismatch` fact (E1204) and unit tests.
- [x] 2.2 Drop the `for root in input.roots()` specialization walk in `module_emission::specialization::resolve_module_items`.
- [ ] 2.3 `generic_binding_conflict` fact (E1229) in `beskid_queries` — deferred (see proposal "Out of scope").

## 2a. Unknown callee (design slice 3)

- [x] 2a.1 Extract `path_call_resolution` from `call_lowering` so "no call target" and "generic call with nothing to fix its type parameters" are distinguishable from resolution gaps without text matching.
- [x] 2a.2 `unresolved_call_target` fact: E1101 (unknown value), E1108 (unknown module qualifier), E1203 (missing type arguments); calls owned by other call authorities (primitive conversions, typed array allocations, closure calls, `range`, runtime intrinsics, spawn targets) and canonical runtime units are not judged.
- [x] 2a.3 Tests: `semantic_facts/calls_and_graph.rs` (positive and negative cases); `isle_adapter/diagnostics_fail_closed.rs` asserts the codes and no `MissingRuleOrFact`; `generic_specialization.rs` now expects E1203 instead of `MissingRuleOrFact`.

## 2b. Members and matches (design slice 4)

- [x] 2b.1 Extract `field_access_receiver` from `aggregate_field_access`.
- [x] 2b.2 `member_reference_legality` fact: E1211 (struct literal field, field read), E1301 (enum constructor and match pattern variant), E1302 (constructor payload count), E1307 (pattern payload count).
- [x] 2b.3 `match_exhaustiveness` fact: E1304 when a variant has no unguarded arm and there is no wildcard/binding arm (nested payload exhaustiveness stays with ISLE).
- [x] 2b.4 Tests: `legality` unit tests; `isle_adapter/diagnostics_fail_closed.rs` asserts each code and no `MissingRuleOrFact`/`NonExhaustiveMatch`.

## 2c. Imports (design slice 5)

- [x] 2c.1 `unresolved_imports` fact (E1105) against the assembled module registry, judged once per unit of a judged item (`audit_imports`).
- [x] 2c.2 Audit: not clean. `use Bootstrap.Native;` in `runtime/beskid/src/Runtime/Fiber/Scheduler/Loop.bd` and the partial Foundation/Network assemblies of 13 `isle_adapter` fixtures name no assembled module but lower today. E1105 therefore ships audit-only (ISLE trace `event=legality.audit rule=unresolved_import`), not in `check_items`.
- [x] 2c.3 Promote E1105 to a rejection (owner decision 3): `check_items` rejects E1105 and the audit-only trace path is removed. The runtime `use Bootstrap.Native;` was a dead, misspelled import (the module is `Runtime.Bootstrap.Native`) and is removed; the fact also accepts an item import (`use Concurrency.Channel.SendOk;`) whose parent names an assembled module that declares the item; the partial `isle_adapter` fixtures now carry the modules they import. Zero E1105 on corelib_tests (80/80 targets) and runtime_semantics (7/7).
- [x] 2c.4 Tests: `semantic_facts/assembly_resolution.rs` (unit scoping, audit-only); `isle_adapter/diagnostics_fail_closed.rs` (audited, lowering not rejected).

## 3. Verification

- [x] 3.1 `cargo test -p beskid_queries --lib semantic_contract::legality` and `--test semantic_facts local_type_resolution` green.
- [x] 3.2 `cargo test -p beskid_codegen --test isle_adapter` green (240/240, including the six partial-assembly regression tests named in the design).
- [x] 3.3 `cargo test -p beskid_engine --test heap_growth_native missing_fiber_error_import_...` green.
- [x] 3.4 Full regression pass after slices 3-5 on the builder: `beskid_queries` lib 19/19, `semantic_facts` 245/245, `beskid_codegen --test isle_adapter` 253/253, `beskid_analysis` all green (348 unit + integration), `beskid_engine` green except `extern_tests` (2, environment: test binary not under a runtime-kit prefix, unrelated).
- [x] 3.6 `beskid_cli test --plain --all-targets` with a rebuilt CLI and kit and `obj/` deleted: `corelib_tests` 80/80 targets (`--target-timeout 900`), `runtime_semantics` 7/7 (`--target-timeout 1500`); no legality-gate rejections.
- [x] 3.5 Confirmed the two pre-existing `beskid_queries::incremental` failures (`entry_resolution_with_db_populates_symbol_registry`, `typed_entry_state_uses_fast_resolution_when_stale`) reproduce identically against a clean `git archive HEAD` baseline with no uncommitted diffs from any slice — not a regression from this change.

## 4. OpenSpec

- [x] 4.1 Draft this change (`add-reachability-scoped-semantic-legality-gate`) with deltas to the four capabilities named in the design.
- [ ] 4.2 `openspec validate add-reachability-scoped-semantic-legality-gate --strict --no-interactive` (run from repo root; not yet executed in this pass).

## 5. Prepare-spine and LSP exposure (design slice 6)

- [x] 5.1 Generalize `TryDiagnosticAuthority` into `SemanticFactAuthority`; report legality findings for the entry item's reachable direct-call closure through the prepare spine. (`9065c47e`; `crates/beskid_analysis/src/services/prepare/{diagnostics,entry_points,spine}.rs`, `crates/beskid_queries/src/entry.rs`)
- [x] 5.2 Render a dependency-unit finding against its own source and publish it only for that unit's LSP URI; deduplicate overlapping entry-unit findings without collapsing distinct source names. (`9065c47e`; `crates/beskid_lsp/src/diagnostics.rs`, `crates/beskid_analysis/src/services/prepare/diagnostics.rs`)
- [x] 5.3 Tests: dependency-unit E1201 surfaces through shared and isolated prepare authorities, and LSP publishes it only when the dependency is the entry buffer. (`9065c47e`; `crates/beskid_queries/tests/try_diagnostics.rs`, `crates/beskid_lsp/src/diagnostics.rs`)
- [ ] 5.4 Verify the prepare spine and LSP slice against the corelib and runtime suites.

## 6. Scoped cleanup and dead growth in the gate (design slice 7)

- [x] 6.1 Move `scoped_cleanup` and `dead_collection_growth` from the eager whole-assembly `build_typed_program` loop into `legality::check_items`, scoped to items the lowering request judges. (`c8b586d2`; `crates/beskid_queries/src/{semantic_contract/legality/{cleanup.rs,mod.rs},typed_program.rs}`)
- [x] 6.2 Register and report E1230 for scoped-cleanup rejection and E1231 for dead collection growth at the offending source site. (`c8b586d2`; `crates/beskid_analysis/src/analysis/diagnostic_kinds*.rs`, `crates/beskid_queries/src/semantic_contract/legality/cleanup.rs`)
- [x] 6.3 Tests: scoped-cleanup and dead-growth semantic-fact coverage, plus fail-closed codegen diagnostics. (`c8b586d2`; `crates/beskid_queries/tests/semantic_facts/{scoped_cleanup,dead_growth}.rs`, `crates/beskid_codegen/tests/isle_adapter/diagnostics_fail_closed.rs`)
- [ ] 6.4 Verify E1230 and E1231 against the corelib and runtime suites.

## 7. Generic parameter conflicts at the call (design slice 8)

- [x] 7.1 Preserve the specialization authority's conflicting binding sites as `SemanticError::generic_binding_conflict` and expose `generic_parameter_conflict` to the legality gate for concrete generic calls. (`3f7fc9a2`; `crates/beskid_queries/src/{abi/specialization/inference.rs,semantic_contract/legality/generics.rs,semantic_contract/model/{errors.rs,generics.rs}}`)
- [x] 7.2 Report E1229 at the conflicting call, without judging a generic body outside the caller environment. (`3f7fc9a2`; `crates/beskid_queries/src/semantic_contract/legality.rs`, `crates/beskid_codegen/tests/isle_adapter/diagnostics_fail_closed.rs`)
- [x] 7.3 Tests: fail-closed codegen diagnostics reject exactly the misusing item with E1229 and without `MissingRuleOrFact`. (`3f7fc9a2`; `crates/beskid_codegen/tests/isle_adapter/diagnostics_fail_closed.rs`)
- [ ] 7.4 Verify E1229 against the corelib and runtime suites.

## 8. Internal errors and compile-fail corpus (design slice 9)

- [x] 8.1 Allocate E2101 for an unavailable semantic fact and E2102 for a missing ISLE rule or fact after a clean legality gate; render the query or construct name, source site, help text, and source excerpt as an internal error. (`1d6886d2`; `crates/beskid_codegen/src/module_emission/{contracts,orchestration,specialization}.rs`, `crates/beskid_analysis/src/analysis/diagnostic_kinds*.rs`)
- [x] 8.2 Add `unavailable_at` support at specialization sites and inventory every unavailable-query family as either legality-mapped or a known compiler gap. (`1d6886d2`; `crates/beskid_queries/src/semantic_contract/model/errors.rs`, `crates/beskid_queries/tests/unavailable_inventory.rs`)
- [x] 8.3 Tests: E2102 is a source-excerpt internal diagnostic with no user code, legality findings retain source-excerpt diagnostics, and the unavailable inventory rejects unclassified or stale entries. (`1d6886d2`; `crates/beskid_codegen/tests/isle_adapter/diagnostics_fail_closed.rs`, `crates/beskid_queries/tests/unavailable_inventory.rs`)
- [x] 8.4 Add the corelib compile-fail legality corpus harness, with one target per introduced legality code and an assertion that each finding is reported in the dependency unit without an internal error. (`6a6a389f`; `crates/beskid_tests_projects/src/spine/legality_compile_fail.rs`, `crates/beskid_tests_projects/src/spine/mod.rs`)
- [ ] 8.5 Verify E2101/E2102 and the compile-fail corpus against the corelib and runtime suites.
