# core-library--concurrency--isolates-and-parallel Specification

## Purpose
TBD - created by archiving change v063-isolates-and-scope. Update Purpose after archive.
## Requirements
### Requirement: Core.Parallel package and isolate handle
The corelib SHALL provide the package `Core.Parallel` with the public types `Isolate`, `Scope`, `Task<T>`, `TaskError`, `TaskFailure`, `ParallelError`, `ScopeOptions` and `ReadOnlyArray<T>`. Operations on a scope, task or array SHALL be methods with method type parameters where needed (`s.Spawn(body)`, `t.Join()`, `s.Cancel()`), called in the fluent form; their type arguments SHALL be inferred as specified by the type-inference requirement "Method type argument inference" (0.6.1) and MAY be written explicitly (`s.Spawn<i64>(body)`). `Parallel.Scope`, `Parallel.ScopeWith` and `ReadOnlyArray.Freeze` SHALL be module functions because they have no receiver. `Isolate` SHALL be an `[Immutable]` record over one process-wide isolate id (`i64 id`) and SHALL therefore be `Shared`. `Isolate.Current()` SHALL return the handle of the runtime instance executing the caller. `Isolate.Main()` SHALL return the handle of the process's first runtime instance. Two `Isolate` values SHALL compare equal exactly when their ids are equal. No `Core.Parallel` type SHALL expose a raw thread, heap pointer or scheduler table.

#### Scenario: A task body runs on another isolate
- **GIVEN** `use Core.Parallel; use Core.Results;` and
  ```beskid
  Result<bool, ParallelError> RunsElsewhere() {
      Isolate parent = Isolate.Current();
      return Parallel.Scope<bool>((Scope s) => {
          Task<bool> t = s.Spawn(() => Isolate.Current() != parent);
          return match t.Join() {
              Result::Ok(other) => Result::Ok(other),
              Result::Error(_) => Result::Ok(false),
          };
      });
  }
  ```
- **WHEN** `RunsElsewhere()` runs with at least two isolates available
- **THEN** the result is `Result::Ok(true)`
- **AND** `Isolate.Current()` inside the body equals `Isolate.Current()` of no other live isolate

#### Scenario: Isolate handle is Shared
- **GIVEN** `Isolate parent = Isolate.Current();` captured by a `Scope.Spawn` lambda
- **WHEN** the capture rule of `[Captures(Bound: Transferable)]` judges the lambda
- **THEN** the capture is accepted with class `Shared` and no diagnostic is reported

### Requirement: Parallel.Scope fork-join
`Parallel.Scope<T>` SHALL have the signature `Result<T, ParallelError> Scope<T>((Scope) => Result<T, ParallelError> body)` plus `Result<T, ParallelError> ScopeWith<T>(ScopeOptions options, (Scope) => Result<T, ParallelError> body)`, and SHALL run `body` on the calling isolate with a fresh `Scope` value. The scope SHALL NOT return before every task spawned in it has reached a terminal state (completed, failed or cancelled), on every exit path of `body` including an `Error` return. A `Task<T>` SHALL NOT be usable after its scope has returned: `Join` on such a task SHALL return `Result::Error(TaskError::Joined)`. `Scope` SHALL be declared `[NeverTransferable]`, so its class is Never and a `Scope` value cannot be captured by a task body (**E1236**). There SHALL be no operation that detaches a task or an isolate from its scope.

#### Scenario: Scope joins every task before returning
- **GIVEN**
  ```beskid
  Result<i64, ParallelError> SumTwo() {
      return Parallel.Scope<i64>((Scope s) => {
          Task<i64> left = s.Spawn(() => 20_i64);
          Task<i64> right = s.Spawn(() => 22_i64);
          i64 a = match left.Join() { Result::Ok(v) => v, Result::Error(_) => 0_i64 };
          i64 b = match right.Join() { Result::Ok(v) => v, Result::Error(_) => 0_i64 };
          return Result::Ok(a + b);
      });
  }
  ```
