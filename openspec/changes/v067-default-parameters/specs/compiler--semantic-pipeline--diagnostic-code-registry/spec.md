## ADDED Requirements

### Requirement: Default parameter codes E1251 to E1256
The registry SHALL allocate: **E1251** a required parameter after an optional parameter; **E1252** a default value that is not a compile-time constant; **E1253** a default value that does not fit the parameter type; **E1254** a default value or caller-information attribute on a hook parameter or a `bulk` parameter; **E1255** a caller-information parameter without a default value; **E1256** a caller-information parameter of the wrong type. **E1612** an implementation default value that differs from the contract. **E1204** SHALL identify an argument count outside the range of the callee and SHALL state the range.

#### Scenario: Codes are stable
- **GIVEN** the registry page
- **WHEN** a tool looks up E1251 to E1256
- **THEN** each code has the meaning listed in this requirement
