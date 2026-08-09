## MODIFIED Requirements

### Requirement: Spine parity fixtures: Decision [D-COMP-CONF-0007]
The reference compiler MUST maintain diagnostics parity for a fixed corpus of
at least 20 project fixtures, project-backed link-completeness fixtures that
pass `validate_artifact`, and the complete `corelib_tests` matrix. The Corelib
matrix denominator SHALL be derived from the current project manifest and MUST
equal 61 for the 0.4 release candidate. Every target MUST pass under
`beskid test --all-targets` using the workspace-built CLI, one resolved and
materialized workspace, and one generation-bound Salsa/engine session.

Before implementing collection storage, managed aggregate publication,
`Result<Unit,E>`, filesystem adapters, or harness repairs, the reference
compiler MUST add a focused regression that fails for the intended missing
behavior. The corresponding green claim MUST use the production
`TypedProgram` -> `CodegenInput` -> ISLE -> verified CLIF path and MUST retain
the original RED evidence in test history.

The matrix harness MUST emit target start, end, phase, result, and duration;
enforce a 120-second per-target timeout and 30-minute whole-matrix timeout; and
terminate remaining matrix work cleanly with the active target named when a
budget expires. Release evidence MUST be produced after the candidate changes
and MUST reject filters, smoke mode, missing-target skips, ignored tests,
retry-masked failures, stale reports, timeouts, hangs, or a denominator other
than 61.

The 0.4 runtime-kit gate MUST build and install debug and release ABI-v5 kits
natively on `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, and
`x86_64-pc-windows-msvc`. Every target/profile kit MUST contain validated
static and shared artifacts and pass installed-empty-prefix JIT and AOT smokes,
manifest hash/layout/allowlist checks, target-import audits, and forbidden
Rust/host/bridge/fallback provenance scans.

#### Scenario: Focused RED precedes a production repair
- **GIVEN** a missing collection, aggregate, Result, filesystem, or harness
  behavior in scope for this change
- **WHEN** implementation work begins
- **THEN** a focused regression first fails for that behavior rather than a
  setup error, and later passes through the production pipeline

#### Scenario: Full Corelib matrix is freshly green
- **GIVEN** the 0.4 release candidate and its current 61-target Corelib
  manifest
- **WHEN** the unfiltered single-process matrix runs
- **THEN** it records 61/61 passing within both budgets with no hang, timeout,
  skip, ignored test, retry, denominator drift, or stale evidence

#### Scenario: Hanging target fails with attribution
- **GIVEN** a Corelib target that does not complete within 120 seconds
- **WHEN** the matrix target budget expires
- **THEN** the run fails, names the target and active phase, preserves its
  diagnostics, cancels remaining work cleanly, and does not count the target as
  passed

#### Scenario: Three-target native kit matrix is complete
- **GIVEN** native release runners for Linux x86-64, macOS arm64, and Windows
  x86-64
- **WHEN** debug and release ABI-v5 kits are built and installed
- **THEN** each of the six target/profile kits contains validated static and
  shared artifacts and passes JIT, AOT, allowlist, target-import, hash/layout,
  and forbidden-provenance gates without a source-tree or Rust fallback