- **WHEN** `SumTwo()` runs
- **THEN** the result is `Result::Ok(42)` and no isolate spawned by the scope is alive after `SumTwo` returns

#### Scenario: Early error return still joins
- **GIVEN** a body that spawns a task that loops until it observes cancellation, then returns `Result::Error(ParallelError::Cancelled)` without joining
- **WHEN** the scope returns
- **THEN** the task has exited its isolate and the scope result is `Result::Error(ParallelError::Cancelled)`

#### Scenario: Scope value cannot be captured by a task
- **GIVEN** `s.Spawn(() => { Task<i64> inner = s.Spawn(() => 1_i64); return 1_i64; })`
- **WHEN** the legality gate judges the inner lambda
- **THEN** the compiler reports **E1236** naming `s` and the type `Scope`

### Requirement: Scope.Spawn and Task.Join
`Scope.Spawn` SHALL be the method `pub Task<T> Spawn<T>([Captures(Bound: Transferable)] () => T body) where T: Transferable` of `Scope`, called `s.Spawn(body)`. `Scope.SpawnTry` SHALL be the method `pub Task<T> SpawnTry<T>([Captures(Bound: Transferable)] () => Result<T, string> body) where T: Transferable`, called `s.SpawnTry(body)`; a body whose `Ok` type cannot be inferred (a body that only returns `Result::Error`) SHALL be called with the type argument written (`s.SpawnTry<i64>(body)`, **E1203** otherwise); a body that returns `Result::Error(message)` SHALL fail the task with `message`. `Spawn` SHALL start `body` on a pool isolate when one is available; otherwise it SHALL start `body` as a local task fiber of the calling isolate (elision), scheduled after every local task started before it, and SHALL return without running `body` and without waiting for a pool slot. A local task body SHALL run when the calling fiber parks or yields, SHALL park on a full or empty `Port` like any fiber, and SHALL observe cancellation at its safepoints. A `Shared` capture SHALL be passed by pointer; a `Copied` capture SHALL be copied into the task's heap once per task; a `Moved` capture SHALL be consumed at the spawn site. `Task<T>` SHALL be an `[Immutable]` record over a process-wide task id. `Task.Join()` SHALL return `Result<T, TaskError>`: `Ok(value)` when the body completed, `Error(TaskError::Failed(TaskFailure))` when it panicked or `SpawnTry` returned `Error`, `Error(TaskError::Cancelled)` when it was cancelled before completing, and `Error(TaskError::Joined)` on a second `Join`. `TaskFailure` SHALL be an `[Immutable]` record `{ i64 index, string message }` where `index` is the task's zero-based spawn order inside its scope. A `Shared` or `Moved` result SHALL be made available to the joiner without a copy (heap adoption, specified in the memory and GC runtime contract); a `Copied` result SHALL be copied into the joiner's heap.

#### Scenario: Shared and Copied captures
- **GIVEN** `[Immutable] pub type Config { string path; i64 width; }`, `[Copyable] pub type Knobs { i64 depth; }` and
  ```beskid
  Result<i64, ParallelError> Measure(Config config, Knobs knobs) {
      return Parallel.Scope<i64>((Scope s) => {
          Task<i64> t = s.Spawn(() => config.width + knobs.depth);
          return match t.Join() {
              Result::Ok(v) => Result::Ok(v),
              Result::Error(_) => Result::Error(ParallelError::Cancelled),
          };
      });
  }
  ```
- **WHEN** `Measure(Config { path: "a", width: 40 }, Knobs { depth: 2 })` runs
- **THEN** the result is `Result::Ok(42)`, `config` is passed by pointer, and `knobs` is copied into the task heap exactly once

#### Scenario: Moved capture is consumed
- **GIVEN** `u8[] buffer` and `s.Spawn(() => Checksum(move buffer));` followed by `Array.Len<u8>(buffer)` in the parent
- **WHEN** the legality gate judges the parent function
- **THEN** the compiler reports **E1234** at the second use of `buffer`

