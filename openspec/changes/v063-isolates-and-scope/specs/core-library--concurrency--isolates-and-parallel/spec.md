## ADDED Requirements

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
`Scope.Spawn` SHALL be the method `pub Task<T> Spawn<T>([Captures(Bound: Transferable)] () => T body) where T: Transferable` of `Scope`, called `s.Spawn(body)`. `Scope.SpawnTry` SHALL be the method `pub Task<T> SpawnTry<T>([Captures(Bound: Transferable)] () => Result<T, string> body) where T: Transferable`, called `s.SpawnTry(body)`; a body whose `Ok` type cannot be inferred (a body that only returns `Result::Error`) SHALL be called with the type argument written (`s.SpawnTry<i64>(body)`, **E1203** otherwise); a body that returns `Result::Error(message)` SHALL fail the task with `message`. `Spawn` SHALL start `body` on a pool isolate when one is available, otherwise SHALL run `body` to completion on the calling isolate before returning (elision) and SHALL NOT wait for a pool slot. A `Shared` capture SHALL be passed by pointer; a `Copied` capture SHALL be copied into the task's heap once per task; a `Moved` capture SHALL be consumed at the spawn site. `Task<T>` SHALL be an `[Immutable]` record over a process-wide task id. `Task.Join()` SHALL return `Result<T, TaskError>`: `Ok(value)` when the body completed, `Error(TaskError::Failed(TaskFailure))` when it panicked or `SpawnTry` returned `Error`, `Error(TaskError::Cancelled)` when it was cancelled before completing, and `Error(TaskError::Joined)` on a second `Join`. `TaskFailure` SHALL be an `[Immutable]` record `{ i64 index, string message }` where `index` is the task's zero-based spawn order inside its scope. A `Shared` or `Moved` result SHALL be made available to the joiner without a copy (heap adoption, specified in the memory and GC runtime contract); a `Copied` result SHALL be copied into the joiner's heap.

#### Scenario: Shared and Copied captures
- **GIVEN** `[Immutable] pub type Config { string path, i64 width }`, `[Copyable] pub type Knobs { i64 depth }` and
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
When a task of a scope fails (panic or `SpawnTry` error), the runtime SHALL request cancellation of every other task of the same scope at once. When the scope body returns, the scope SHALL return `Result::Error(ParallelError::Failed(failures))` if any task failed, where `failures` is a `List<TaskFailure>` ordered by spawn index, containing every failed task whether or not it was joined individually, and the same `failures` on every run regardless of which task failed first. `Scope.Cancel()` SHALL request cancellation of every task of the scope; a scope with no failed task whose `Cancel` was called, or whose body returned `Result::Error(ParallelError::Cancelled)`, SHALL return `Result::Error(ParallelError::Cancelled)`. A cancelled task SHALL observe cancellation at its next safepoint (the same points at which a fiber observes `Fiber.Cancel`) and its heap SHALL be discarded whole; no finalizer SHALL run on behalf of another isolate. A task that completed before the cancellation request SHALL keep its `Ok` result for `Join`. A body that wants to tolerate a failure SHALL return it as an ordinary `Result` value from `Spawn`; such a value SHALL NOT count as a task failure.

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
A task body MAY call `Parallel.Scope`; the nested scope SHALL draw isolates from the same process-wide pool as its ancestors. The number of isolates alive at one time SHALL be bounded by `BESKID_ISOLATES_MAX`, whose default SHALL be the number of logical processors reported by the host. `ScopeOptions.workers` SHALL cap the isolates one scope uses at once and SHALL never exceed the process bound. When the bound is reached, `Spawn` SHALL elide (run the body on the caller) rather than block, so nested scopes cannot deadlock on the pool. With `BESKID_ISOLATES_MAX=1`, or `ScopeOptions { serial: true, workers: 0 }`, every `Spawn` SHALL run its body on the calling isolate in program order (serial elision), and a scope whose bodies use no `Port`, no clock, no random source and no I/O SHALL produce the same result as its parallel execution.

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
