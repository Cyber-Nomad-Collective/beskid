---
title: Contracts and edge cases
description: MUST/SHOULD rules for optional runtime features and toolchain alignment.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-22
---

## Normative requirements

| ID | Requirement |
| --- | --- |
| **RFF-001** | Optional runtime features **must not** change `BESKID_RUNTIME_ABI_VERSION` unless they alter existing symbol signatures or layouts. |
| **RFF-002** | Default CI/release runtime builds **must** document which features are enabled in build notes or manifests. |
| **RFF-003** | Tests that require `arrays_backing` **must** enable the feature on `beskid_runtime` dependency. |
| **RFF-004** | `metrics` exports **must** be absent from baseline `RUNTIME_EXPORT_SYMBOLS` when built without `metrics`. |
| **RFF-005** | Compiler lowering **must not** assume element backing exists unless workspace policy enables `arrays_backing`. |
| **RFF-006** | `extern_dlopen` **must** remain off by default on `beskid_engine` for production toolchains. |
| **RFF-007** | Phase B GC **must** be opt-in for v0.3; the runtime **must** boot in Phase A unless `BESKID_RUNTIME_PHASE_B=1` or `set_runtime_phase(RuntimePhase::PhaseB)` flips it. |
| **RFF-008** | Optional preemption **must** stay disabled by default; enabling it via `BESKID_RUNTIME_PREEMPT=1` or `set_preemption_enabled(true)` **must not** change observable semantics of fiber-only programs beyond inserting yield points. |

## Feature behavior table

| Feature | Without | With |
| --- | --- | --- |
| `arrays_backing` | `array_new.ptr == null` | Backing store allocated |
| `metrics` | No `rt_metrics_*` | Counters exposed |
| `sched` | Default scheduler only | Experimental sched hooks |
| Phase B GC (`BESKID_RUNTIME_PHASE_B`) | Single-mutator Phase A; channel pointer payloads still routed through external roots but barriers no-op outside marking | Multiple mutators may attach via `attach_phase_b_mutator`; `gc_write_barrier` active on pointer-payload channel ops |
| Preemption (`BESKID_RUNTIME_PREEMPT`) | `runtime_preempt_check` is a no-op | `runtime_preempt_check` yields the current fiber (or OS thread if off-scheduler) |

## Edge cases

| Case | Outcome |
| --- | --- |
| Test expects backing, runtime default | Tests fail allocation or pointer reads — fix features, not ABI |
| User enables `metrics` locally | JIT must link extra symbols only if codegen calls them |
| VSIX runtime vs CLI runtime feature mismatch | Subtle array/GC test failures — align Open VSX build matrix |

## Implementation anchors
- `compiler/crates/beskid_runtime/Cargo.toml` — feature flags and build-time gating
- `compiler/crates/beskid_abi/src/version.rs` — ABI version independence from features
- `compiler/crates/beskid_runtime/src/builtins/arrays.rs` — `arrays_backing` conditional compilation

## Related topics

- [ABI versioning](/platform-spec/execution/abi-and-host/abi-versioning-and-compatibility/)
- Legacy mention: [Runtime ABI v0.1 arrays_backing](../../../../execution/runtime/runtime-abi-v0-1.md)