#### Scenario: SpawnTry error fails the task
- **GIVEN** `Task<i64> t = s.SpawnTry<i64>(() => Result::Error("no input"));`
- **WHEN** `t.Join()` is evaluated
- **THEN** it returns `Result::Error(TaskError::Failed(TaskFailure { index: 0, message: "no input" }))`

#### Scenario: Second Join is refused
- **GIVEN** a completed task `t` already joined once
- **WHEN** `t.Join()` is evaluated again
- **THEN** it returns `Result::Error(TaskError::Joined)` and does not read the result a second time

### Requirement: Structured failure and cancellation
When a task of a scope fails (panic or `SpawnTry` error), the runtime SHALL request cancellation of every other task of the same scope at once. When the scope body returns, the scope SHALL return `Result::Error(ParallelError::Failed(failures))` if any task failed, where `failures` is a `List<TaskFailure>` ordered by spawn index, containing every failed task whether or not it was joined individually, and the same `failures` on every run regardless of which task failed first. `Scope.Cancel()` SHALL request cancellation of every task of the scope; a scope with no failed task whose `Cancel` was called, or whose body returned `Result::Error(ParallelError::Cancelled)`, SHALL return `Result::Error(ParallelError::Cancelled)`. A cancelled task SHALL observe cancellation at its next safepoint (the same points at which a fiber observes `Fiber.Cancel`); the start of a task is not a safepoint, so a task whose cancellation was requested before it started SHALL run until its first safepoint, and a failure it reports before that point SHALL count. A cancelled task's heap SHALL be discarded whole; no finalizer SHALL run on behalf of another isolate. A task that completed before the cancellation request SHALL keep its `Ok` result for `Join`. A body that wants to tolerate a failure SHALL return it as an ordinary `Result` value from `Spawn`; such a value SHALL NOT count as a task failure.

#### Scenario: Failures in spawn order
- **GIVEN**
  ```beskid
  Result<i64, ParallelError> TwoFail() {
      return Parallel.Scope<i64>((Scope s) => {
          s.SpawnTry<i64>(() => { Spin(30_i64); return Result::Error("slow"); });
          s.Spawn(() => 1_i64);
          s.SpawnTry<i64>(() => Result::Error("fast"));
          return Result::Ok(0_i64);
      });
  }
  ```
  where `Spin(ms)` busy-waits for `ms` milliseconds on `Concurrency.NowMillis()`
- **WHEN** `TwoFail()` runs ten times
- **THEN** every run returns `Result::Error(ParallelError::Failed(failures))` with `failures.Count() == 2`, `failures[0].index == 0`, `failures[0].message == "slow"`, `failures[1].index == 2`, `failures[1].message == "fast"`

#### Scenario: Failure cancels siblings
- **GIVEN** a scope that spawns `t1` looping until cancelled and `t2` that panics immediately
- **WHEN** `t1.Join()` is evaluated after `t2` failed
- **THEN** it returns `Result::Error(TaskError::Cancelled)` and the scope returns `ParallelError::Failed` with one failure of index 1

#### Scenario: Tolerated failure is a value
- **GIVEN** `Task<Result<i64, string>> t = s.Spawn<Result<i64, string>>(() => Result::Error("skip"));`
- **WHEN** the scope body returns `Result::Ok(0_i64)` after `t.Join()`
- **THEN** the scope returns `Result::Ok(0)` and no sibling is cancelled

#### Scenario: Scope.Cancel
- **GIVEN** a scope whose body calls `s.Cancel()` after spawning two tasks that loop until cancelled and returns `Result::Ok(1_i64)`
- **WHEN** the scope returns
- **THEN** the result is `Result::Error(ParallelError::Cancelled)` and both tasks exited at a safepoint

