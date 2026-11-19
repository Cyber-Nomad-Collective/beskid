## ADDED Requirements

### Requirement: Unexpected status codes
The mapping from a runtime status code to a library error SHALL return `Unexpected(code)` for a code that is not part of the contract of the operation. The mapping SHALL NOT panic. The mapping SHALL NOT report `Closed(0)` or `Cancelled(0)` for an unknown code. `code` SHALL be the raw numeric status code of the runtime.

#### Scenario: Unknown status code
- **GIVEN** the runtime returns a status code that the operation does not define
- **WHEN** the library maps the code to an error
- **THEN** the result is `Unexpected(code)` with the same numeric code
