## ADDED Requirements

### Requirement: Blocking operations in Main park
`Main` runs as the root fiber. A blocking operation in `Main` (`Channel.Send`, `Channel.Receive`, `WaitGroup.Wait`, `Mutex.Lock`, `Hub.WaitReceive`, `Fiber.Join`) SHALL park the fiber. While `Main` is parked, the runtime SHALL run other fibers and pending I/O until the operation can complete. The same SHALL hold for `Time.Sleep`, socket and DNS operations, `Core.Input` and `Core.Output` I/O, and child-process waits (`Process.Run`, `ChildProcess.Wait`, child streams) in `Main`. `Channel.Receive` SHALL return `Closed` only after `Close` and after all committed values were delivered. When `Main` waits, no fiber can run and no external work is pending, the runtime SHALL trap with a deadlock report. It SHALL NOT return an error that looks like a close.

#### Scenario: Value arrives later
- **GIVEN** `Main` calls `Receive` on an empty open channel and a spawned fiber sends a value after a delay
- **WHEN** the value is sent
- **THEN** `Receive` returns `Ok(value)`

#### Scenario: Deadlock
- **GIVEN** `Main` calls `Receive` on an empty open channel and no other fiber can send
- **WHEN** no fiber can run and no external work is pending
- **THEN** the runtime traps with a deadlock report

### Requirement: Process ends when Main returns
When `Main` returns, the runtime SHALL join the spawned fibers that were not detached. After that, the process SHALL end. Process shutdown SHALL NOT wait for a detached fiber, also when that fiber is parked in I/O, for example in a read of standard input. A panic of a detached fiber SHALL still abort the process.

#### Scenario: Detached reader
- **GIVEN** `Main` spawns a detached fiber that waits on standard input and then returns
- **WHEN** `Main` returns
- **THEN** the process ends without waiting for input

### Requirement: Closed error sets with Unexpected
`ChannelError` SHALL have exactly the variants `Closed(i64 endpoint)`, `Cancelled(i64 reason)` and `Unexpected(i64 code)`. `Closed` SHALL carry the handle of the channel that is closed. `HubError` SHALL have the variants `Limit(i64 cap, i64 attemptedIndex)`, `Cancelled(i64 reason)`, `Closed(i64 memberIndex)` and `Unexpected(i64 code)`. A failed `Register` SHALL name the member index it was given. A `WaitReceive` on an empty or unknown hub SHALL report `Closed(-1)`. A `WaitReceive` where every member of the hub is closed SHALL report `Closed(member)` with the index of a closed member. `MutexError` SHALL have the variants `Cancelled(i64 reason)` and `Unexpected(i64 code)`. In all three types a runtime status outside the contract of the operation SHALL map to `Unexpected` with the raw status code. It SHALL NOT map to `Closed` or to `Cancelled`. `Concurrency.Status.FromCode` SHALL map a code outside 0..6 to `Status::Unexpected(code)`.

#### Scenario: Unknown status code
- **GIVEN** the runtime returns a status code that the operation does not define
- **WHEN** the library maps the code
- **THEN** the result is `Unexpected(code)` with the same numeric code

#### Scenario: Wait on an unknown hub
- **GIVEN** a hub with no registered member
- **WHEN** `WaitReceive` runs
- **THEN** the result is `Closed(-1)`
