# WS4: Scheduler and Time (feature = sched)

Owner: Runtime
Status: Planned

## Scope
- Finalize minimal cooperative scheduling primitives
- Time primitives with well-defined semantics

## Deliverables
- rt_yield and rt_now_millis finalized and documented
- Optional: sleep_millis (deferred if host integration not ready)

## Tasks
1. Primitives
   - Confirm calling conventions and zero-overhead when feature disabled
   - rt_now_millis monotonicity guarantees; document source (e.g., std::time::Instant)
2. Optional sleep
   - Design API; may require host integration (defer if not feasible)
3. Docs and tests
   - sched.md with examples
   - Unit tests: yield makes progress; now_millis monotonicity

## Acceptance Criteria
- Feature-gated; builds clean without feature
- Tests pass under cfg(feature = "sched")

## Risks/Mitigations
- Platform time source differences: stick to monotonic clock; document variance

## References
- compiler/crates/beskid_runtime/src/builtins/sched.rs

