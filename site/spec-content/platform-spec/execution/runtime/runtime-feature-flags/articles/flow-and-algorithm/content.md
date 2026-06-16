---
title: Flow and algorithm
description: Selecting runtime features at build time and validating behavior at run time.
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

## Purpose

How optional features propagate from Cargo to runtime behavior. Build alignment diagram: [design model](./design-model/).

## Build-time selection

1. CI or local `cargo build -p beskid_runtime --features …` enables cfg gates in `builtins/arrays.rs`, `metrics` module, etc.
2. `beskid_engine` / CLI link the same feature-enabled runtime artifact (workspace dependency features must match).
3. `BESKID_RUNTIME_ABI_VERSION` stays constant unless symbol/signatures change (**ABI-005**).

## `arrays_backing` runtime path

1. Lowering always emits `array_new(elem_size, len)`.
2. Without feature: runtime writes `BeskidArray { ptr: null, len, cap: len }`.
3. With feature: runtime allocates `elem_size * len` bytes via `alloc` for `ptr`.
4. `array_len` returns logical `len` in both modes.

## `metrics` export path

1. When enabled, `builtins/metrics.rs` registers additional `rt_metrics_*` symbols.
2. JIT **must** only declare imports if codegen emits calls—baseline programs ignore them.
3. Hosts read counters for profiling dashboards; not part of user Beskid language.

## Engine `extern_dlopen` (related)

1. Separate from runtime crate: enable on `beskid_engine` for dynamic extern tests.
2. Does not alter `beskid_runtime_abi_version`.
3. Failure modes documented under [Extern dispatch](/platform-spec/execution/abi-and-host/extern-dispatch-and-policy/).

## Release verification flow

1. Read release manifest / CI matrix for enabled features.
2. Run conformance tests compiled with the same feature set.
3. Compare `array_new` behavior in integration tests (backing vs header-only).

## Implementation anchors
- `compiler/crates/beskid_runtime/src/builtins/arrays.rs` — `arrays_backing` enabled array construction
- `compiler/crates/beskid_engine/src/` — `extern_dlopen` dynamic extern resolution
- `compiler/crates/beskid_tests/src/runtime/` — feature-gated integration test fixtures

## Related topics

- [Contracts and edge cases](./contracts-and-edge-cases/)
- `compiler/crates/beskid_runtime/Cargo.toml`
