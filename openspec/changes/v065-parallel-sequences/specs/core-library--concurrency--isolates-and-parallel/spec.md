## ADDED Requirements

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
  pub type Stats { i64 count, f64 total, f64 max }

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
