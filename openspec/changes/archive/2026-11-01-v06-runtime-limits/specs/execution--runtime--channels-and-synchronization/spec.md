## ADDED Requirements

### Requirement: Synchronization tables grow on demand
The runtime SHALL keep channels, hubs, mutexes and wait groups in chunked tables that grow on demand from the system allocator, and SHALL keep every waiter list (channel send and receive waiters, hub waiters, mutex waiters, wait-group waiters) and every hub's registrations in growable storage. The runtime SHALL NOT impose a fixed maximum on the number of channels, hubs, mutexes, wait groups, waiters per primitive, or registrations per hub. A channel, hub, mutex or wait-group record SHALL keep its address once allocated so handles and traced receipt slots stay valid across growth.

Waiters SHALL be woken in registration order (FIFO). The only failure of a create or register operation SHALL be the system allocator refusing more memory; it SHALL be reported through the existing failure value of that operation (`-1` for `channel_create` and `hub_create`, a null id for `mutex_create` and `wait_group_create`, `HubLimit` for `hub_register`).

#### Scenario: One thousand channels
- **GIVEN** a program that creates 1,000 channels in one scheduler
- **WHEN** it sends one value into each and receives it back
- **THEN** every send and receive succeeds

#### Scenario: One thousand mutexes and wait groups
- **GIVEN** a program that creates 1,000 mutexes and 1,000 wait groups
- **WHEN** it locks and unlocks each mutex and adds, completes and waits on each group
- **THEN** every operation succeeds

#### Scenario: One thousand hub registrations
- **GIVEN** one hub with 1,000 registered channels
- **WHEN** a value is sent into the last registered channel and `WaitReceive` runs
- **THEN** registration never reported `HubLimit` and `WaitReceive` delivers index 999
