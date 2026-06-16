---
title: Design model
description: UTC civil time layering over runtime clock builtins.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-09
---

## Layering

| Layer | Responsibility |
| --- | --- |
| `Core.Time.*` types | `Instant`, `Duration`, `Date`, `TimeOfDay`, `DateTime`, `TimeError` under `Core/Time/` |
| `Core.Time` hub | Clock reads, duration helpers, UTC conversions, ISO formatting/parsing |
| Runtime builtins | `__clock_realtime_nanos`, `__clock_monotonic_nanos` in `beskid_runtime` |
| Concurrency package | Fiber scheduling monotonic millis via `Concurrency.NowMillis` |

## Module layout

Types live one-per-file under `compiler/corelib/packages/foundation/src/Core/Time/`. Hub functions remain in `Core/Time.bd`, matching the `Core.Syscall` split pattern.

## Implementation anchors

- `compiler/corelib/packages/foundation/src/Core/Time.bd`
- `compiler/corelib/packages/foundation/src/Core/Time/`
- `compiler/corelib/beskid_corelib/tests/corelib_tests/src/core/TimeTests.bd`