### Requirement: Nested scopes and the isolate pool
A task body MAY call `Parallel.Scope`; the nested scope SHALL draw isolates from the same process-wide pool as its ancestors. The number of isolates alive at one time SHALL be bounded by `BESKID_ISOLATES_MAX`, whose default SHALL be the number of logical processors reported by the host. `ScopeOptions.workers` SHALL cap the isolates one scope uses at once and SHALL never exceed the process bound. When the bound is reached, `Spawn` SHALL elide (run the body on the caller) rather than block, so nested scopes cannot deadlock on the pool. With `BESKID_ISOLATES_MAX=1`, or `ScopeOptions { serial: true, workers: 0 }`, every `Spawn` SHALL run its body as a local task fiber of the calling isolate, started in spawn order (serial elision), and a scope whose bodies use no `Port`, no clock, no random source and no I/O SHALL produce the same result as its parallel execution.

#### Scenario: Nested scope completes under a bound of two
- **GIVEN** `BESKID_ISOLATES_MAX=2` and a scope spawning two tasks, each of which opens a nested scope spawning two tasks returning `1_i64`
- **WHEN** the outer scope sums every nested result
- **THEN** the result is `Result::Ok(4)` and at most two isolates are alive at any time

#### Scenario: Serial elision is deterministic
- **GIVEN** the `SumTwo` scope of this capability
- **WHEN** it runs with `BESKID_ISOLATES_MAX=1`
- **THEN** both bodies run on the calling isolate, `Isolate.Current()` inside them equals `Isolate.Main()`, and the result is `Result::Ok(42)`

#### Scenario: Invalid isolate bound is rejected at start
- **GIVEN** a process started with `BESKID_ISOLATES_MAX=0`
- **WHEN** `beskid_rt_v5_process_init` runs
- **THEN** the process terminates through the trap path with exit status 101 and `BESKID_ISOLATES_MAX` in the diagnostic

### Requirement: ReadOnlyArray and Freeze
`Core.Parallel.ReadOnlyArray<T>` SHALL be an `[Immutable]` record with one `[ImmutableStorage]` field of type `T[]` that no method writes (the 0.6.1 corelib-only exemption). The only constructor SHALL be `ReadOnlyArray<T> ReadOnlyArray.Freeze<T>(move T[] items) where T: Transferable`, which consumes the array binding of the caller. `ReadOnlyArray<T>` SHALL offer `i64 Count()`, `T Get(i64 index)` and `Option<T> TryGet(i64 index)` and no operation that writes an element or exposes the backing array. The transfer class of `ReadOnlyArray<T>` SHALL be `Shared` when `T` is `Shared` and not transferable otherwise. There SHALL be no general `Freeze<T>` in 0.6.3.

#### Scenario: Freeze then share by pointer
- **GIVEN**
  ```beskid
  ReadOnlyArray<string> LoadWords() {
      string[] words = Array.Empty<string>();
      words = Array.Append<string>(words, "alpha");
      words = Array.Append<string>(words, "beta");
      return ReadOnlyArray.Freeze<string>(move words);
  }
  Result<i64, ParallelError> CountWords(ReadOnlyArray<string> words) {
      return Parallel.Scope<i64>((Scope s) => {
          Task<i64> t = s.Spawn(() => words.Count());
          return match t.Join() { Result::Ok(n) => Result::Ok(n), Result::Error(_) => Result::Ok(-1_i64) };
      });
  }
  ```
- **WHEN** `CountWords(LoadWords())` runs
- **THEN** the result is `Result::Ok(2)` and `words` is passed to the task by pointer

#### Scenario: Use of the frozen array after Freeze
- **GIVEN** `ReadOnlyArray<string> r = ReadOnlyArray.Freeze<string>(move words); i64 n = Array.Len<string>(words);`
- **WHEN** the legality gate judges the function
- **THEN** the compiler reports **E1234** at the second use of `words`

