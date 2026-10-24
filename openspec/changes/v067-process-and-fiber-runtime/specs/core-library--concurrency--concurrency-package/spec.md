## ADDED Requirements

### Requirement: Receive in Main parks
`Channel.Receive` called on fiber 0 (`Main`) SHALL park the fiber until a value arrives, the channel closes, or the fiber is cancelled. It SHALL NOT return `Closed` because no value is ready. `Receive` SHALL return `Closed` only after `Close` and after all committed values were delivered.

#### Scenario: Value arrives later
- **GIVEN** `Main` calls `Receive` on an empty open channel and a spawned fiber sends a value after a delay
- **WHEN** the value is sent
- **THEN** `Receive` returns `Ok(value)`

#### Scenario: Open channel stays open
- **GIVEN** `Main` calls `Receive` on an empty open channel and no fiber sends
- **WHEN** time passes
- **THEN** `Main` stays parked and `Receive` does not return `Closed`

### Requirement: Process ends when Main returns
When `Main` returns, the runtime SHALL join the spawned fibers that were not detached. After that, the process SHALL end. A detached fiber that is parked in I/O, such as a read of standard input, SHALL NOT delay the end of the process. The runtime SHALL cancel the wait of such a fiber and SHALL NOT join it. A panic of a detached fiber that happens before the process ends SHALL still abort the process (D-CORE-CONC-0004).

#### Scenario: Detached reader
- **GIVEN** `Main` spawns a detached fiber that waits on standard input and then returns
- **WHEN** `Main` returns
- **THEN** the process ends without waiting for input
