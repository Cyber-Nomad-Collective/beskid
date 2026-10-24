## ADDED Requirements

### Requirement: Inject fields end with a semicolon
An `inject` field declaration SHALL have the form `inject Type name;` and SHALL end with `;`. A comma after an `inject` field SHALL be a parse error, as for every field of a `type` body.

#### Scenario: Inject field
- **GIVEN** `type Aggregator { inject Configuration configuration; inject Storage[] storages; }`
- **WHEN** the type is parsed
- **THEN** both fields are accepted as `inject` fields
