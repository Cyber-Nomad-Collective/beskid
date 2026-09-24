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
