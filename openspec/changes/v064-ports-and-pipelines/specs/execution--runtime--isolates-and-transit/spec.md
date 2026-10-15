## ADDED Requirements

### Requirement: Port ring and owner-mailbox wake-up
A port SHALL be a process-wide object identified by an `i64` id, consisting of a native bounded ring of transit slots (`SystemAllocate`, never a managed object of any heap) guarded by the 0.6.1 atomic intrinsics (`AtomicWordCompareExchange`, `AtomicWordLoad`, `AtomicWordStore`), a capacity fixed at creation (default 64, minimum 1), a closed flag, and the owner id of every scheduler with a fiber parked on it. A send SHALL claim a slot with an atomic compare-exchange, write the slot, publish it with a release store, and post a wake-up command to the owner mailbox of each receiver parked on the port (`owner_post`, `crates/beskid_abi/assembly/common/external_wait.h:76-135`). A receive SHALL consume the oldest published slot with an acquire load, SHALL post a wake-up to each sender parked on the port, and SHALL preserve FIFO order per port. Slot contents SHALL be one `BeskidAbiValue` plus a transfer-class tag: a `Shared` value's slot holds the owner's object pointer; a `Copied` value's slot holds a native transit record produced by the sender through `Transit.bd` (same descriptor walk and refusal rules as the direct copy, writing into native memory instead of a destination heap) and consumed by the receiver's copy-in; a `Moved` value's slot holds a 24-byte native record (size, value pointer, receiver box descriptor) and the graph is handed over by pointer under the hand-over rules of the change `v065-parallel-sequences`; the 0.6.x runtime ships the `Shared` and `Moved` pointer paths together (no copy of a `Moved` value through a transit record). The port ring SHALL NOT be merged into the owner mailbox.

#### Scenario: FIFO across isolates
- **GIVEN** a port of capacity 64, one sender task sending `0_i64 .. 999_i64` in order and the parent receiving 1000 values
- **WHEN** the scope runs
- **THEN** the parent receives the values in sending order and the sender's fiber parked at most while the ring held 64 unreceived values

#### Scenario: Copied value crosses through a native record
- **GIVEN** `[Copyable] pub type Job { string id, i64 size }` and a task that sends `Job { id: "a", size: 3 }` through `Port<Job>`
- **WHEN** the parent receives it
- **THEN** the received `Job` is an object in the parent heap, the sender's `Job` is unchanged in the task heap, and no heap of either isolate was written by the other's thread

### Requirement: Fiber-cooperative port receive and send
`__port_receive` SHALL be a fiber-cooperative wait: when the ring is empty and the port is open, the runtime SHALL register an external wait for the calling fiber (`ExternalWaitRegister`, `Runtime/Fiber/Scheduler/External.bd:143-177`) with the port id as operation, SHALL park the fiber through `ExternalWaitPark`, and SHALL let other fibers of the same isolate run. A send from another isolate SHALL complete the wait by posting `EXTERNAL_READY` to the receiver's owner mailbox, consumed by `ExternalPump`. `__port_send` on a full ring SHALL park the sending fiber the same way until a slot is free or the port is closed (back-pressure). Cancellation of the fiber or its isolate SHALL complete a parked port wait with `EXTERNAL_CANCELLED`, and the operation SHALL return the cancelled status. An isolate SHALL be able to serve any number of ports with fibers; a parked port wait SHALL never block the isolate's thread.

#### Scenario: Receive parks the fiber only
- **GIVEN** a task with two fibers, one parked in `inbox.Receive()` on an empty port and one counting `Concurrency.Yield()` iterations
- **WHEN** 10 ms pass before the parent sends
- **THEN** the counting fiber advanced and the receive returns the sent value afterwards

#### Scenario: Cancelled isolate leaves a port wait
- **GIVEN** a task parked in `inbox.Receive()` with no sender
- **WHEN** the scope cancels the task
- **THEN** `Receive` returns `Result::Error(PortError::Cancelled)` and the task exits with outcome `cancelled`

### Requirement: Port close and drain
`__port_close` SHALL set the closed flag with a release store, SHALL wake every parked sender and receiver, and SHALL be idempotent. After close, a send SHALL return the closed status without writing a slot; a receive SHALL keep returning published slots until the ring is empty and SHALL then return the closed status. Every port SHALL be owned by the scope that created it; the scope SHALL close every port it owns when it returns, before it joins its tasks and isolates, so that a task or isolate parked on a receive observes the closed status and ends. A port id SHALL stay valid for the life of the process (identity handles are never reused), and an operation on a closed and drained port SHALL return the closed status, never trap.

#### Scenario: Close then drain
- **GIVEN** a sender that sends three values and closes the port
- **WHEN** the receiver receives four times
- **THEN** the first three receives return the values in order and the fourth returns the closed status

