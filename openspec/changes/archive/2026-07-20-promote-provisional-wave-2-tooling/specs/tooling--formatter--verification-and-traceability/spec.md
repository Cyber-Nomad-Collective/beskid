## ADDED Requirements

### Requirement: Formatter automated verification gates
Before any change to the formatter is merged, the following MUST pass: `cargo test -p beskid_analysis format::`, `cargo test -p beskid_cli format`, and `bun run verify:trudoc -- --preset ci` from `site/website`. Future format-specific CLI tests MUST match the `format` filter so they run automatically.

#### Scenario: Analysis format tests required
- **GIVEN** a pull request that modifies `beskid_analysis::format` or `beskid_cli::commands::format`
- **WHEN** merge gates run
- **THEN** `cargo test -p beskid_analysis format::` and `cargo test -p beskid_cli format` are required to pass

### Requirement: Formatter idempotency round-trip
The formatter contract SHALL require `format_program(parse(format_program(parse(s)))) == format_program(parse(s))`. At least one `beskid_analysis` test MUST enforce this equality against a curated representative source corpus. Any change to `format/policy.rs` or `format/emit.rs::EmitCtx` MUST be accompanied by a test run demonstrating the idempotency property still holds after fixtures are regenerated.

#### Scenario: Double format stabilizes
- **GIVEN** a curated representative Beskid source string `s` covering functions, types, attributes, tests, control flow, and generics
- **WHEN** `format_program` is applied after parse twice in succession
- **THEN** the second formatted output equals the first formatted output

### Requirement: Format check CI drift gate
The Beskid CI pipeline MUST include a `beskid format --check` step against the workspace source tree. A drift hit MUST fail the PR.

#### Scenario: Unformatted source fails PR
- **GIVEN** a pull request whose workspace sources diverge from formatter output
- **WHEN** CI runs `beskid format --check`
- **THEN** the check fails and the PR cannot merge on that gate alone

## REMOVED Requirements

### Requirement: Formatter verification and traceability conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
