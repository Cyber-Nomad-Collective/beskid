## 1. Gate skeleton and E1201

- [x] 1.1 Add `SemanticFinding` and `SemanticError::unavailable_at` in `beskid_queries::semantic_contract::model`.
- [x] 1.2 Generalize `unresolved_declared_generic_argument` into `unresolved_type_reference` (let, parameter, return, field, lambda parameter, explicit call type argument positions).
- [x] 1.3 Add `beskid_queries::semantic_contract::legality::check_items` and call it from `lower_syntax_program` before and after specialization/witness discovery.
- [x] 1.4 Tests: extended `beskid_queries` `semantic_facts/local_type_resolution.rs` per position; `isle_adapter` full suite green (240/240); negative `heap_growth_native` engine fixture variant (missing `use Concurrency.FiberError;`) asserts E1201 and no `MissingRuleOrFact`.

## 2. Generic call findings (partial)

- [x] 2.1 `call_arity_mismatch` fact (E1204) and unit tests.
- [x] 2.2 Drop the `for root in input.roots()` specialization walk in `module_emission::specialization::resolve_module_items`.
- [ ] 2.3 `generic_binding_conflict` fact (E1229) in `beskid_queries` — deferred (see proposal "Out of scope").

## 3. Verification

- [x] 3.1 `cargo test -p beskid_queries --lib semantic_contract::legality` and `--test semantic_facts local_type_resolution` green.
- [x] 3.2 `cargo test -p beskid_codegen --test isle_adapter` green (240/240, including the six partial-assembly regression tests named in the design).
- [x] 3.3 `cargo test -p beskid_engine --test heap_growth_native missing_fiber_error_import_...` green.
- [ ] 3.4 Full `cargo test -p beskid_queries -p beskid_codegen -p beskid_analysis` regression pass (in progress).
- [x] 3.5 Confirmed the two pre-existing `beskid_queries::incremental` failures (`entry_resolution_with_db_populates_symbol_registry`, `typed_entry_state_uses_fast_resolution_when_stale`) reproduce identically against a clean `git archive HEAD` baseline with no uncommitted diffs from any slice — not a regression from this change.

## 4. OpenSpec

- [x] 4.1 Draft this change (`add-reachability-scoped-semantic-legality-gate`) with deltas to the four capabilities named in the design.
- [ ] 4.2 `openspec validate add-reachability-scoped-semantic-legality-gate --strict --no-interactive` (run from repo root; not yet executed in this pass).