#### Scenario: Send after close
- **GIVEN** a closed port
- **WHEN** a task sends through it
- **THEN** `Send` returns `Result::Error(PortError::Closed)` and the ring is unchanged

### Requirement: Port builtins
The corelib SHALL reach ports only through `__port_create(capacity: i64) -> i64`, `__port_send(port: i64, value: pointer, class: i64) -> i64`, `__port_receive(port: i64, destination: pointer) -> i64` and `__port_close(port: i64) -> unit`, registered in the builtin table like `__channel_create`, `__channel_send`, `__channel_receive_status` and `__channel_close`. Status codes SHALL be `0` ok, `1` closed, `2` cancelled; `__port_create` SHALL return `-1` only when the system allocator refuses the ring. `value` and `destination` SHALL be traced `BeskidAbiValue` slots owned by the calling fiber's heap.

#### Scenario: Status codes
- **GIVEN** a port with one buffered value that is then closed
- **WHEN** `__port_receive` is called twice and `__port_send` once
- **THEN** the calls return `0`, `1` and `1` in that order

### Requirement: Long-lived isolates and the inbox pattern
`s.Isolate(body)`, with `body` a `[Captures(Bound: Transferable)] () => unit` task body, SHALL start a long-lived isolate owned by the scope and return its `Isolate` handle; the handle SHALL offer `Cancel()`. The body SHALL typically capture one or more `Port<T>` handles created by the scope (`Shared`, D13) and loop on `Receive` until the port reports closed. The scope SHALL join every long-lived isolate before returning: it SHALL close the ports it owns first so that receive loops end, then wait for each isolate to exit, and SHALL cancel any isolate still running after its ports are closed and drained only when `Scope.Cancel` was requested or a sibling failed. A panic in a long-lived isolate SHALL be a task failure of that scope (spawn index assigned at `s.Isolate`) and SHALL cancel its siblings like any other failure.

#### Scenario: Worker with an inbox
- **GIVEN**
  ```beskid
  [Immutable] pub type Job { string id, ReadOnlyArray<u8> payload }

  Result<i64, ParallelError> RunWorker(List<Job> jobs) {
      return Parallel.Scope<i64>((Scope s) => {
          Port<Job> inbox = s.Port<Job>();
          Port<i64> done = s.Port<i64>();
          Isolate worker = s.Isolate(() => {
              mut i64 n = 0;
              mut bool open = true;
              while open {
                  match inbox.Receive() {
                      Result::Ok(job) => { n = n + job.payload.Count(); },
                      Result::Error(_) => { open = false; },
                  };
              }
              done.Send(n);
              return;
          });
          for job in jobs { inbox.Send(job); }
          inbox.Close();
          return match done.Receive() { Result::Ok(n) => Result::Ok(n), Result::Error(_) => Result::Ok(-1_i64) };
      });
  }
  ```
- **WHEN** `RunWorker` runs with three jobs of payload sizes 1, 2 and 3
- **THEN** the result is `Result::Ok(6)`, every `Job` crossed by pointer, and the worker isolate exited before the scope returned

### Requirement: Causal count delivery over the owner mailbox
Every reference-count message (INC or DEC) addressed to the owner `P` of an object SHALL be posted to `P`'s owner mailbox (`owner_post`), which is a FIFO drained by `P`'s scheduler in `ExternalPump`. A sender that forwards a foreign `Shared` value SHALL post the INC to the owner before it publishes the port slot that carries the value. A receiver SHALL post a DEC only after it has consumed the slot and its collector has found the entry unreached. Because posting is a synchronous enqueue under one lock and the mailbox is FIFO, an INC SHALL reach the owner before any DEC that causally depends on the forwarded message; the runtime SHALL NOT rely on acknowledgements. Port rings SHALL NOT be merged into the mailbox. The owner mailbox SHALL grow or spill when the fixed 256-command buffer (`external_wait.h:73`) is full instead of trapping, so count traffic can never trap the process.

#### Scenario: Forwarded value is never freed early
- **GIVEN** isolate `B` holding a `Shared` object `o` owned by `A`, forwarding `o` to `C` through a port, then dropping it; `C` receives `o`, drops it and collects
- **WHEN** `A` drains its mailbox and collects
- **THEN** `A` processed `B`'s INC before `C`'s DEC, `o`'s count never reached zero while `B` held it, and `o` is freed only after `B`'s own DEC

#### Scenario: Mailbox under count pressure
- **GIVEN** a receiver that drops 10,000 distinct `Shared` objects owned by one isolate and collects once
- **WHEN** the DECs are posted
- **THEN** the owner receives one combined DEC per object or per batch, no trap occurs, and every count reaches zero
