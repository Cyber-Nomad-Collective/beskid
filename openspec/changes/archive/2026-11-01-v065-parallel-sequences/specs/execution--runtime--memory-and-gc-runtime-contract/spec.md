## ADDED Requirements

### Requirement: Owner collector treats counted entries by mutability
At mark start, together with its own roots (0.6.2 incremental cycle), the owner's collector SHALL process every local count entry with `count > 0`: an entry whose object is immutable (`TYPE_DESCRIPTOR_IMMUTABLE`, `ReadOnlyArray` records and strings included) SHALL be marked and its fields traced through the ordinary mark work (the owner traces shared immutable graphs); an entry whose object is mutable SHALL be marked shallow: for a small-object span the collector SHALL set both the mark bit (`SPAN_MARK_BITS`) and the scanned bit (`SPAN_SCANNED_BITS`) of the slot so `DrainSpan` (`Runtime/Mem/Gc/Marking.bd:194-211`) never scans it; for a large object it SHALL set the header state to black directly (`Marking.bd:127-133, 232`). The owner SHALL NOT read a field of a mutable object with `count > 0`, because another isolate may be writing it. An immutable object reachable from a shallow-marked mutable object SHALL be kept alive by its own entry (the sender gave every immutable sub-object an entry) and SHALL be traced from that entry. Entries with `count == 0` SHALL be dropped before the pass. An entry for a mutable object created while the owner's heap is marking (a Moved send during a cycle) SHALL be shallow-marked by the sender when the entry is created, before the port slot or task capture is published, because the object may already be shaded and queued and a later `DrainSpan` would otherwise read fields that the receiver is writing; an immutable entry created during marking SHALL shade its object.

#### Scenario: Owner never scans a handed-over mutable object
- **GIVEN** a parent that handed a 1000-node mutable `Chain` to a task that is mutating it, then forces a collection
- **WHEN** the parent's marking runs
- **THEN** each node's slot has both the mark and scanned bits set before `DrainSpan` runs, no node field is read by the parent, and the 1000 strings are traced through their own entries

#### Scenario: Immutable entry is traced
- **GIVEN** a parent that sent a `[Immutable] Table { ReadOnlyArray<i64> rows }` through a port, dropped its binding and collects
- **WHEN** marking completes
- **THEN** the `Table` record and its backing array are both marked and the array bytes are intact

#### Scenario: Large mutable object
- **GIVEN** a 2 MiB `u8[]` handed over to a task that is writing it, and a parent collection
- **WHEN** the parent's marking drains the array's span
- **THEN** the array header is set black without `TraceObjectAt` being called on it

### Requirement: Receiver collector traces through foreign mutable objects
During marking, when the collector meets a pointer into another instance's heap, it SHALL resolve the owner through the region-to-owner map, stamp the foreign entry with the current epoch, and: if the object's descriptor is mutable, trace its fields with `TraceObjectFields` (the receiver may have stored its own objects into the graph); if the descriptor is immutable, stop (the owner traces it). Under the incremental collector of 0.6.2, tracing a foreign mutable object is mark work: stamping its entry for the first time in an epoch SHALL also enqueue the entry on a receiver-side work list kept in the foreign table (native memory), a mark step SHALL trace it under the step budget, and mark termination SHALL require that list to be empty as well as the mark queue; the write barrier only stamps and enqueues. A foreign mutable object received while the receiver's heap is marking SHALL be stamped and enqueued at receive. The collector SHALL read the foreign object's header, descriptor and span words with `AtomicWordLoad`, because the owner's sweep may concurrently flip other bits in the same span word; the bit of an object with `count > 0` is stable because the owner never frees it. The receiver SHALL record marking state for foreign objects only in its own foreign table (an epoch stamp), SHALL NOT write a mark bit, scanned bit or header word of the owner's heap, and SHALL NOT write the owner's span directory. A foreign object met for the first time during marking (reachable but not recorded at receive, which can only happen through a mutable foreign graph that another isolate extended) SHALL be recorded with `count = 1` and an INC posted to its owner before the collection ends.

#### Scenario: Receiver-owned child inside a foreign graph survives
- **GIVEN** a task that stores a task-allocated string into a node of a handed-over mutable `Chain`, then forces a collection with no other reference to the string
- **WHEN** the task's marking runs
- **THEN** the string is marked (reached through the foreign mutable node) and survives the sweep

#### Scenario: Foreign immutable is not entered
- **GIVEN** a task holding a received `[Immutable] Table` with a 1 GiB `ReadOnlyArray<u8>` and forcing a collection
- **WHEN** the task's marking runs
- **THEN** the array is not traced by the task, the `Table` entry is stamped, and the collection time does not grow with 1 GiB

#### Scenario: No write into the owner heap
- **GIVEN** any task collection while holding foreign objects
- **WHEN** the owner compares its span directory and object headers before and after the task's collection with its own mutator parked
- **THEN** no word changed

### Requirement: Adoption at join in every case
From 0.6.5 the parent SHALL adopt a completed task's heap at join whether or not a third isolate holds counts into it, superseding the 0.6.4 retention fallback for completed tasks. Adoption SHALL: relink the regions into the parent chain; update the region-to-owner map so every address of the child resolves to the parent; transfer the child's local count entries to the parent's local table (merging with any parent entry for the same object); cancel the child's foreign entries that name the parent against the parent's local entries for those objects; append the remaining child foreign entries to the parent's foreign table; then drain the child's owner mailbox into the parent's tables, so that any INC or DEC posted to the child before the map update is applied, and any posted afterwards resolves to the parent. Because every holder resolves the owner through the map at posting time, no owner id forwarding SHALL be needed. `Shared` and `Moved` results SHALL be read in place; `Copied` results SHALL be copied. Retention SHALL remain only for an isolate that exits while a sibling is still running and the scope has not yet joined it, and SHALL end at that join.

#### Scenario: Adopt with a live third-party count
- **GIVEN** task `A` handing a Moved graph to sibling `B` through a port and returning while `B` still mutates the graph
- **WHEN** the parent joins `A`
- **THEN** `A`'s regions are in the parent chain, the parent's local table holds the entries `B` depends on, `B` continues to read and write the graph, and `B`'s later DEC is applied to the parent's table

#### Scenario: Late message to the child mailbox
- **GIVEN** a DEC posted to `A`'s mailbox one instruction before the parent updates the owner map
- **WHEN** adoption completes
- **THEN** the DEC was applied to the parent's local entry and the count is exact

#### Scenario: Three-generation adoption
- **GIVEN** a grandchild handing a Moved graph to its parent (a task) which returns it to the main isolate
- **WHEN** both joins complete
- **THEN** the graph's regions are in the main heap, no copy was made, and the main isolate's tables hold no entry for the graph
