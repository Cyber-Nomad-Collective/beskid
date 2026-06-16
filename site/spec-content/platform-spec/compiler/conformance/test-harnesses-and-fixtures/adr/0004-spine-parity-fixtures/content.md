---
title: Spine parity fixtures
description: Mandatory conformance fixtures lock analyze vs execute diagnostics
  and link-plan completeness.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-COMP-CONF-0007
adrStatus: Accepted
adrDate: 2026-05-29
lastReviewed: 2026-05-29
---

## Context

Regressions in parallel analyze vs execute paths and incomplete codegen linking were not gated by a single conformance suite tied to the unified spine ADRs.

## Decision

The reference compiler **must** maintain:

| Fixture class | Requirement |
| --- | --- |
| Diagnostics parity | For a fixed corpus (≥20 project fixtures), CLI analyze / semantic gate diagnostics **must** equal `prepare_compilation(DiagnosticsOnly)` diagnostics (codes and presence; path labels may differ per D-COMP-BUILD-0012) |
| Link completeness | Project-backed run/test/build fixtures **must** pass `validate_artifact` with no undefined callees |
| Corelib matrix | Every `corelib_tests` target in `beskid_corelib/tests/corelib_tests` **must** pass under `beskid test` using the workspace-built CLI in CI |

New spine regressions **must** add a fixture in `beskid_tests` before closing related ADRs.

## Consequences

`compiler/crates/beskid_tests/src/spine/` hosts parity tests. Engine and codegen integration tests migrate off raw `lower_source` per D-COMP-IR-0011.

## Verification anchors

- `compiler/crates/beskid_tests/src/spine/`
- `compiler/crates/beskid_codegen/tests/array_tests_linking.rs`
- `compiler/corelib/ci/run_corelib_tests.py`
- `compiler/crates/beskid_tests/src/runtime/jit.rs`
