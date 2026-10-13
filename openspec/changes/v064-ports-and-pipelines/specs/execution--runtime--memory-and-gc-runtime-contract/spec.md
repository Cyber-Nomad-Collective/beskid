## ADDED Requirements

### Requirement: Owner external count table
Each heap SHALL own a local reference count table (local table; `Runtime/Mem/Gc/Foreign.bd`, the ORCA LRC) keyed by the address of an object this heap owns, with one entry `{count, epoch, immutable}` per object that another isolate may reach. Entries SHALL be created or incremented by the owner when it sends one of its own objects through a port, and incremented when an INC for the object arrives in the owner mailbox; they SHALL be decremented when a DEC arrives or when the owner receives its own object back. An entry with `count > 0` SHALL protect the object from the owner's sweep: in 0.6.4 every entry is immutable (`Shared` values are the only pointer-crossing class) and the owner's collector SHALL treat each such object as a traced root (mark it and trace its fields before sweeping, ORCA `markimmut`). Under the incremental collector of 0.6.2 the entries with `count > 0` at mark start SHALL be shaded with the roots at mark start, and an entry created or raised from zero while the owner's heap is marking SHALL shade its object at that moment. An entry whose count reaches zero SHALL be dropped, and the object SHALL be reclaimed by the next collection if it is otherwise unreachable. The table SHALL be native memory and SHALL be written only by the owner's thread.

#### Scenario: Sent Shared object survives the owner's collection
- **GIVEN** a parent that sends a `[Immutable]` record it no longer references through a port to a task, then forces two collections before the task receives
- **WHEN** the task receives the record and reads its fields
- **THEN** the fields are intact, and the parent's table held an entry with `count >= 1` for the record during both collections

#### Scenario: Count returns to zero
- **GIVEN** the record of the previous scenario after the task dropped it and collected
- **WHEN** the parent drains its mailbox and collects once more
- **THEN** the entry is gone and the record's bytes are free in the parent heap

### Requirement: Receiver side increments and collector-driven decrements
When an isolate receives a `Shared` object it does not own, it SHALL create or increment the foreign reference table entry for that object (`{count, epoch, immutable = 1}`) and SHALL NOT trace into the object (the owner traces immutable graphs). When it receives an object it owns, it SHALL decrement the local count instead. When a receiver forwards a foreign object through a port, it SHALL decrement its own foreign count if the count stays above zero, otherwise SHALL inflate the count by a fixed constant and post an INC for the difference to the owner before publishing the slot. During marking, a reached foreign object SHALL have its entry stamped with the current epoch and SHALL NOT be traced. A foreign entry created or incremented while the receiver's heap is marking (at receive, at forward or by the write barrier of 0.6.2) SHALL be stamped with the current epoch at that moment, as an object allocated during marking is black, because the value that holds it may be in a root registered after mark start and the rescan at termination does not visit foreign entries. After marking, for every foreign entry not stamped in this epoch the collector SHALL post one DEC per owner carrying the summed counts, grouped by the owner resolved through the region-to-owner map at posting time, and SHALL drop the entries. The receiver SHALL add the recorded size of its foreign entries to its live-byte estimate so that an isolate that handles only foreign objects still collects and sends its DECs.

#### Scenario: Foreign entry and DEC
- **GIVEN** a task that receives one `Shared` record from the parent, holds it across one collection, drops it and collects again
- **WHEN** the two collections complete
- **THEN** after the first the task's foreign table holds the entry stamped with that epoch, after the second the entry is gone and exactly one DEC for the record is in the parent's mailbox

#### Scenario: Forward inflates and posts INC first
- **GIVEN** isolate `B` with foreign count `1` for `o` owned by `A`, forwarding `o` to `C`
- **WHEN** `B` sends
- **THEN** `B`'s entry is inflated, an INC for `o` is in `A`'s mailbox before the slot is published, and `C` records a foreign entry for `o` at receive

#### Scenario: Foreign-only isolate still collects
- **GIVEN** a task that receives 100,000 `Shared` strings and drops each after reading it, allocating nothing itself
- **WHEN** the task runs
- **THEN** its collector runs at least once before the task ends and posts DECs so that the parent reclaims the strings

### Requirement: Heap retention and adoption after isolate exit
When a task's isolate exits and its local reference count table holds an entry with `count > 0` held by an isolate other than the parent, the parent SHALL NOT discard or adopt the heap at join. The heap SHALL be retained by the process with no mutator and no collector: its regions stay mapped, its owner mailbox stays open, and the owning scope SHALL drain that mailbox at each of its own joins and at scope exit, applying INCs and DECs to the retained table. The task's result SHALL be copied into the parent through `Transit.bd` in this case. At scope exit, after every sibling has been joined, the parent SHALL adopt every retained heap of the scope exactly as a completed child (region relink, owner map, table merge); at that point every third-party stake has been merged into the parent's own foreign table, so the merge is a rename, and the parent's next collection reclaims the retained garbage. A retained heap SHALL count against the owning isolate's `BESKID_HEAP_MAX` from the moment of retention.

#### Scenario: Sibling holds a reference into an exited heap
- **GIVEN** task `A` that sends a `Shared` record to sibling `B` through a port and returns `1_i64` while `B` still holds the record and loops for 20 ms
- **WHEN** the parent joins `A` before `B` ends
- **THEN** `A`'s heap is retained, `A`'s result is copied, `B` reads the record intact until it drops it, and the retained heap is adopted when the scope returns

#### Scenario: Retained heap is released at scope exit
- **GIVEN** the scope of the previous scenario
- **WHEN** the parent runs a collection after the scope returned
- **THEN** no region of `A`'s heap remains mapped outside the parent chain and the record's bytes are free

### Requirement: No cycle detector; structural isolate lifetime
The runtime SHALL NOT implement a cycle detector for isolates or for cross-heap object cycles. Isolate lifetime SHALL be structural: every isolate is owned by exactly one scope, is joined by it, and cannot be detached, so no isolate is ever collectable by reference count. Cross-heap object cycles SHALL need no special treatment because counts are stakes, not paths: a cycle of unreachable objects owned by `n` isolates SHALL be reclaimed after each of the `n` owners has completed one collection and posted its DECs. The only residual leak SHALL be a long-lived isolate cancelled while a sibling still holds references into its heap, before the scope exits; the adoption at scope exit of the previous requirement SHALL close it, so that no heap outlives the scope that created its isolate.

#### Scenario: Two-heap cycle is reclaimed
- **GIVEN** isolates `P` and `C` each holding a `Shared` object of the other, with neither object reachable from any local root
- **WHEN** `P` collects, then `C` collects, then `P` drains its mailbox and collects
- **THEN** both objects are freed and no detector ran

#### Scenario: Cancelled worker with a referencing sibling
- **GIVEN** a long-lived isolate `W` cancelled by `Scope.Cancel` while sibling `S` holds a `Shared` record owned by `W`
- **WHEN** the scope returns
- **THEN** `W`'s heap was retained until `S` was joined, then adopted, and after the parent's next collection no byte of `W`'s heap is mapped outside the parent chain
