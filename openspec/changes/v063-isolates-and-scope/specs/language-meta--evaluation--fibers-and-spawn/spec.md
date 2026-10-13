## ADDED Requirements

### Requirement: Fibers and spawn are isolate-local
A fiber SHALL belong to the isolate whose scheduler created it and SHALL run only on that isolate's thread. `spawn` SHALL create a fiber on the calling isolate; it SHALL NOT create an isolate or a thread. A `Fiber<T>`, `Channel<T>`, `Mutex`, `WaitGroup` or `Hub` handle SHALL NOT be `Transferable` (each is `[NeverTransferable]` from 0.6.1), so no such handle can be captured by a `Scope.Spawn` lambda, returned from a task body or sent through a port. A task body MAY spawn fibers freely; every fiber of an isolate SHALL end when the isolate ends, and a joinable fiber still running when the isolate main fiber returns SHALL be joined by the isolate's shutdown exactly as the main fiber's shutdown joins spawned children today.

#### Scenario: spawn inside a task stays in the task's isolate
- **GIVEN** a task body `Fiber<Isolate> f = spawn Isolate.Current(); return match f.Join() { Result::Ok(i) => i == Isolate.Current(), Result::Error(_) => false };`
- **WHEN** the task runs on a pool isolate
- **THEN** the task returns `true`

#### Scenario: Fiber handle cannot cross to a task
- **GIVEN** `Fiber<i64> f = spawn Work(); s.Spawn(() => match f.Join() { Result::Ok(v) => v, Result::Error(_) => 0_i64 });`
- **WHEN** the legality gate judges the lambda
- **THEN** the compiler reports **E1236** naming `f` and `Fiber<i64>`

#### Scenario: Channel handle cannot be a task result
- **GIVEN** `s.Spawn(() => Channel.Create<i64>())`
- **WHEN** the call is type-checked
- **THEN** the compiler reports **E1610** because `Channel<i64>` does not satisfy the `Transferable` bound of `T`
