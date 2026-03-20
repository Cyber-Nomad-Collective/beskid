# WS11: Testing Strategy and CI Matrix

Owner: Runtime + CI
Status: Planned

## Scope
- Comprehensive tests: unit, integration, property tests
- CI matrix across platforms/features; sanitizer job

## Deliverables
- Test plan with coverage map per runtime module
- CI jobs: Linux full, macOS/Windows subsets, sanitizers

## Tasks
1. Tests
   - Unit: every builtin (alloc/strings/arrays/events/sched)
   - Integration: Engine end-to-end (entrypoints), extern demos
   - Property: randomized mutation tests for arrays/events
   - Negative: diagnostic and panic message snapshots
2. CI setup
   - Linux: full suite; features on/off
   - macOS/Windows: compile + unit subsets; skip extern_dlopen
   - Sanitizers: Linux-only; scoped to runtime unit tests
3. Flake management
   - Timeouts, reruns for known flakes; document skips with reasons

## Acceptance Criteria
- CI green with clear gating and skips
- New PRs must not reduce runtime test coverage

## Risks/Mitigations
- Cross-platform instability: limit to compile/unit subsets off Linux

## References
- .github/workflows/* (or CI system used)
- compiler/crates/beskid_runtime/tests (if added)

