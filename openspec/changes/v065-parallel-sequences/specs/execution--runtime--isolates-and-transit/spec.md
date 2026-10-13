## ADDED Requirements

### Requirement: Moved hand-over by pointer at send
A `Moved` value (a `move` capture of a task body passed to `s.Spawn` or `s.Isolate`, a `Port.Send(move x)`, a pipeline record of Moved type, or a `ParallelSeq` output chunk) SHALL cross by pointer: the object graph SHALL stay in the sender's heap and no byte of it SHALL be copied. At send the sender SHALL walk the graph with its descriptors (`TraceObjectFields`, `Runtime/Mem/Gc/Marking.bd:148-181`, with a visited set so shared sub-objects and cycles are visited once) and, for every object it owns: give it a local count entry (`count += 1`, epoch stamped, `immutable` from `TYPE_DESCRIPTOR_IMMUTABLE`); when the object is immutable, SHALL NOT enter its fields; when the object is mutable, SHALL enter its fields. For every object in the graph owned by another isolate, the sender SHALL decrement its own foreign count or inflate and post an INC to that owner before publishing, exactly as for `Shared` forwarding, and SHALL enter the object's fields only when it is mutable. The static alias discipline guarantees that after `move x` no name in the sender reaches the graph, so the sender SHALL NOT read or write the graph afterwards; the runtime adds no barrier. The `Transit.bd` copier SHALL treat an object whose descriptor carries `TYPE_DESCRIPTOR_IMMUTABLE` as a leaf exactly when the tracer does.

#### Scenario: Buffer moves without a copy
- **GIVEN** `u8[] block = Array.Zeroed<u8>(67108864_i64); Task<i64> t = s.Spawn(() => Array.Len<u8>(move block));`
- **WHEN** the task runs
- **THEN** the task reads the array at its original address in the parent heap, the parent's local table holds one entry for the array object, and the spawn completed in constant time independent of 64 MiB

#### Scenario: Mutable graph gets one entry per object
- **GIVEN** `[Isolated] pub type Chain { Option<Chain> next, string label }` with 1000 nodes and 1000 distinct strings, captured with `move`
- **WHEN** the send is instrumented
- **THEN** the parent's local table gains 1000 mutable entries (the nodes) and 1000 immutable entries (the strings), and the string payloads were not entered

#### Scenario: Forwarding a foreign mutable graph
- **GIVEN** task `B` that received a Moved graph owned by `A` and forwards it to `C` through a port
- **WHEN** `B` sends
- **THEN** for every object of the graph `B` decremented its foreign count or posted an INC to `A` before the slot was published, and `A`'s heap was not written

### Requirement: Moved hand-over at receive
At receive of a Moved value the receiver SHALL walk the graph the same way: for every object owned by another isolate it SHALL create or increment a foreign table entry `{count, epoch, immutable}` and SHALL enter the object's fields only when the object is mutable; for an object it owns itself (a graph coming back) it SHALL decrement the local count. The received graph SHALL then be an ordinary value of the receiver: it MAY read and write mutable objects of the graph and MAY store receiver-owned objects into them. A store of a receiver-owned child into a foreign mutable parent SHALL run the receiver's ordinary write barrier (`beskid_rt_v5_gc_write_barrier(slot, value)` from 0.6.2), which shades the overwritten value and the child in the receiver's own tables: the receiver's mark bitmaps for its own objects and its foreign table for foreign ones; no barrier SHALL touch the owner's heap. The receiver SHALL NOT allocate in the owner's regions.

#### Scenario: Receiver mutates a handed-over graph
- **GIVEN** a task that receives `move index` (an `[Isolated] Index { List<string> terms }`), appends a string allocated in its own heap to `terms`, and returns `move index`
- **WHEN** the parent joins and reads `terms`
- **THEN** the appended string is readable in the parent (its region was adopted at join) and the original nodes were never copied

#### Scenario: Received graph entries
- **GIVEN** the 1000-node `Chain` of the send scenario received by a task
- **WHEN** the receive is instrumented
- **THEN** the task's foreign table gains 1000 mutable and 1000 immutable entries naming the parent as owner, and the task entered only the mutable nodes

### Requirement: ParallelSeq chunks and results use hand-over and adoption
A `ParallelSeq` terminal SHALL pass the source array to workers by pointer under the scope-frame root of 0.6.3 (read-only for the operation's duration) and SHALL NOT give its elements count entries; each worker's output chunk SHALL be a Moved result adopted by the caller at join. A pipeline record of Moved type SHALL cross each stage by hand-over. The 0.6.4 behavior of copying Moved values through a native transit record SHALL be removed; `Copied` values keep it.

#### Scenario: Pipeline of moved buffers
- **GIVEN** `u8[] Transform(move u8[] buf)` and the pipeline `s.Source((Port<u8[]> out) => { ... })` yielding 1 MiB buffers with `out.Send(move buffer)`, then `.Stage(2_i64, Transform)` and a sink counting bytes
- **WHEN** the pipeline runs over 64 buffers
- **THEN** the sink counts 64 MiB, no buffer bytes were copied between stages, and every buffer's region is adopted by the scope's isolate when the stage isolates are joined
