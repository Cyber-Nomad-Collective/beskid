## ADDED Requirements

### Requirement: Receive error carries unknown codes
The receive error type of the channel library SHALL have the variants `Closed`, `Cancelled(reason)` and `Unexpected(code)`. The mapping from the runtime status code to the error type SHALL return `Unexpected(code)` for a code that is not `Closed` and not `Cancelled`. The mapping SHALL NOT panic and SHALL NOT report `Closed` for an unknown code. `code` SHALL be the numeric status code of the runtime.

#### Scenario: Unknown status code
- **GIVEN** the runtime returns a status code that the library does not know
- **WHEN** the library maps the code to a receive error
- **THEN** the result is `Unexpected(code)` with the same numeric code
