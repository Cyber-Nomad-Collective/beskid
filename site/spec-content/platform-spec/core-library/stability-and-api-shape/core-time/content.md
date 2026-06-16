---
title: Core.Time
description: UTC civil time types and clock helpers backed by runtime clock builtins.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-09
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Core.Time` exposes **realtime** and **monotonic** instants plus **UTC civil** date/time types for corelib `@tier(supported)` callers. Realtime reads use `__clock_realtime_nanos`; monotonic reads use `__clock_monotonic_nanos`. Cooperative scheduling clocks remain in **`Concurrency.NowMillis`**.
</SpecSection>

<SpecSection title="Scope" id="scope">
- **In scope:** `Instant`, `Duration`, UTC civil types (`Date`, `TimeOfDay`, `DateTime`), clock reads, duration math, ISO-8601 UTC formatting/parsing, and `TimeError` for invalid civil input.
- **Out of scope:** Local timezone offsets, sub-second ISO output in v1, and fiber scheduling monotonic millis (`Concurrency.NowMillis`).
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/foundation/src/Core/Time.bd`
- `compiler/corelib/packages/foundation/src/Core/Time/`
- `compiler/crates/beskid_runtime/src/builtins/clock.rs`
- Corelib tests: `compiler/corelib/beskid_corelib/tests/corelib_tests/src/core/TimeTests.bd`
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
| Surface | Rule |
| --- | --- |
| Clock domains | Realtime and monotonic instants **must not** be mixed in subtraction or civil conversion. |
| UTC scope | v1 civil helpers operate in **UTC** only; local offsets are out of scope. |
| Formatting | `FormatIso8601Utc` **must** emit second-precision `YYYY-MM-DDTHH:MM:SSZ`. |
| Parsing | `ParseIso8601Date` **must** accept strict `YYYY-MM-DD` and reject other shapes. |
</SpecSection>

## Decisions

No open decisions. Closed choices are normative ADRs under **`adr/`** when present; see child articles for TM-* requirement detail.
