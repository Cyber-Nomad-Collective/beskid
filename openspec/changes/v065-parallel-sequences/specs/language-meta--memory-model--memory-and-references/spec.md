## ADDED Requirements

### Requirement: Moved values are handed over by pointer
From 0.6.5 a `Moved` value that crosses an isolate boundary SHALL keep its identity: the receiver SHALL observe the same object addresses the sender had, and no byte of the graph SHALL be copied. This is sound only because of two static facts the 0.6.2 rules establish and this requirement names as preconditions: after `move x` no name in the sender reaches the graph (external uniqueness, the `iso` precondition), and every object reachable from the graph is `Shared` (transitively immutable, the `val` precondition) or `Moved` (reachable only through the graph). Consequently at every instant exactly one isolate may write a given mutable object, and an object that one isolate may write SHALL NOT be readable by another; the runtime relies on this to trace without barriers or locks. A `Moved` value returned from a task SHALL be owned by the joiner after `Join`; a `Moved` value sent through a port SHALL be owned by the receiver after `Receive`. The sender's binding SHALL be dead in both cases.

#### Scenario: Identity preserved across a round trip
- **GIVEN** `[Isolated] pub type Index { List<string> terms, i64[] offsets }` and
  ```beskid
  Result<Index, ParallelError> BuildAndSort(move Index index) {
      return Parallel.Scope<Index>((Scope s) => {
          Task<Index> t = s.Spawn(() => Sorter.Sort(move index));
          return match t.Join() {
              Result::Ok(sorted) => Result::Ok(sorted),
              Result::Error(_) => Result::Error(ParallelError::Cancelled),
          };
      });
  }
  ```
- **WHEN** `BuildAndSort` runs with an `Index` whose `offsets` array has a recorded address
- **THEN** the returned `Index.offsets` has the same address and the sort happened on another isolate

#### Scenario: Sender cannot reach the graph after move
- **GIVEN** `this.cache = data; s.Spawn(() => Work(move data));` where `data` is `u8[]`
- **WHEN** the legality gate judges the function
- **THEN** the compiler reports **E1242** at the store or at the move, so the field and the task never share a mutable array

#### Scenario: Mutable object has one writer
- **GIVEN** a Moved graph handed to a task that writes it while the parent's collector runs
- **WHEN** both run concurrently
- **THEN** the parent reads no field of the graph and the task's writes are complete and visible to the parent after `Join`
