# WS7: Observability and Metrics (feature = metrics)

Owner: Runtime
Status: Planned

## Scope
- Add and stabilize runtime counters and snapshot API
- Document metrics meanings, units, and caveats

## Deliverables
- metrics.md with counter taxonomy and examples
- Snapshot API returning a struct with relevant counters

## Tasks
1. Counters
   - Allocations (count, bytes)
   - Strings: concat calls/bytes
   - Events: subscribe/unsubscribe/dispatch counts
   - Optional GC: cycles, pause time (if feasible)
2. Snapshot API
   - Thread-safe snapshot under current root
   - Zero cost when feature disabled
3. Tests
   - Unit tests for monotonicity and expected increments
   - Snapshot serialization/deserialization (if exposed)

## Acceptance Criteria
- Feature-gated; builds clean without feature
- Tests cover typical flows and overflows (saturating arithmetic)

## Risks/Mitigations
- Counter contention: single-threaded runtime avoids this for now; document

## References
- compiler/crates/beskid_runtime/src/builtins/metrics.rs