#### Scenario: ReadOnlyArray of a non-Shared element is not Shared
- **GIVEN** `ReadOnlyArray<u8[]> rows` captured by a `Scope.Spawn` lambda
- **WHEN** the capture rule judges the lambda
- **THEN** the compiler reports **E1236** naming `ReadOnlyArray<u8[]>`

### Requirement: Port handle and creation
`Core.Parallel.Port<T>` SHALL be an `[Immutable]` record over one process-wide port id (`i64 id`) and SHALL therefore be `Shared`; a `Port<T>` value MAY be captured by any task body and sent through another port. The `Scope` method `pub Port<T> Port<T>() where T: Transferable`, called `s.Port<T>()`, SHALL create a port of capacity 64 owned by `s`; `pub Port<T> PortWith<T>(i64 capacity) where T: Transferable`, called `s.PortWith<T>(capacity)`, SHALL create a port of the given capacity and SHALL panic in the caller when `capacity < 1`. The element type has no argument to be inferred from, so it SHALL be written. A port of a non-transferable element type SHALL be rejected with **E1610**; every method of `Port<T>` SHALL carry the owner bound `where T: Transferable`. Ports SHALL be closed by their scope when it returns, before its tasks and isolates are joined, so that every receive loop ends; closing a port SHALL NOT discard buffered values (a receive SHALL still return them), and a send after close SHALL return the closed status.

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
- **GIVEN** `[Immutable] pub type Blob { ReadOnlyArray<u8> bytes; }` with a 64 MiB array, sent by the parent through a port to a task that returns `blob.bytes.Count()`
- **WHEN** the task runs
- **THEN** the task observed the parent's object address, the send completed in constant time independent of 64 MiB, and the task returns `67108864`

#### Scenario: Owner drops its reference
- **GIVEN** a parent that sends a `Shared` string through a port, overwrites its only binding and forces a collection before the task receives
- **WHEN** the task receives and reads the string
- **THEN** the bytes are intact

### Requirement: ParallelSeq from a collection
`Core.Parallel` SHALL provide `ParallelSeq<T>` and the entry points `ParallelSeq<T> Parallel.Of<T>(List<T> values)` and `ParallelSeq<T> Parallel.OfArray<T>(T[] values)`, with `T` bounded by `Transferable` (**E1610** otherwise). The fluent form `values.Parallel()` SHALL be the method `pub ParallelSeq<T> Parallel() where T: Transferable` of `List<T>` (a 0.6.1 method bound on the owner type parameter) returning `Parallel.Of<T>(this)`. A `ParallelSeq<T>` SHALL borrow its source: the source binding SHALL stay usable after the sequence is built and no element SHALL be copied by the construction. The source array SHALL be passed to worker isolates by pointer, rooted by the scope frame of the terminal operation, and SHALL be read-only for the duration of that operation; because the calling isolate is parked in the terminal, no isolate can write the array while workers read it. Operators (`Where`, `Map`, `Chunk`, `MinChunk`) SHALL be lazy: they SHALL build a plan and SHALL run nothing. Terminals (`Count`, `Collect`, `ForEach`, `Reduce`, `ReduceUnordered`) SHALL open an internal `Parallel.Scope`, run the plan, join and return. Operators and terminals SHALL be methods of `ParallelSeq<T>` called in the fluent form; `Map<U>`, `Reduce<C>` and `ReduceUnordered<C>` declare method type parameters, which SHALL be inferred from the lambda's result or the combiner argument (0.6.1 "Method type argument inference") and MAY be written explicitly (`.Map<i64>(f)`). An untyped operator lambda parameter SHALL take the element type `T` from the receiver.

#### Scenario: Source stays usable and uncopied
- **GIVEN** `List<i64> values = Fixtures.Numbers(1000_i64); ParallelSeq<i64> seq = values.Parallel(); i64 n = seq.Count(); i64 m = values.Count();`
- **WHEN** the function runs
- **THEN** `n == 1000`, `m == 1000`, and the worker isolates read `values`' storage at its original address

