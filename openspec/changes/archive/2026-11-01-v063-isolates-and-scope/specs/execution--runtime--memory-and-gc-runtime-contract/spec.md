## ADDED Requirements

### Requirement: Foreign references are recorded during marking
Each heap SHALL own a foreign reference table (foreign table; `Runtime/Mem/Gc/Foreign.bd`, the ORCA FRC) keyed by the foreign object's address, with one entry `{count, epoch, immutable}` per foreign object this heap holds. When marking meets a managed pointer that is not inside one of the current heap's regions (`GcMarkGray`, `Runtime/Mem/Gc/Marking.bd:116-119`), the collector SHALL resolve the owning runtime instance through the process-wide region-to-owner map, SHALL create or stamp the entry with the current collection epoch, and SHALL return without marking the object or tracing its fields; a pointer that resolves to no instance SHALL be ignored as today. In 0.6.3 every recorded entry SHALL have `immutable = 1` and `count = 1`, because the only foreign references are `Shared` scope captures and objects reachable from them; the owner is kept alive by the scope frame, not by the count. At the end of marking, entries not stamped in this epoch SHALL be removed from the table. The table SHALL be native memory (`SystemAllocate`), never a managed object, and marking SHALL NOT write into the owner's heap or span directory.

#### Scenario: Foreign entry created and dropped
- **GIVEN** a task that holds a captured `Shared` record in a local, forces a collection, drops the local and forces a second collection
- **WHEN** both collections complete
- **THEN** after the first the task's foreign table has one entry for the record stamped with epoch 1, and after the second the table is empty

#### Scenario: Owner heap is not written by a foreign collector
- **GIVEN** a parent object captured by two tasks that both force collections while the parent's collector is idle
- **WHEN** the parent then runs its own collection
- **THEN** every span mark bit of the parent heap is clear at the start of the parent's marking and the parent object is marked only by the parent

### Requirement: Heap adoption at join
When a task completes and is joined, and the task's heap holds no entry in its own local reference count table (0.6.4) with a count held by a third isolate (always true in 0.6.3, where no isolate but the parent can hold a pointer into a child heap), the parent SHALL adopt the child's heap regions instead of copying the result: it SHALL relink every child region into the parent heap's region chain (`HEAP_FIRST_REGION`, `Runtime/Mem/Gc/State.bd:140-147`), update the process-wide region-to-owner map so each region resolves to the parent, add the child's live bytes to the parent's live-byte count, remove from the child's foreign table every entry that names the parent, append the remaining child foreign entries to the parent's foreign table, and transfer the child's local reference count entries to the parent. The collector is non-moving, so no pointer SHALL be rewritten. A `Shared` or `Moved` result SHALL then be read by the parent as an ordinary pointer into an adopted region; a `Copied` result SHALL be copied through `Transit.bd` and the child heap discarded. A task that failed or was cancelled SHALL have its heap discarded whole after the panic message copy-out, with no adoption. The parent's next collection SHALL reclaim adopted garbage; adopted regions SHALL count against the parent's `BESKID_HEAP_MAX`. Under the incremental collector of 0.6.2, an exiting isolate's heap SHALL first become idle (an in-progress mark is discarded and its barrier flag lowered, an in-progress sweep is finished), so that a heap that is adopted, retained or discarded carries clean mark and scanned bitmaps and its own sweep generation. When the parent's heap is marking at adoption, every allocated slot of an adopted small span SHALL be marked and scanned and every adopted large object SHALL be set black (adopted black, as allocation during marking); when the parent's heap is sweeping, every adopted span SHALL be stamped with the parent's current sweep generation so that the parent's sweep does not free it. Adopted garbage is then reclaimed by the parent's next complete cycle. A child whose local reference count table names a third isolate SHALL follow the fallback of a later release (heap retention, then adoption at scope exit) and SHALL have its result copied.

#### Scenario: Moved result is adopted, not copied
- **GIVEN** `Task<u8[]> t = s.Spawn(() => Array.Zeroed<u8>(1048576_i64));` joined by the parent
- **WHEN** `t.Join()` returns `Result::Ok(bytes)`
- **THEN** `bytes` points into a region that was allocated by the task isolate, the region is now in the parent heap's chain, and no 1 MiB copy was performed

#### Scenario: Adopted garbage is reclaimed by the parent
- **GIVEN** a task that allocates 8 MiB of unreachable objects and returns `1_i64`
- **WHEN** the parent joins it and runs `Assert.CollectGarbage()`
- **THEN** the parent's live bytes after the collection exclude the 8 MiB and the adopted regions remain in the parent chain

#### Scenario: Failed task heap is discarded
- **GIVEN** a task that allocates 8 MiB and then panics
- **WHEN** the parent joins it
- **THEN** the parent heap gains no region, the panic message is a string in the parent heap, and the child heap's mappings are released
