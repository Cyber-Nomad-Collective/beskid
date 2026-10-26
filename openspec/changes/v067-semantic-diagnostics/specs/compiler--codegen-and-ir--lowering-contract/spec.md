## ADDED Requirements

### Requirement: Generic trap is named panic
The generic runtime trap SHALL be named `panic`. It SHALL be the trap for a Never value, an explicit trap, a failed assertion and a fatal timer. The name `isle_invariant` SHALL NOT be used for it. The runtime manifest SHALL be the source of the trap table, and the generated ABI files and the runtime kits SHALL be regenerated when the table changes.

#### Scenario: Failed assertion trap
- **GIVEN** a program that traps through a failed assertion
- **WHEN** the runtime reports the trap
- **THEN** the trap name is `panic`

### Requirement: Parenthesized constant loop condition
A `while` condition that is the literal `true`, with or without grouping parentheses (`while true` or `while (true)`), SHALL be a statically true condition for lowering. When the loop body has no reachable `break`, the loop exit SHALL be unreachable, and lowering SHALL terminate the exit block with an unreachable trap. A function whose last statement is such a loop SHALL lower without an internal compiler error, also when the function returns a value.

#### Scenario: Formatted infinite loop
- **GIVEN** `i32 Wait(i32 limit) { mut i32 count = 0; while (true) { if (count >= limit) { return count; } count = count + 1; } }`
- **WHEN** the function is lowered
- **THEN** lowering succeeds and the exit block of the loop ends with an unreachable trap
