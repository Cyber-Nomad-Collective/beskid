# WS3: Events Semantics and Stability

Owner: Runtime
Status: Planned

## Scope
- Finalize subscribe/iteration/unsubscribe semantics
- Fix test failures tied to GC root requirement ("no active gc-arena root")
- Define capacity policy and overflow handling

## Deliverables
- events.md doc with: ordering, duplicates policy, unsubscribe-first semantics
- Stable, well-tested event_* builtins with clear return values or panics
- Helper to ensure a RuntimeRoot is active in public entrypoints/tests

## Tasks
1. Semantics
   - Decide: allow duplicates? (default: allowed; documented)
   - Unsubscribe-first: return 1 on success, 0 if not found (or panic; choose and doc)
   - Iteration: snapshot vs live; document mutation rules during iteration
2. Capacity/Overflow
   - Choose: fixed or growable; implement or document
   - Overflow: return code or panic with message; add tests
3. Root requirements
   - Provide helper that ensures a root for event paths (used by Engine/test harness)
   - Remove surprises in common flows; keep explicit root APIs available
4. Testing
   - Unit: subscribe/iterate/unsubscribe/overflow/duplicates
   - Integration: engine-based round-trips under with_arena

## Acceptance Criteria
- All runtime::events* tests pass; no unexpected root panics
- Doc covers edge cases and iteration under mutation rules

## Risks/Mitigations
- Mutation during iteration complexity: pick a clear policy (snapshot) for v1.0

## References
- compiler/crates/beskid_runtime/src/builtins/events.rs
- compiler/crates/beskid_engine/src/engine.rs (with_arena helpers)

