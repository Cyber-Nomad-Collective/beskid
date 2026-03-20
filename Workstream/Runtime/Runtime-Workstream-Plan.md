# Runtime Workstream Plan (WS1–WS12)

Goal: Deliver a stable, performant, safe Beskid Runtime suitable for v1.0: frozen ABI, predictable memory/GC, complete builtins, reliable FFI, observability, and strong tests/CI.

## Structure (read next)
- WS1: Memory Model and GC Stabilization — Workstream/Runtime/WS1-memory-and-gc.md
- WS2: Strings and Arrays Completeness — Workstream/Runtime/WS2-strings-and-arrays.md
- WS3: Events Semantics and Stability — Workstream/Runtime/WS3-events-semantics.md
- WS4: Scheduler and Time — Workstream/Runtime/WS4-scheduler-and-time.md
- WS5: FFI and Externs Stability — Workstream/Runtime/WS5-ffi-and-externs.md
- WS6: Panic/IO and Diagnostics — Workstream/Runtime/WS6-panic-io-and-diagnostics.md
- WS7: Observability and Metrics — Workstream/Runtime/WS7-observability-and-metrics.md
- WS8: Security Hardening — Workstream/Runtime/WS8-security-hardening.md
- WS9: ABI Stability and Versioning — Workstream/Runtime/WS9-abi-stability-and-versioning.md
- WS10: Docs and Developer Experience — Workstream/Runtime/WS10-docs-and-devex.md
- WS11: Testing Strategy and CI Matrix — Workstream/Runtime/WS11-testing-and-ci.md
- WS12: Performance and Benchmarks — Workstream/Runtime/WS12-performance-and-benchmarks.md

## Execution order (suggested)
1) WS3 and WS1.2 in parallel (events semantics + barrier audit)
2) WS6 + WS7 (panic/diagnostics, metrics) cleanup
3) WS5.1 + WS9 (FFI policy finalize, ABI freeze tooling)
4) WS10 + WS11 (docs/examples, CI matrix + sanitizers)
5) WS12 (benchmarks); WS5.2 (ref u8) if language primitives are ready else defer

## Current snapshot (selected)
- ABI symbols: see compiler/crates/beskid_abi/src/symbols.rs and tests in beskid_tests
- Runtime modules: compiler/crates/beskid_runtime/src/builtins/*, interop/*, gc.rs
- Engine wiring: JIT module symbol imports; extern resolution (Linux feature)

## Workstream-wide Acceptance
- All ABI symbols are imported/linked and exercised by tests
- Strings/arrays/events/scheduler features tested; extern demos gated and passing on Linux
- Metrics feature exposes counters; CI includes sanitizers (Linux)
- Docs published; examples compile; diagnostics unified via miette on CLI

## Risks
- GC compaction deferred to post-v1.0: mitigate via fragmentation metrics
- Cross-platform externs: Linux first, clear stubs elsewhere
- Pointer/ref semantics: temporary pointer-sized ints for FFI; plan ref u8

## References
- Runtime crate: compiler/crates/beskid_runtime
- ABI crate: compiler/crates/beskid_abi
- Engine: compiler/crates/beskid_engine
- Docs: compiler/docs/*
