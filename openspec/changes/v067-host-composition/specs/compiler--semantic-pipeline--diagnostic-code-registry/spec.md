## ADDED Requirements

### Requirement: Composition codes E1717 to E1724
The registry SHALL allocate: **E1717** `startup` hook inside a named scope; **E1718** contract registered as itself; **E1719** registered type that the container cannot create (value field, generic, enum); **E1720** registration for a contract that the type does not conform to; **E1721** `with` that does not follow `launch` in the same function body; **E1722** a `launch` whose argument count does not match the host parameters, or that passes arguments to a launched host from another unit; **E1723** parameters on a base host or on a scope of a base host; **E1724** the same implementation registered twice for one key in one host and scope. **E1708** SHALL identify a `with` whose argument count does not match the scope parameters. **E1705** SHALL identify a singular `inject` that matches several registrations, and **E1713** SHALL identify a lifetime mismatch in a host override and SHALL name the contract.

#### Scenario: Codes are stable
- **GIVEN** the registry page
- **WHEN** a tool looks up E1717 to E1723
- **THEN** each code has the meaning listed in this requirement
