<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Time Specification

## Purpose

UTC civil time types and clock helpers backed by runtime clock builtins.

## Requirements

### Requirement: Clock domain separation
`NowUtc` MUST read `__clock_realtime_nanos`. `MonotonicNow` MUST read `__clock_monotonic_nanos`. Realtime and monotonic instants MUST NOT be mixed in subtraction or civil conversion. `ToUtcDateTime` MUST only accept realtime-domain instants. Local timezone offsets MUST NOT appear in v1 corelib APIs; civil helpers operate in UTC only.

#### Scenario: Monotonic instant rejected for civil conversion
- **GIVEN** an instant obtained from `MonotonicNow`
- **WHEN** a caller attempts `ToUtcDateTime` on that instant
- **THEN** the call is rejected because the instant is not realtime-domain

### Requirement: Duration nanosecond storage
`Duration` storage MUST use nanoseconds internally in v1.

#### Scenario: Duration holds nanoseconds
- **GIVEN** a `Duration` constructed from a known nanosecond quantity
- **WHEN** an implementation inspects duration representation
- **THEN** the value is stored as nanoseconds

### Requirement: ISO-8601 UTC format and date parse
`FormatIso8601Utc` MUST emit second-precision `YYYY-MM-DDTHH:MM:SSZ`. `ParseIso8601Date` MUST accept strict `YYYY-MM-DD` (exactly ten characters with `-` separators at indices 4 and 7) and reject other shapes.

#### Scenario: Strict date parse rejects non-ISO shape
- **GIVEN** an input string that is not exactly `YYYY-MM-DD`
- **WHEN** a caller invokes `ParseIso8601Date`
- **THEN** the parse fails rather than accepting a non-strict shape

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Core.Time

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/stability-and-api-shape/core-time/`  
**Source:** `site/spec-content/platform-spec/core-library/stability-and-api-shape/core-time/content.md`  
**SHA-256:** `8ce20585cb2ae56e93fc7d06df44a4b9356fc1a06f136919e4bca6495096e82e`

<details>
<summary>Migrated source text</summary>

``````markdown
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
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/stability-and-api-shape/core-time/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/core-library/stability-and-api-shape/core-time/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `d8586340cf0adc294502fefb09a395bab0a031bb41d4afdb425af5fae3e86803`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative requirements

| ID | Requirement |
| --- | --- |
| **TM-001** | `NowUtc` **must** read `__clock_realtime_nanos`. |
| **TM-002** | `MonotonicNow` **must** read `__clock_monotonic_nanos`. |
| **TM-003** | `ToUtcDateTime` **must** only accept realtime-domain instants. |
| **TM-004** | `ParseIso8601Date` **must** require exactly ten characters and `-` separators at indices 4 and 7. |
| **TM-005** | `Duration` storage **must** use nanoseconds internally in v1. |
| **TM-006** | Local timezone offsets **must not** appear in v1 corelib APIs. |

## Edge cases

- Pre-1970 UTC instants are supported by conversion helpers but are not required for host smoke tests.
- Sub-second ISO output is omitted in v1; nanoseconds remain available on `TimeOfDay.nanosecond`.
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/stability-and-api-shape/core-time/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/core-library/stability-and-api-shape/core-time/articles/design-model/content.md`  
**SHA-256:** `8628468100c7c1ee823f3f232833bd2e694e5254f1e596cd8d743454cab0a38a`

<details>
<summary>Migrated source text</summary>

``````markdown
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
``````

</details>
