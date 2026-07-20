## ADDED Requirements

### Requirement: Test item syntax
`test Name { body }` MUST declare a test entry point; the identifier is followed directly by the test body block with no parameter list. `meta { key = expr; }` sections MAY attach metadata parsed as `TestMetaSection`. `skip { key = expr; }` sections MUST mark conditional skip predicates. Test bodies MUST contain only statements and meta/skip sections allowed by `TestBodyItem`.

#### Scenario: Valid test declaration
- **GIVEN** a `test Case { meta { timeout = 30; } /* statements */ }` item
- **WHEN** the item is parsed
- **THEN** the compiler accepts it as a test entry point with metadata

### Requirement: Test discovery and execution semantics
`beskid test` MUST discover all `test` items in Test projects matching this syntax. The test runner MUST invoke each discovered test entrypoint in isolation unless `meta` specifies shared fixtures. Failed assertions MUST report as test failures without undefined behavior. Skipped tests MUST NOT count as failures when skip predicates evaluate true. Tests MAY appear in Test project kinds; placement in App/Lib projects SHOULD warn per manifest policy.

#### Scenario: Skip predicate true
- **GIVEN** a test with a `skip` section whose predicate evaluates true
- **WHEN** the test runner executes the suite
- **THEN** the test is reported as skipped and does not count as a failure

## REMOVED Requirements

### Requirement: Testing conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