#### Scenario: Non-transferable element is rejected
- **GIVEN** `List<Channel<i64>> channels` and `channels.Parallel()`
- **WHEN** the call is type-checked
- **THEN** the compiler reports **E1610** because `Channel<i64>` does not satisfy `Transferable`

#### Scenario: Operators run nothing
- **GIVEN** `ParallelSeq<i64> seq = values.Parallel().Map((x) => Record(x));` where `Record` sends `x` into a port
- **WHEN** no terminal is applied
- **THEN** no isolate is spawned and nothing is sent

### Requirement: Fused per-chunk evaluation
A terminal SHALL evaluate the operator chain once per element inside the worker that owns the element's chunk, in one pass per chunk, with no intermediate collection materialized between operators (stream fusion). `Where` SHALL drop an element before later operators see it. `Map<U>` SHALL require `U: Transferable` and SHALL apply its lambda exactly once per surviving element. Every operator lambda SHALL be a `[Captures(Bound: Transferable)]` lambda; a lambda that assigns a captured local SHALL be rejected by the capture rule (the diagnostic SHALL offer a reduction). Each worker's partial result SHALL be produced in the worker's heap and returned as a `Moved` result adopted by the caller at join; `Collect` SHALL then perform exactly one concatenation in the caller's heap.

#### Scenario: Where and Map fuse
- **GIVEN**
  ```beskid
  i64 SumOfSquaresOfEvens(List<i64> values) {
      return values
          .Parallel()
          .Where((x) => x % 2 == 0)
          .Map((x) => x * x)
          .Reduce(0_i64, SumI64 {});
  }
  ```
  with `values = 0 .. 999`
- **WHEN** it runs with a probe counting `Map` applications per isolate
- **THEN** the result is `166167000`, `Map` ran exactly 500 times in total, every application ran on a worker isolate (or on the caller under elision), and no list of 500 squares was built before the reduction

#### Scenario: Captured mutable local is rejected
- **GIVEN** `mut i64 count = 0; lines.Parallel().ForEach((l) => { if l.Contains(needle) { count = count + 1; } });`
- **WHEN** the legality gate judges the lambda
- **THEN** the compiler reports **E1235** naming `count` and its help names a reduction (`Where(...).Count()`)

#### Scenario: Collect adopts chunks and concatenates once
- **GIVEN** `List<i64> out = values.Parallel().Map((x) => x + 1).Collect();` over 1,000,000 elements on four isolates
- **WHEN** it runs
- **THEN** `out` equals the serial map in order, each worker's partial list was adopted without an element copy at join, and exactly one concatenation of the partial lists happened in the caller

### Requirement: Chunking and adaptive splitting
`Chunk(i64 n)` SHALL make every chunk at most `n` elements (the last may be smaller); `MinChunk(i64 n)` SHALL make every chunk at least `n` elements unless the input has fewer; both SHALL panic in the caller when `n < 1`. Without either, splitting SHALL be lazy and adaptive: the sequence SHALL start with one chunk per isolate the terminal's scope may use, and a worker SHALL split its remaining range in half only when another pool isolate is idle and the range holds at least twice the current floor; the floor SHALL be derived from a heartbeat (a time quantum, not an element count) so that short bodies get large chunks and long bodies get small ones. Thread or isolate counts SHALL NOT be exposed on `ParallelSeq`; `ScopeOptions.workers` is the only knob and lives on the scope. With one isolate available there SHALL be exactly one chunk and no split.

#### Scenario: Chunk bound
- **GIVEN** `values.Parallel().Chunk(4_i64).Map(Resize).Collect()` over 10 elements with a probe recording each chunk's length
- **WHEN** it runs
- **THEN** the recorded lengths are all at most 4 and sum to 10

#### Scenario: MinChunk floor
- **GIVEN** `lines.Parallel().MinChunk(4096_i64).Map(Hash).Collect()` over 10,000 lines
- **WHEN** it runs
- **THEN** no chunk has fewer than 4096 elements and at most two chunks exist

