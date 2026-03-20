# WS12: Performance and Benchmarks

Owner: Runtime
Status: Planned

## Scope
- Establish performance envelopes for key runtime operations
- Create repeatable microbenchmarks

## Deliverables
- benches/ suite for strings, arrays, events
- Baseline results checked in; guidance on interpreting

## Tasks
1. Benchmarks
   - String concat throughput (varying sizes); allocation profiles
   - Arrays: set/get/copy throughput; optional grow path
   - Events: dispatch latency vs listener count
2. Harness
   - Criterion-based benches (or similar)
   - Scripts to run locally and in CI (opt-in)
3. Analysis
   - Document baseline targets and acceptable regressions
   - Add perf gate in CI (non-blocking initially, report only)

## Acceptance Criteria
- Benches compile and run locally; documented instructions
- Baseline results committed and referenced in docs

## Risks/Mitigations
- Noisy CI perf: keep non-blocking; rely on local + periodic controlled runs

## References
- benches/* (new)
- compiler/docs/perf/* (new)

