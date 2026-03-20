# WS2: Strings and Arrays Completeness

Owner: Runtime
Status: Planned

## Scope
- Harden strings (UTF-8 invariant, panic discipline) and finish array semantics
- Provide safe, predictable APIs for len/concat (strings) and bounds-checked get/set (arrays)
- Decide/Document array capacity policy (fixed vs growable); implement or defer

## Deliverables
- strings.md and arrays.md pages with invariants and examples
- str_concat/str_len verified; substring/slicing: implemented or explicitly deferred
- arrays: get/set, optional grow or documented fixed capacity; copy helpers

## Tasks
1. Strings
   - Confirm UTF‑8 contract; clarify panic messages
   - Add stress tests: large inputs, zero-len, non-ASCII
   - Optional: builder/concat-with-capacity for perf-critical cases (doc if deferred)
2. Arrays
   - Clarify element type descriptor and lifetime
   - Implement bounds-checked get/set; return codes or panics (choose and document)
   - Decide on capacity policy; if growable: implement reserve/grow logic and tests
   - Add bulk copy functions (memcpy-like) with safety guards

## Acceptance Criteria
- Tests: strings (concat/len/utf8), arrays (bounds, copy, large sizes)
- No UB in randomized array operations (property tests)
- Docs reflect final behavior and panic strings

## Risks/Mitigations
- Performance tradeoffs for growable arrays: start simple; measure; iterate post-v1.0

## References
- compiler/crates/beskid_runtime/src/builtins/strings.rs
- compiler/crates/beskid_runtime/src/builtins/arrays.rs