#### Scenario: One isolate, one chunk
- **GIVEN** `BESKID_ISOLATES_MAX=1` and a sequence of 1,000,000 elements with a probe
- **WHEN** `Count()` runs
- **THEN** exactly one chunk is recorded and the body runs on the calling isolate

### Requirement: Combiner contracts and reductions
`Core.Parallel` SHALL declare `pub contract Associative<T> { T Combine(T left, T right); }` and `pub contract Commutative<T> { T Combine(T left, T right); }` as marker contracts carrying the combiner's algebraic claim; the compiler SHALL NOT prove the claim. `T ParallelSeq<T>.Reduce<C>(T seed, C combiner) where C: Associative<T>, C: Transferable` SHALL fold each chunk left to right from `seed`, then combine the chunk results in chunk (input) order, so that the combination order equals the serial left fold's association for an associative combiner. `T ParallelSeq<T>.ReduceUnordered<C>(T seed, C combiner) where C: Associative<T>, C: Commutative<T>, C: Transferable` MAY combine chunk results in any order. The combiner is captured by every chunk body, so `C` SHALL be `Transferable`: a combiner type that is `Never` (for example a type with a function-typed field and no `[Immutable]` marker) SHALL be rejected with **E1610**. The seed is captured by every chunk body and is therefore used more than once; the seed argument SHALL have class `Shared` or `Copied`, and a seed of class `Moved` SHALL be rejected with **E1236** naming the class `Moved` at the argument. A caller that needs a `Moved` accumulator SHALL build it inside the combiner. A combiner type that does not conform to the required contract SHALL be rejected with **E1610** naming the missing contract. The corelib SHALL ship conforming combiner types `SumI64`, `SumF64`, `MaxI64`, `MinI64`, `Concat` (strings) and `Count`, each declared `[Immutable]` (so that each is `Shared` and satisfies the bound `C: Transferable`) and with both contracts where the operation is commutative and with `Associative` only otherwise (`Concat`). `Count()` SHALL equal `Map((x) => 1_i64).Reduce(0_i64, SumI64 {})`.

#### Scenario: User combiner with both markers
- **GIVEN**
  ```beskid
  [Immutable]
  pub type Stats { i64 count; f64 total; f64 max; }

  [Immutable]
  pub type MergeStats : Associative<Stats>, Commutative<Stats> {
      pub Stats Combine(Stats a, Stats b) {
          mut f64 m = a.max;
          if b.max > m { m = b.max; }
          return Stats { count: a.count + b.count, total: a.total + b.total, max: m };
      }
  }

  Stats Summarize(List<f64> samples) {
      return samples
          .Parallel()
          .Map((s) => Stats { count: 1_i64, total: s, max: s })
          .ReduceUnordered(Stats { count: 0_i64, total: 0.0, max: -1.0e308 }, MergeStats {});
  }
  ```
- **WHEN** `Summarize` runs over `[1.0, 4.0, 2.0]`
- **THEN** the result is `Stats { count: 3, total: 7.0, max: 4.0 }` on every run

#### Scenario: Missing Commutative is rejected
- **GIVEN** `[Immutable] pub type Append : Associative<string> { pub string Combine(string a, string b) { return a + b; } }` and `words.Parallel().ReduceUnordered("", Append {})`
- **WHEN** the call is type-checked
- **THEN** the compiler reports **E1610** naming `Commutative<string>`

#### Scenario: Moved seed is rejected
- **GIVEN** a `Moved` accumulator type `Buffer` and `chunks.Parallel().Reduce(Buffer.New(), Merge {})`
- **WHEN** the call is type-checked
- **THEN** the compiler reports **E1236** at the seed argument naming the class `Moved`

#### Scenario: Never-transferable combiner is rejected
- **GIVEN** a combiner type with a function-typed field and no `[Immutable]` marker, passed to `Reduce`
- **WHEN** the call is type-checked
- **THEN** the compiler reports **E1610** for the bound `C: Transferable`

