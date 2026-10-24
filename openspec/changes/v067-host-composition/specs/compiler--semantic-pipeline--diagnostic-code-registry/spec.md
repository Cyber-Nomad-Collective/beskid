## ADDED Requirements

### Requirement: Composition codes E1717 to E1721
The registry SHALL allocate: **E1717** `startup` hook inside a named scope; **E1718** contract registered as itself; **E1719** registered type that the container cannot create (value field, generic, enum); **E1720** registration for a contract that the type does not conform to; **E1721** `with` that does not follow `launch` in the same function body. **E1705** SHALL identify a singular `inject` that matches several registrations, and **E1713** SHALL identify a lifetime mismatch in a host override and SHALL name the contract.

#### Scenario: Codes are stable
- **GIVEN** the registry page
- **WHEN** a tool looks up E1717 to E1721
- **THEN** each code has the meaning listed in this requirement
