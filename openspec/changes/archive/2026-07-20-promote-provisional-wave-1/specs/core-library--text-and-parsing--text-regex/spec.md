## ADDED Requirements

### Requirement: Bounded regex.pest pattern language
`Core.Text.Regex` pattern syntax MUST be defined by `regex.pest`. The implementation SHALL wrap generated combinator parsers from that grammar and MUST NOT use a hand-written NFA engine. Subject input length MUST be capped at 1 MiB code units.

#### Scenario: Pattern accepted by regex.pest
- **GIVEN** a pattern expressible in the `regex.pest` bounded language
- **WHEN** a caller compiles or applies that pattern through `Core.Text.Regex`
- **THEN** the engine uses the generated `regex.pest` parsers and rejects subjects longer than 1 MiB code units

### Requirement: Match, Find, and FindAll results
`Match` MUST return `Option<MatchSpan>` with byte offsets for a prefix match at position 0. `Find` MUST return the leftmost first match anywhere in the subject. `FindAll` MUST return non-overlapping matches in left-to-right order.

#### Scenario: Leftmost Find span
- **GIVEN** subject `"x99y"` and pattern `"[0-9]+"`
- **WHEN** a caller invokes `Find`
- **THEN** the result is a present `MatchSpan` for the leftmost digits (byte offsets 1..3)

### Requirement: Invalid pattern non-panic failure
Invalid patterns MUST yield `None` or empty results without panic.

#### Scenario: Invalid pattern returns empty
- **GIVEN** a pattern that is not valid under `regex.pest`
- **WHEN** a caller invokes `Match`, `Find`, or `FindAll`
- **THEN** the call returns `None` or an empty match set and does not panic

## REMOVED Requirements

### Requirement: Core.Text.Regex conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
