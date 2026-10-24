## ADDED Requirements

### Requirement: Generic trap is named panic
The generic runtime trap SHALL be named `panic`. It SHALL be the trap for a Never value, an explicit trap, a failed assertion and a fatal timer. The name `isle_invariant` SHALL NOT be used for it. The runtime manifest SHALL be the source of the trap table, and the generated ABI files and the runtime kits SHALL be regenerated when the table changes.

#### Scenario: Failed assertion trap
- **GIVEN** a program that traps through a failed assertion
- **WHEN** the runtime reports the trap
- **THEN** the trap name is `panic`
