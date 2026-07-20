## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Core.Time conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
