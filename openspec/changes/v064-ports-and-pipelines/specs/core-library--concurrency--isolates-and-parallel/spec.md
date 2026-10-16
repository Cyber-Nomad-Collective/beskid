## ADDED Requirements

### Requirement: Port handle and creation
`Core.Parallel.Port<T>` SHALL be an `[Immutable]` record over one process-wide port id (`i64 id`) and SHALL therefore be `Shared`; a `Port<T>` value MAY be captured by any task body and sent through another port. The `Scope` method `pub Port<T> Port<T>() where T: Transferable`, called `s.Port<T>()`, SHALL create a port of capacity 64 owned by `s`; `pub Port<T> PortWith<T>(i64 capacity) where T: Transferable`, called `s.PortWith<T>(capacity)`, SHALL create a port of the given capacity and SHALL panic in the caller when `capacity < 1`. The element type has no argument to be inferred from, so it SHALL be written. A port of a non-transferable element type SHALL be rejected with **E1610**; every method of `Port<T>` SHALL carry the owner bound `where T: Transferable`. Ports SHALL be closed by their scope when it returns, after its tasks and isolates have been joined.

#### Scenario: Default capacity
- **GIVEN** `Port<i64> p = s.Port<i64>();` and a task that sends 65 values without any receiver
- **WHEN** the task runs
- **THEN** the first 64 sends complete and the 65th parks the task's fiber until the parent receives or the scope cancels

#### Scenario: Port of a channel is rejected
- **GIVEN** `s.Port<Channel<i64>>()`
- **WHEN** the call is type-checked
- **THEN** the compiler reports **E1610** because `Channel<i64>` does not satisfy `Transferable`

#### Scenario: Port handle crosses a port
- **GIVEN** `Port<Port<i64>> replyTo = s.Port<Port<i64>>();` and a task that receives a `Port<i64>` from `replyTo` and sends `42_i64` into it
- **WHEN** the parent sends a fresh port through `replyTo` and receives from that fresh port
- **THEN** it receives `42`

### Requirement: Port send, receive, close and back-pressure
`Port<T>` SHALL offer `Result<SendOk, PortError> Send(move T value)` (an owning parameter over the type parameter, judged per instantiation by the requirement "Locals mut and assignment"), `Result<T, PortError> Receive()`, `TryResult<T, PortError> TryReceive()` and `unit Close()`. For a `Moved` instantiation of `T` the argument of `Send` SHALL be an owning name passed with `move` and SHALL be consumed; for a `Shared` or `Copied` instantiation the argument SHALL be passed without `move`. `Send` SHALL park the calling fiber while the port holds `capacity` unreceived values and SHALL return `Ok(SendOk {})` once the value is buffered; it SHALL return `Error(PortError::Closed)` when the port is closed and `Error(PortError::Cancelled)` when the fiber or its isolate is cancelled while parked. `Receive` SHALL park while the port is empty and open; it SHALL return buffered values in send order after `Close` and `Error(PortError::Closed)` once the port is closed and empty. `TryReceive` SHALL never park. `Close` SHALL be idempotent and MAY be called from any isolate holding the handle. `PortError` SHALL be `[Immutable]` with variants `Closed` and `Cancelled`. A `Shared` value SHALL cross by pointer; a `Copied` value SHALL be a fresh object graph in the receiver's heap; in 0.6.4 a `Moved` value SHALL also arrive as a fresh graph.

#### Scenario: Bounded producer and consumer
- **GIVEN**
  ```beskid
  Result<i64, ParallelError> SumStream() {
      return Parallel.Scope<i64>((Scope s) => {
          Port<i64> values = s.PortWith<i64>(4_i64);
          s.Spawn(() => {
              mut i64 i = 0;
              while i < 100 { values.Send(i); i = i + 1; }
              values.Close();
              return;
          });
          mut i64 total = 0;
          mut bool open = true;
          while open {
              match values.Receive() {
                  Result::Ok(v) => { total = total + v; },
                  Result::Error(_) => { open = false; },
              };
          }
          return Result::Ok(total);
      });
  }
  ```
- **WHEN** `SumStream()` runs
- **THEN** the result is `Result::Ok(4950)`, the producer parked whenever four values were unreceived, and `Receive` returned `PortError::Closed` exactly once

#### Scenario: Moved send consumes the binding
- **GIVEN** `u8[] block = Array.Zeroed<u8>(16_i64); out.Send(move block); i64 n = Array.Len<u8>(block);`
- **WHEN** the legality gate judges the function
- **THEN** the compiler reports **E1234** at the second use of `block`

#### Scenario: TryReceive on an empty open port
- **GIVEN** an open port with no buffered value
- **WHEN** `TryReceive()` is evaluated
- **THEN** it returns the `WouldBlock` result without parking

### Requirement: Long-lived isolate with an inbox
The `Scope` method `pub Isolate Isolate([Captures(Bound: Transferable)] () => unit body)`, called `s.Isolate(body)`, SHALL start a long-lived isolate owned by `s` and SHALL return its `Isolate` handle, whose `Cancel()` requests cancellation of that isolate alone. The body SHALL receive its work through ports it captured. The scope SHALL close its ports and join every long-lived isolate before returning; a long-lived isolate SHALL therefore end when its inbox reports `Closed` and its body returns. A panic in the body SHALL be a task failure with the spawn index assigned at `s.Isolate` and SHALL cancel siblings. A body that loops forever without observing its inbox's `Closed` status or cancellation SHALL be cancelled by the scope only when `Scope.Cancel` was called or a sibling failed; otherwise the scope SHALL wait for it.

