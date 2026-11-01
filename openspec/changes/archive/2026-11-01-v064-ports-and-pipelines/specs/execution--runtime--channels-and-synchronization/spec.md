## MODIFIED Requirements

### Requirement: Channels are the only cross-fiber data path: Decision [D-EXEC-RT-0016]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Mechanism | **Channels** are the **only** approved cross-fiber data transfer at runtime |
> | Happens-before | Successful **Send** *happens-before* **Receive** that observes the value |
> | Values | Copied or heap handles with GC tracing — **no** stack pointer transfer |
> | Builtins | `channel_*`, `mutex_*`, `wait_group_*` implement queues and coordination |
> | Compiler | **Must not** lower cross-fiber stack sharing |
> 
> Corelib policy: [D-CORE-CONC-0009](/platform-spec/core-library/concurrency/concurrency-package/adr/0009-channel-runtime-semantics/).

A channel SHALL connect fibers of one isolate only; a `Channel<T>` handle SHALL NOT be `Transferable` and SHALL NOT cross an isolate boundary. Between isolates, a port (`__port_*`) SHALL be the only data path at runtime besides `Scope.Spawn` captures and task results. A successful port `Send` SHALL happen-before the `Receive` that observes the value. A port SHALL carry only `Transferable` values: `Shared` by pointer with reference counts, `Copied` by native transit record, `Moved` as specified by the release in force. Neither a channel nor a port SHALL transfer a stack pointer.

**Stable ID:** `BSP-REQ-E94494F1CBCB`  
**Legacy source:** `site/spec-content/platform-spec/execution/runtime/channels-and-synchronization/adr/0016-channel-only-cross-fiber-sharing/content.md`  
**Source SHA-256:** `a2d433753b62492583768f73af0e4f9e1ebee5871047acf98de117bf84d956f2`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: Channel stays inside one isolate
- **GIVEN** `Channel<i64> ch = Channel.Create<i64>();` captured by a `Scope.Spawn` lambda
- **WHEN** the legality gate judges the lambda
- **THEN** the compiler reports **E1236** naming `Channel<i64>`

#### Scenario: Port send happens-before receive
- **GIVEN** a task that writes `1_i64` into a `[Copyable]` record's field and then sends the record through a port
- **WHEN** the parent receives the record
- **THEN** the parent reads `1_i64` from the field
