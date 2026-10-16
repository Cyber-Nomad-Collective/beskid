## MODIFIED Requirements

### Requirement: Cross-fiber sharing
Values MUST NOT be shared across fibers by alias unless immutability is proven or synchronization uses `Channel<T>`. Capturing mutable shared state in `spawn` closures SHOULD be rejected when detectable. Closure environments MUST outlive uses tracked by the compiler’s capture analysis.

Immutability SHALL be proven by the transfer class query: a value whose type is Shared is immutable and MAY be aliased across fibers and across runtime instances. A value of any other class SHALL NOT cross a runtime instance boundary by alias. Fibers, `spawn` and `Channel<T>` SHALL stay inside one runtime instance.

From 0.6.3 a value SHALL cross a runtime instance boundary only as a `Scope.Spawn` capture, a task result, or (from 0.6.4) a port message, and only when its type is `Transferable`. A `Shared` value SHALL be passed by pointer and SHALL be readable by every isolate that holds it; because `Shared` types are transitively immutable, no isolate SHALL write to it and the runtime SHALL add no barrier or lock for it. A `Moved` value SHALL be consumed in the sender and SHALL be reachable only from the receiver afterwards; in 0.6.3 the runtime realizes the transfer as a copy of the graph, which is observationally a move because the sender holds no live name for it. A `Copied` value SHALL be deep-copied into the receiver's heap; the receiver's copy SHALL be a distinct object graph that preserves the sharing and cycles of the source. A value of class Never SHALL be rejected at compile time by the capture rule (**E1236**) or the `Transferable` bound (**E1610**).

#### Scenario: Unsynchronized cross-fiber alias
- **GIVEN** a mutable value aliased into two fibers without proven immutability or a `Channel<T>`
- **WHEN** sharing analysis runs
- **THEN** the compiler rejects the sharing or diagnoses detectable mutable capture

#### Scenario: Shared record aliased by two fibers
- **GIVEN** `[Immutable] pub type Config { string name, i64 retries }` and two `spawn` operands that both read a `Config` local
- **WHEN** sharing analysis runs
- **THEN** the alias is accepted because `Config` is Shared

#### Scenario: Shared record read by two tasks
- **GIVEN** `[Immutable] pub type Table { ReadOnlyArray<i64> rows }` and a scope that captures one `Table` into two tasks that both sum `rows`
- **WHEN** both tasks run at once
- **THEN** both read the same object address and return equal sums, and no copy of `rows` is made

#### Scenario: Copied record is independent in the task
- **GIVEN** `[Copyable] pub type Counter { i64 n }` captured by a task that returns `counter.n + 1`
- **WHEN** the parent reads `counter.n` after the join
- **THEN** the parent still reads the original value and the task heap held a distinct `Counter` object

#### Scenario: Mutable record cannot cross
- **GIVEN** `pub type Cache { i64[] slots }` (neither `[Immutable]` nor `[Copyable]`) captured by a `Scope.Spawn` lambda
- **WHEN** the legality gate judges the lambda
- **THEN** the compiler reports **E1236** naming `Cache`, class Never and the reason "no marker attribute"