#### Scenario: Two workers share one inbox
- **GIVEN** a scope with `Port<i64> inbox` of capacity 64, two `s.Isolate` bodies that each receive from `inbox` until `Closed` and send their partial sum into `Port<i64> done`, and a parent that sends `1_i64 .. 100_i64`, closes `inbox` and receives two partial sums
- **WHEN** the scope runs
- **THEN** the two partial sums add up to `5050`, each value was received by exactly one worker, and both isolates exited before the scope returned

#### Scenario: Worker panic fails the scope
- **GIVEN** a long-lived isolate whose body panics with `"worker down"` after one receive, and a parent that keeps sending
- **WHEN** the scope returns
- **THEN** the result is `ParallelError::Failed` with one failure whose message is `"worker down"`, and the parent's blocked `Send` returned `PortError::Cancelled` or `PortError::Closed`

### Requirement: Pipeline over ports
`Core.Parallel` SHALL build a staged pipeline inside a scope through methods called in the fluent form: the `Scope` method `pub PipelineStage<T> Source<T>([Captures(Bound: Transferable)] (Port<T>) => unit source) where T: Transferable`, called `s.Source(source)`, SHALL start one isolate running `source` with a fresh output port and SHALL close that port when `source` returns; the `PipelineStage<T>` method `pub PipelineStage<U> Stage<U>(i64 workers, [Captures(Bound: Transferable)] (T) => U step) where T: Transferable, U: Transferable`, called `input.Stage(workers, step)`, SHALL start `workers` isolates (at least 1) that receive from the input port, apply `step` and send into a fresh output port, which SHALL be closed when every worker has observed the input closed; `pub PipelineStage<T> Ordered()`, called `stage.Ordered()`, SHALL make the stage deliver outputs in input order by buffering per input sequence number; `pub Result<i64, ParallelError> Sink([Captures(Bound: Transferable)] (T) => unit sink)`, called `input.Sink(sink)`, SHALL run `sink` on the calling isolate for every record and SHALL return the number of records consumed once the input is closed and drained. `T` of `Source` SHALL be inferred from the typed parameter of the `source` lambda and `U` of `Stage` from the `step` lambda's result (0.6.1 "Method type argument inference"). Each stage's output port SHALL be handed to the next stage; no stage SHALL join and resend. A stage with `workers > 1` MAY reorder records unless `Ordered` is applied. Every `T` and `U` SHALL be `Transferable`. A panic in any stage SHALL be a failure of the enclosing scope and SHALL cancel the other stages.

#### Scenario: Three-stage pipeline
- **GIVEN**
  ```beskid
  Result<i64, ParallelError> Count() {
      return Parallel.Scope<i64>((Scope s) => {
          return s
              .Source((Port<i64> out) => {
                  mut i64 i = 1;
                  while i <= 1000 { out.Send(i); i = i + 1; }
                  return;
              })
              .Stage(4_i64, (n) => n * n)
              .Ordered()
              .Stage(2_i64, (sq) => "${sq}")
              .Sink((line) => { Output.WriteLine(line); return; });
      });
  }
  ```
- **WHEN** `Count()` runs
- **THEN** the result is `Result::Ok(1000)`, the lines are printed in input order, and no stage isolate outlives the scope

#### Scenario: Unordered stage may reorder
- **GIVEN** `numbers.Stage(4_i64, step)` without `Ordered`, where `step` sleeps proportionally to `1000 - n`
- **WHEN** the sink collects the outputs
- **THEN** the multiset of outputs equals the inputs and the sequence is not required to be sorted

#### Scenario: Stage failure cancels the pipeline
- **GIVEN** a stage whose `step` panics on input `500`
- **WHEN** the scope returns
- **THEN** the result is `ParallelError::Failed` with one failure, every other stage exited, and the sink returned early

### Requirement: Shared values cross ports by pointer
A `Shared` value sent through a port SHALL arrive as the same object address in the receiver; no bytes of the value SHALL be copied. The sender SHALL record a count for the object in the owner's local table (or inflate its own foreign count and post an INC when forwarding), and the receiver SHALL record a foreign table entry, as specified in the memory and GC runtime contract. A `Shared` value SHALL remain valid in the receiver until the receiver's collector finds it unreachable, regardless of what the owner does with its own references, and regardless of whether the owner isolate has exited.

#### Scenario: Same address on both sides
- **GIVEN** `[Immutable] pub type Blob { ReadOnlyArray<u8> bytes }` with a 64 MiB array, sent by the parent through a port to a task that returns `blob.bytes.Count()`
- **WHEN** the task runs
- **THEN** the task observed the parent's object address, the send completed in constant time independent of 64 MiB, and the task returns `67108864`

#### Scenario: Owner drops its reference
- **GIVEN** a parent that sends a `Shared` string through a port, overwrites its only binding and forces a collection before the task receives
- **WHEN** the task receives and reads the string
- **THEN** the bytes are intact
