---
title: Examples
description: Building runtime with features, array backing expectations, and
  engine extern_dlopen.
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

## Enable array backing for tests

```bash
cargo test -p beskid_tests --features beskid_runtime/arrays_backing
```

(Exact feature propagation follows workspace `Cargo.toml` dependency declarations—maintainers mirror the pattern used in compiler CI.)

## Header-only array scenario (default)

A lowered test creates `array_new(8, 100)` without `arrays_backing`. Inspection shows non-zero `len` but `ptr == null`. Tests that dereference elements **must** enable backing or avoid element access.

## Metrics-enabled profiling build

Maintainers build:

```bash
cargo build -p beskid_runtime --features metrics
```

Generated code that does not call `rt_metrics_*` still links because baseline JIT does not import optional symbols.

## Engine dynamic extern (related)

```bash
cargo test -p beskid_engine extern_real_call_getpid --features extern_dlopen
```

This does not change runtime features; it documents cross-crate flag vocabulary for execution maintainers.

## Release matrix documentation (prose)

Open VSX jobs should record in CI logs whether `arrays_backing` is enabled for the bundled runtime. Operators comparing local `cargo build` vs extension behavior should check that matrix before reporting array bugs.

## Related topics

- [Verification and traceability](./verification-and-traceability/)
- [Memory and GC](/platform-spec/execution/runtime/memory-and-gc-runtime-contract/)
