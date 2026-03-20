# WS1: Memory Model and GC Stabilization

Owner: Runtime
Status: Planned

## Scope
- Define/document the runtime memory model (single-threaded vs per-thread roots)
- Enforce enter/leave-runtime boundaries; clarify reentrancy policy
- Harden GC invariants and write barriers; add assertions
- Instrument fragmentation; defer compaction to post-v1.0 but plan it

## Deliverables
- memory-model.md (in docs) with invariants and examples
- Reentrancy checks and clear panic messages when violated
- Barrier audit across strings/arrays/events; debug assertions enabled in tests
- Fragmentation/heap metrics available via metrics feature

## Tasks
1. Runtime state and threading
   - Document TLS-based RuntimeRoot/Mutation usage and lifecycle
   - Guard public entrypoints: assert root presence; provide helper to set/unset
   - Add reentrancy detector (depth counter) and error path
2. Barriers/invariants
   - Audit write-barrier call sites in arrays/events/strings
   - Add debug-only assertions for root reachability and barrier ordering
3. Fragmentation metrics (non-compacting v1.0)
   - Track: total heap, live bytes, estimated fragmentation
   - Expose via metrics snapshot API
4. Compaction plan (post-v1.0 design doc)
   - Nursery + mark-sweep + optional copying young gen
   - Indirection strategy for object handles

## Acceptance Criteria
- Doc page published; examples compile (doctests)
- Unit tests for: nested callbacks (reentrancy), barrier assertions, metrics snapshot
- No UB under randomized mutation sequences in arrays/events (property tests)

## Risks/Mitigations
- Hidden reentrancy in host callbacks: assert early with clear message
- Barrier coverage gaps: CI job to run with debug-assertions + sanitizer build

## References
- compiler/crates/beskid_runtime/src/gc.rs
- compiler/crates/beskid_runtime/src/builtins/*