#### Scenario: Ordered Reduce preserves association order
- **GIVEN** `words.Parallel().Chunk(1_i64).Reduce("", Concat {})` over `["a", "b", "c", "d"]`
- **WHEN** it runs on four isolates
- **THEN** the result is `"abcd"`

### Requirement: Order preserved by default; determinism
`Collect`, `ForEach` order of completion notwithstanding, `Reduce` and `Count` SHALL produce results independent of scheduling: `Collect` SHALL return elements in input order, `Reduce` SHALL combine in input order, and `ForEach` SHALL apply its body to every element exactly once with no ordering guarantee between isolates. `ReduceUnordered` SHALL be the only operation whose combination order depends on scheduling and SHALL be documented as the explicit opt-out. A `ParallelSeq` pipeline whose lambdas use no `Port`, no `ReduceUnordered`, no clock, no random source and no I/O SHALL produce the same result as the serial evaluation of the same operators over the source on every run and on every isolate count; with `BESKID_ISOLATES_MAX=1` it SHALL run serially on the calling isolate in input order.

#### Scenario: Parallel equals serial
- **GIVEN**
  ```beskid
  test parallel_sum_matches_serial {
      List<i64> values = Fixtures.Numbers(100000_i64);
      i64 serial = Serial.SumOfSquaresOfEvens(values);
      i64 parallel = values.Parallel().Where((x) => x % 2 == 0).Map((x) => x * x).Reduce(0_i64, SumI64 {});
      Assert.Equal<i64>(parallel, serial, "parallel equals serial elision");
  }
  ```
- **WHEN** the test runs with `BESKID_ISOLATES_MAX` set to 1, 2 and 8
- **THEN** it passes each time with the same `parallel` value

#### Scenario: Collect order
- **GIVEN** `values.Parallel().Chunk(7_i64).Map((x) => x * 2).Collect()` over `0 .. 9999`
- **WHEN** it runs on three isolates
- **THEN** element `i` of the result is `2 * i` for every `i`

### Requirement: Published cost table
The user documentation of `Core.Parallel` SHALL publish the following cost table, and the runtime SHALL meet it:

| Operation | Cost |
| --- | --- |
| Passing a `Shared` value (capture, result, port) | O(1) transfer; at receive O(roots) to record one foreign entry per root object |
| Passing a `Moved` value (capture, port, pipeline record) | O(1) transfer; plus O(objects in the graph) tracing at send and O(objects) tracing at receive; a `u8[]` of any length is one object |
| Passing a `Copied` value | O(size) copy out and O(size) copy in |
| Task result at join | O(1) for `Shared` and `Moved` (heap adoption); O(size) for `Copied` |
| `ParallelSeq` over `T: Shared` | input by pointer, no copy in; output chunks adopted, one concatenation |
| `ParallelSeq` over `T: Copied` | input chunks copied out once per worker, output chunks copied back |
| `Reduce` | per-worker partial, one combine tree, no element copies beyond the input |
| `s.Spawn(body)` onto a pooled isolate | one spawn message; captures passed per class above |
| New isolate | runtime instance and heap creation; pooled and reused |

The table SHALL state the tracing cost of `Moved` hand-over explicitly: a `List<Node>` of one million nodes costs two walks of one million objects, not zero.

#### Scenario: Moved hand-over cost is two walks
- **GIVEN** a `[Isolated]` graph of 1,000,000 small nodes captured with `move` into a task that returns its node count
- **WHEN** the spawn and receive are instrumented
- **THEN** no node bytes are copied, the sender traced 1,000,000 objects at send, and the receiver traced 1,000,000 objects at receive

#### Scenario: Shared array cost is constant
- **GIVEN** a `ReadOnlyArray<u8>` of 256 MiB captured into a task
- **WHEN** the spawn is instrumented
- **THEN** the transfer time does not grow with the array length and the receiver records one foreign entry

