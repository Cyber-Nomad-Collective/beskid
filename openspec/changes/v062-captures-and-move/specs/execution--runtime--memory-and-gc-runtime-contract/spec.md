## MODIFIED Requirements

### Requirement: Span-batched tri-color mark-sweep collection and barrier exports: Decision [D-EXEC-RT-0006]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Component | Role |
> | --- | --- |
> | **Collector** | Precise, non-moving tri-color mark-sweep collector in the canonical runtime (`Runtime/Mem/Gc`). Marking is span-batched: shading an object sets its bit in the span mark bitmap and enqueues the span once on a heap-wide FIFO; draining a span scans every marked-but-unscanned slot in one pass; a large object is shaded in its header mark word and its span is queued on the same FIFO (`Marking.bd`) |
> | **Scheduling** | From 0.6.2 a collection cycle is incremental: it runs in bounded steps on the heap's own mutator thread, between that heap's fiber executions, with no marker thread. The phases are idle, marking (mark start, mark steps, mark termination), sweeping (sweep steps) and idle again. `gc_collect` completes a whole cycle inside the call |
> | **Atomicity** | Mutator stores run between mark steps. The hybrid write barrier, allocation in black and the root snapshot at mark start keep every object that is reachable at mark start, and every object allocated during the cycle, alive to the end of the cycle |
> | **Field stores** | From 0.6.2 generated code SHALL guard each store that overwrites a GC-managed field of an existing object with the barrier: an inline test of `beskid_rt_v5_gc_barrier_active`, and a call to `beskid_rt_v5_gc_write_barrier(slot, value)` before the store only when the test is non-zero |
> | **Array element stores** | From 0.6.2 generated code guards each store that overwrites a GC-managed array element in the same way. Stores that initialize a new object (aggregate literals, array literals, closure environments, spawn argument environments) have no barrier |
> | **Barrier exports** | `beskid_rt_v5_gc_write_barrier` is the barrier of generated code and of runtime stores into existing objects. `gc_write_barrier` and `beskid_rt_v5_array_write_barrier` keep their 0.6.0 signatures and semantics (shade the new value while the calling thread's heap is marking) for native Mod adapters; generated code does not call them. No barrier export has an effect outside the marking phase of the calling thread's heap |

**Stable ID:** `BSP-REQ-76C777704644`  
**Legacy source:** `site/spec-content/platform-spec/execution/runtime/memory-and-gc-runtime-contract/adr/0006-abfall-tri-color-heap/content.md`  
**Source SHA-256:** `d83d75b49f675ad50cb41d55685814a5a6b26bd1e5836b528545937ba764d731`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: A collection cycle interleaves with the mutator
- **GIVEN** a program that keeps 16 MiB of linked managed objects reachable and then allocates 32 MiB of short-lived objects
- **WHEN** a cycle starts at the mark trigger
- **THEN** `gc_phase` reads 1 at more than one allocation of the program before it reads 2, no mark step traces more than the step bound of "Mark pacing and bounded steps", and every reachable object is intact after the cycle

### Requirement: Heap growth pacing and committed-size cap
The runtime SHALL keep a `collection_threshold` equal to `max(2 * live_bytes after the last completed cycle, 512 KiB)` and a `mark_trigger` equal to `collection_threshold - collection_threshold / 4`. At a pacing point, which is a span refill for a size class or a large or dedicated-region request that cannot be served, an idle heap whose `live_bytes` has reached `mark_trigger` SHALL start an incremental collection cycle; a heap whose `live_bytes` has reached `collection_threshold` SHALL complete its collection cycle (start one if it is idle, then finish marking and sweeping inside the allocating call) before it grows; a heap that is sweeping SHALL finish sweeping before it grows; otherwise the heap SHALL grow without completing a cycle, also while it is marking. Starting a cycle is not a collection in the sense of this requirement; completing one is. Pacing SHALL be evaluated at pacing points, not on every allocation. A growth region SHALL be at least the requested allocation plus the region header and span directory, SHALL otherwise start at 1 MiB and double after every growth up to 64 MiB, and a request larger than the pending region size SHALL receive a dedicated region. The runtime SHALL NOT let `committed_bytes` exceed `cap_bytes`. When growth fails because the cap is reached, the runtime SHALL complete the in-progress cycle, retry the allocation, and if it still fails SHALL run one more complete cycle and retry once more before it reports exhaustion, so that objects that were unreachable at the failing allocation are reclaimed as in 0.6.0. The runtime SHALL export `beskid_rt_v5_heap_set_cap(bytes) -> u8`, which SHALL succeed only while the runtime is active and `bytes` is at least both the committed size and the initial region size, and SHALL export `gc_heap_cap`, `gc_heap_committed`, `gc_heap_region_count`, and `gc_heap_failure_reason` as read-only statistics.

The runtime SHALL NOT impose a fixed default cap on the managed heap: without configuration, `cap_bytes` SHALL be the maximum word value and the heap SHALL grow by regions until the system allocator refuses, which SHALL remain the diagnosable `out_of_memory` trap with the existing failure reason and diagnostic. The region chain SHALL have no fixed region count.

The runtime SHALL read `BESKID_HEAP_MAX` during `beskid_rt_v5_process_init`, after the heap, the primary thread and the scheduler exist, as a decimal byte count with an optional `k`, `m` or `g` suffix (powers of 1024, either case), and SHALL apply it through `beskid_rt_v5_heap_set_cap`. An absent or empty variable SHALL leave the heap uncapped. An unparsable value, or one the cap export rejects (below the committed size or below the initial region size), SHALL terminate initialization through the runtime trap path with exit status 101 and the variable name as the diagnostic message. Because the runtime reads the variable, every activation path (executable host, `beskid_library_attach_v5`, embedding engines) SHALL honour it identically; the executable host SHALL NOT parse it. `BESKID_HEAP_MAX_BYTES` is not read.

**Stable ID:** `BSP-REQ-539C3C627D46`

#### Scenario: Cap from the environment
- **GIVEN** a process started with `BESKID_HEAP_MAX=2m` whose program keeps 3 MiB of managed objects reachable
- **WHEN** the allocation that would exceed 2 MiB runs
- **THEN** the process terminates with exit status 101, the `out_of_memory (5)` diagnostic and `cap=2097152`

#### Scenario: Malformed cap
- **GIVEN** a process started with `BESKID_HEAP_MAX=abc`
- **WHEN** `beskid_rt_v5_process_init` runs
- **THEN** the process terminates with exit status 101 and `BESKID_HEAP_MAX` in the diagnostic

#### Scenario: No cap
- **GIVEN** a process started without `BESKID_HEAP_MAX` on a machine with the memory
- **WHEN** its program keeps 1,088 MiB of managed objects reachable
- **THEN** the allocations succeed, more than one region is committed and the heap verifies clean

#### Scenario: Garbage-heavy program collects instead of growing
- **GIVEN** a program whose reachable set never exceeds 64 KiB but that allocates 8 MiB of short-lived objects in a loop
- **WHEN** the loop completes
- **THEN** `gc_heap_committed` is still 1 MiB, `gc_heap_region_count` is 1, and `gc_collection_count` is greater than zero

#### Scenario: A cycle starts at the mark trigger without blocking growth
- **GIVEN** an idle heap with `collection_threshold` 512 KiB whose live bytes reach 384 KiB at a span refill
- **WHEN** the refill runs
- **THEN** `gc_phase` reads 1 after the refill, `gc_collection_count` is unchanged, and an allocation that needs a new region before the threshold is reached grows the heap while `gc_phase` still reads 1

#### Scenario: Reaching the threshold while marking completes the cycle before growth
- **GIVEN** a heap that is marking, whose live bytes have reached `collection_threshold`, and whose next allocation cannot be served from committed pages
- **WHEN** that allocation runs
- **THEN** `gc_collection_count` increases by one before `gc_heap_region_count` changes

#### Scenario: Cap pressure reclaims garbage dropped during a cycle
- **GIVEN** a process started with `BESKID_HEAP_MAX=8m` whose program keeps 1 MiB reachable, calls `gc_cycle_start`, then drops a 4 MiB graph that was reachable at mark start and allocates 4 MiB of new reachable objects
- **WHEN** an allocation reaches the cap
- **THEN** the runtime completes the in-progress cycle and one more cycle, `gc_collection_count` increased by two, every allocation succeeds, and the process does not trap

## REMOVED Requirements

### Requirement: Span-queued marking and per-span sweep
**Reason**: The 0.6.0 text states that collection is stop-the-world, that large objects use a separate stack-based work list, that sweeping runs once after marking, and that generated code emits no barrier for field stores. All four change with incremental marking in 0.6.2, and its scenario "No write-barrier call is emitted for a managed field store" is now false.
**Migration**: Replaced by "Span-queued incremental marking and per-span sweep", which keeps the span FIFO, the scanned bitmap and the per-span sweep and adds the 0.6.2 cycle rules. The barrier rules move to "Hybrid write barrier" and "Write barrier emission in generated code".

## ADDED Requirements

### Requirement: Span-queued incremental marking and per-span sweep
Marking SHALL be precise: only addresses that the compiler or runtime records as pointer-bearing are treated as roots or traced. Shading an object on a small, scannable span SHALL set that object's bit in the span's mark bitmap (`SPAN_MARK_BITS`) and, if the span is not already queued, SHALL enqueue the span on the heap's first-in-first-out mark queue (`HEAP_MARK_FIFO_HEAD`/`HEAP_MARK_FIFO_TAIL`) exactly once; a span already queued SHALL accumulate further marks without being enqueued again. Draining a dequeued small span SHALL scan every slot that is marked and not yet scanned (`SPAN_SCANNED_BITS`) in one left-to-right pass, tracing each such object's pointer fields and shading their targets. Shading a large object SHALL change its header mark word from white to gray and SHALL enqueue its span on the same queue; the separate pass over every region's span directory (`ProcessLargeObjectsOnce`) SHALL be removed. Draining a large span SHALL trace at most 8 KiB of the object's pointer-bearing bytes from the scan cursor kept in the first word of the span entry's mark bitmap (unused by a large span: element index for an array, pointer-map index for an aggregate), SHALL advance the cursor, and SHALL re-enqueue the span at the tail when bytes remain; when the object is fully traced it SHALL set the header to black and clear the cursor. Marking SHALL terminate when the queue is empty after mark termination (see "Incremental collection cycle"). Sweeping SHALL process spans in bounded sweep steps after marking: a span with no marked object SHALL return its pages to the region's free-page list; a span with at least one marked object SHALL exchange its allocation bitmap for its mark bitmap, rebuild its free-slot list from the newly free slots and clear its mark and scanned bitmaps; a large span whose object is black SHALL survive with the header reset to white, and otherwise SHALL return its pages. A region's adjacent free spans SHALL be merged (`CoalesceRegionFreeSpans`) when the sweep leaves that region. Sweeping SHALL NOT read or write the byte contents of live objects.

#### Scenario: Two objects on the same span are scanned together, not re-walked per object
- **GIVEN** two rooted objects that land on the same span and no other live object on that span
- **WHEN** a collection runs
- **THEN** the span is dequeued from the mark work queue exactly once and both objects are scanned during that single dequeue

#### Scenario: An emptied span is returned and reused by a different size class
- **GIVEN** a span fully populated with one size class whose objects are all dropped before a collection, in a region otherwise at capacity for new spans
- **WHEN** the collection runs and a subsequent allocation requests a different size class
- **THEN** the emptied span's pages satisfy that later allocation

#### Scenario: A large pointer array is traced in chunks
- **GIVEN** a rooted `string[]` of 131,072 elements (1 MiB of element bytes) whose every element is a distinct string, during an incremental cycle
- **WHEN** mark steps run with the default budget
- **THEN** the array's span is dequeued at least 128 times, no single dequeue traces more than 8 KiB of its elements, every string is marked at termination, and the array header is black

### Requirement: Incremental collection cycle
Each heap SHALL run its own collection cycle on its own mutator thread; the runtime SHALL NOT start a marker or sweeper thread. A cycle SHALL pass through these phases, recorded in `HEAP_GC_PHASE` and read by `gc_phase` (0 idle, 1 marking, 2 sweeping, 3 failed):

1. Mark start (one step): set the phase to marking and raise the process barrier flag (see "Per-heap collection state"), so that no mutator store runs between the first shade and an active barrier; then shade the whole root set (see "Roots during incremental marking") without tracing.
2. Mark steps: each step drains the mark queue under the step budget of "Mark pacing and bounded steps".
3. Mark termination (one step, entered when a mark step leaves the queue empty): rescan the root set, drain any work it creates to completion, and repeat until a rescan shades no object; then lower the barrier flag, advance the heap's sweep generation and set the phase to sweeping.
4. Sweep steps: each step sweeps a bounded number of spans in region and page order from the heap's sweep cursor; the step that leaves no unswept span records the live-byte totals, sets `collection_threshold` and `mark_trigger`, increments `gc_collection_count` and sets the phase to idle.

Marking SHALL terminate: every object is shaded at most once per cycle, objects allocated during the cycle are not traced, so the mark work of a cycle is bounded by the objects that existed at mark start; every pacing point and every fiber yield while marking performs mark work, and reaching `collection_threshold` completes the cycle. `gc_collect` SHALL complete any in-progress cycle and then run one complete cycle whose mark start follows the call, so that every object unreachable at the call is freed when it returns. A mark failure (a descriptor or bounds validation failure in tracing) SHALL lower the barrier flag, reset mark state as `ResetMarkedObjects` does today, and set the failed phase; it SHALL NOT sweep. An idle heap at process or isolate shutdown with a cycle in progress SHALL lower the barrier flag and discard the cycle without sweeping.

#### Scenario: Phases are observed in order
- **GIVEN** a heap with live objects and `gc_cycle_start` called once
- **WHEN** a test calls `gc_mark_step(32768)` until it returns 0
- **THEN** the returned phases are a run of 1, then a run of 2, then 0, and `gc_collection_count` increased by exactly one

#### Scenario: Explicit collection frees objects dropped during a cycle
- **GIVEN** a heap that is marking and an object that was reachable at mark start and is dropped before `gc_collect` is called
- **WHEN** `gc_collect` returns
- **THEN** the object's slot is free, `gc_phase` reads 0, and `gc_collection_count` increased by two

#### Scenario: A mark failure discards the cycle
- **GIVEN** a test that corrupts the descriptor word of a reachable object during an incremental cycle
- **WHEN** the next mark step traces the object
- **THEN** `gc_phase` reads 3, `beskid_rt_v5_gc_barrier_active` reads 0, no span was swept, and every span's mark and scanned bitmaps are clear

### Requirement: Mark pacing and bounded steps
At mark start the runtime SHALL record `mark_start_live` (the heap's `live_bytes`), a scan estimate (the live bytes at the end of the previous cycle's sweep, or `mark_start_live` for the first cycle) and a runway equal to `collection_threshold - mark_trigger`. At each pacing point while the heap is marking, the mark debt SHALL be `(live_bytes - mark_start_live) * scan_estimate / runway - scan_work_done`, computed with saturating word arithmetic, where `scan_work_done` counts the bytes traced in this cycle; when the debt is positive the runtime SHALL perform one mark step whose budget is the debt clamped to `[32 KiB, 256 KiB]`. A small allocation served from a span's free-slot list SHALL NOT perform mark work. `FiberYield` SHALL perform one 32 KiB mark step, or one sweep step, at its start, before it changes scheduler state, when the heap is marking or sweeping. A scheduler loop with no runnable fiber MAY perform mark or sweep steps before it blocks. A mark step SHALL stop at the first span or large-object chunk boundary at or after its budget, so that it traces at most its budget plus 8 KiB; mark start SHALL shade roots only and SHALL NOT trace; mark termination SHALL trace only what the rescan shades. A sweep step SHALL sweep at most 32 spans, plus the span that an allocation needs (see "Allocation and sweeping during a cycle"). The heap SHALL record the largest number of bytes traced by one mark step of the last completed cycle, excluding completions forced by `gc_collect`, by the threshold or by cap pressure, and SHALL export it as `gc_last_cycle_max_step_bytes() -> word`. The runtime SHALL export `gc_cycle_start() -> u8`, which starts a cycle when the heap is idle and returns 1, and returns 0 otherwise, and `gc_mark_step(word budget) -> word`, which performs one mark step with that budget, or one sweep step, and returns the phase after the step. The runtime SHALL NOT read `BESKID_GC_*` environment variables.

#### Scenario: Step size is bounded
- **GIVEN** a program that keeps 64 MiB of linked managed objects reachable and allocates 128 MiB of short-lived objects
- **WHEN** the program ends
- **THEN** at least one cycle completed and `gc_last_cycle_max_step_bytes` is at most 262,144 + 8,192

#### Scenario: A fiber that yields without allocating advances marking
- **GIVEN** a heap with 4 MiB of reachable objects and at most 8 MiB committed, `gc_cycle_start` called once, and two fibers that only call `Fiber.Yield` in a loop without allocating
- **WHEN** the fibers yield 1,000 times in total
- **THEN** `gc_phase` reads 0 and `gc_collection_count` increased by one

### Requirement: Hybrid write barrier
While a heap is marking, a store that overwrites a pointer slot inside an existing managed object of that heap SHALL be preceded by the hybrid barrier `beskid_rt_v5_gc_write_barrier(slot, value)`, which SHALL shade the value currently in `slot` (Yuasa deletion half) and SHALL shade `value` (Dijkstra insertion half), each when it is non-null, and SHALL do nothing when the calling thread's heap is not marking. The deletion half is the correctness argument: with the root snapshot at mark start and allocation in black it keeps every object reachable at mark start alive to the end of marking (snapshot at the beginning). The insertion half SHALL be kept so that a store never creates an edge from a black object to a white object, which makes the termination rescan a check that finds no new object. The barrier SHALL NOT allocate, collect, perform mark or sweep work, yield, switch fibers or trap; it is not a safepoint. Shading a null value or a value that resolves to no object of the heap (`ManagedObjectForReference` returns null) SHALL do nothing. The barrier SHALL apply to these stores: assignments to GC-managed fields and array elements in generated code (`=`, `+=` and `-=` forms), the field write of `move x.f` and of `exchange(place, move v)`, the collection mutation owner field store (`beskid_isle/src/context/calls/collections.rs:285`), `Utf8RecordAdopt` (`Runtime/Data/Utf8ViewRecord.bd:46`), and every other runtime store into an existing managed object. It SHALL NOT apply to these stores, which SHALL carry no barrier: stores into registered root slots, handle slots, `RootFrame` slots and fiber frames (the root set is shaded at mark start and rescanned at termination); stores into native memory; and initialization stores into an object allocated by the same construction before it is published (aggregate literals, array literals, closure environments through `beskid_rt_v5_closure_capture_store`, spawn argument environments, and the copy into a new array by `GrowArrayRooted`), whose old value is null and whose object is black when allocated during marking. `AbiValue` slots are registered roots, so `AbiValueInitialize`, `AbiValueClear` and `AbiValueReplaceWithBarrier` (`Runtime/Mem/AbiValue.bd:153,167,193-194`) SHALL NOT call a barrier. A runtime store that copies or moves several pointer slots inside an existing object SHALL apply the barrier to every destination slot before the copy. `gc_write_barrier(parent, child)` and `beskid_rt_v5_array_write_barrier(array, value)` SHALL keep their 0.6.0 behavior for native Mod adapters, which use them only for initialization stores.

#### Scenario: Deletion half keeps an object hidden behind a black object
- **GIVEN** objects `x` (reachable at mark start, not yet scanned) with field `f` holding the only reference to `w`, and a record `b` allocated after mark start, in a heap that is marking
- **WHEN** the program runs `b.f = x.f; x.f = null;`, drops every local that holds `w`, and the cycle completes
- **THEN** `w` was shaded by the store `x.f = null`, `w` survives the sweep, and `b.f` still reads `w`

#### Scenario: Array element overwrite during marking
- **GIVEN** a `string[]` reachable at mark start whose element 7 holds the only reference to a string `s`, and a record `b` allocated during marking
- **WHEN** the program copies element 7 into `b`, stores another string into element 7, drops its locals and the cycle completes
- **THEN** `s` survives and `b` still reads it

#### Scenario: Insertion half shades the stored value at once
- **GIVEN** a heap that is marking and a string `s` allocated before mark start whose span has not been drained
- **WHEN** the program stores `s` into a field of a record allocated before mark start
- **THEN** `gc_object_mark_state(s)` is not 0 immediately after the store

#### Scenario: Destructive read shades the moved value
- **GIVEN** a record `r` reachable at mark start with an `Option<Node>` field holding the only reference to a node `n`, in a heap that is marking
- **WHEN** the program runs `Option<Node> o = move r.f;`, stores `o` into a record allocated during marking and drops `o`
- **THEN** `n` survives the cycle

#### Scenario: Root stores carry no barrier
- **GIVEN** an `AbiValue` slot initialized, replaced and cleared while the heap is marking
- **WHEN** the operations run
- **THEN** `Runtime/Mem/AbiValue.bd` contains no barrier call, and `gc_object_mark_state` reads 2 for every payload that is still held at termination

### Requirement: Write barrier emission in generated code
From 0.6.2 ISLE lowering SHALL emit the barrier for every assignment whose target is a field (`AssignmentKind::Field`, `emit_field_assign` in `beskid_isle/src/context/aggregate.rs`) or an array element (`AssignmentKind::Index`, `emit_index_assign`) when the managed-reference fact of the assignment target node is `ManagedReferenceFact::GcManaged`, the fact that also decides managed-local rooting (`beskid_isle/src/context/roots.rs:58`) and that comes from the `managed_reference_kind` query (`beskid_queries/src/semantic_contract/queries.rs:122`). A target node without a managed-reference fact SHALL be a lowering error, not a store without a barrier. A target whose fact is `NativeOrScalar` SHALL have no barrier. The emitted sequence SHALL, before the store, load the word at the data symbol `beskid_rt_v5_gc_barrier_active` through `symbol_global`, branch on it, and call `beskid_rt_v5_gc_write_barrier(slot, value)` only in a block marked cold when it is non-zero; the store SHALL follow in the common successor block. The idle path SHALL contain no call. The barrier call SHALL NOT be followed by a `trapz` check because it returns no value. `ArrayLayout::needs_write_barrier` and the per-element `beskid_rt_v5_array_write_barrier` calls of array literal and index lowering (`aggregate.rs:75,179`, `calls/collections.rs:50,254`, `calls/checked_collections.rs:120`, `composition.rs:122`) SHALL be removed. Leaf-function root elision (`beskid_isle/src/root_elision.rs`) SHALL treat a call to `beskid_rt_v5_gc_write_barrier` as a non-safepoint call, like root registration, so a function whose only other calls are root registrations stays eligible. The comments and tests that state that collection is stop-the-world and that no barrier is emitted (`calls/collections.rs:286-289`, `spawn_arguments.rs:33`, `beskid_codegen/src/dynamic_mapping.rs:194`, `beskid_isle/tests/managed_local_roots_static.rs:35-43`, `beskid_isle/tests/collection_publication_static.rs:23`) SHALL be updated to the 0.6.2 rule. The ABI-v5 runtime manifest SHALL declare `beskid_rt_v5_gc_write_barrier` with signature `(ptr, ptr) -> unit` and the data symbol `beskid_rt_v5_gc_barrier_active` (one word), and the generated ABI JSON, C header, Rust bindings and runtime-kit allowlist SHALL agree.

#### Scenario: Managed field store is guarded
- **GIVEN** `pub type Node { Node next, i64 value }` and the statement `a.next = b;`
- **WHEN** the function is lowered
- **THEN** the CLIF loads `beskid_rt_v5_gc_barrier_active`, branches on it, calls `beskid_rt_v5_gc_write_barrier` with the field address and `b` in a cold block, and the store to `next` follows the branch

#### Scenario: Scalar field and literals carry no barrier
- **GIVEN** the statements `a.value = 1_i64;`, `Node c = Node { next: a, value: 2_i64 };` and `string[] xs = ["p", "q"];`
- **WHEN** the function is lowered
- **THEN** the CLIF contains no load of `beskid_rt_v5_gc_barrier_active` and no barrier call for these statements

#### Scenario: Index store is guarded
- **GIVEN** `xs[i] = s;` with `xs` of type `string[]`
- **WHEN** the function is lowered
- **THEN** the guarded barrier call precedes the element store and no `beskid_rt_v5_array_write_barrier` call is emitted

#### Scenario: Leaf root elision survives the barrier
- **GIVEN** a function whose only calls are root registrations and one guarded barrier
- **WHEN** module emission applies root elision
- **THEN** the root registrations are removed and the barrier call remains

### Requirement: Allocation and sweeping during a cycle
While its heap is marking, the allocator SHALL allocate black: a small object SHALL have its mark bit and scanned bit set when its slot is popped (`GcAllocSmall`, `Runtime/Mem/Gc/Allocation.bd:98-123`), and a large object SHALL have its header mark word set to black (`GcAllocLargeOnce`, `Allocation.bd:145-159`), so that the object survives the cycle and is never traced by it. Because the large-object mark word is part of the object bytes, `GcTryAlloc` SHALL return zeroed object bytes and SHALL set the black state after zeroing, and the callers that zero the bytes they receive (`Alloc`, `Allocation.bd:452`; `AllocateObject`, `Runtime/Bootstrap/Objects.bd:252`; the array allocators, `Runtime/Data/Collections.bd:63,187`) SHALL no longer clear them. While its heap is sweeping, the allocator SHALL NOT pop a slot from a span that the current cycle has not swept: each span entry SHALL record the sweep generation in which it was last swept (word at offset 248 of `BeskidSpanHeader`, inside the existing padding), the heap SHALL record the current generation, and the allocator SHALL sweep a span whose generation differs before it pops a slot from it, including the cached span of `HEAP_CURRENT_SPAN_BY_CLASS`. A span carved for a size class or a large object SHALL be stamped with the current generation. Objects allocated while sweeping are white, on swept spans, and survive. `live_bytes` SHALL increase at each allocation as today and SHALL decrease by the bytes that each swept span frees, so that it equals the 0.6.0 post-sweep value when the sweep ends without allocation in between. A new cycle SHALL NOT start until the sweep of the previous cycle has completed.

#### Scenario: Object allocated during marking survives without a root at termination
- **GIVEN** a heap that is marking
- **WHEN** the program allocates a record, stores it only into a field of an object reachable at mark start, and the cycle completes
- **THEN** the record survives, and it was not traced by the cycle

#### Scenario: Large allocation during marking keeps its black state
- **GIVEN** a heap that is marking
- **WHEN** the program allocates a 64 KiB `u8[]` through `Alloc`
- **THEN** the array's header mark word reads black after `Alloc` returns and the array survives the cycle

#### Scenario: Allocation from an unswept span sweeps it first
- **GIVEN** a heap that is sweeping and the cached span of a size class that the sweep cursor has not reached, holding dead objects
- **WHEN** the program allocates an object of that class
- **THEN** that span is swept before the slot is popped, the new object is not freed when the sweep cursor later passes the span, and `gc_heap_verify` returns true after the cycle

### Requirement: Roots during incremental marking
Mark start SHALL shade, in one step, every value in the root set: the current thread's `RootFrame` chain, every registered root slot, the suspended fiber frames of the heap (`MarkSuspendedFiberRoots`, `Runtime/Fiber/Scheduler/Core.bd:438-451`) and every handle slot, as `MarkRoots` does today (`Runtime/Mem/Gc/RootsHandles.bd:336-381`). The root set is a snapshot: stores into root slots, handle slots and fiber frames during marking SHALL carry no barrier, and a root registered or a fiber spawned during marking holds only values that were reachable at mark start or were allocated during the cycle. Mark termination SHALL rescan the same root set, including the frames of every fiber that is suspended at termination, and SHALL shade and drain what the rescan reaches. A correct barrier and allocation in black make the rescan shade nothing; the runtime SHALL count the objects the rescan shades in the cycle statistics. Construction temporaries SHALL stay rooted through their handle until publication, as in 0.6.0.

#### Scenario: Suspended fiber holds the only reference
- **GIVEN** a fiber that holds the only reference to a list of 10,000 nodes in a local and is suspended in `Fiber.Yield` when a cycle starts
- **WHEN** another fiber allocates until the cycle completes and the first fiber then reads every node
- **THEN** every node is intact and the termination rescan shaded no object

#### Scenario: Root registered during marking
- **GIVEN** a heap that is marking and a value `v` loaded from a field of an object reachable at mark start
- **WHEN** the program stores `v` into a newly registered local root, overwrites the field and completes the cycle
- **THEN** `v` survives, because the field overwrite shaded it

### Requirement: Per-heap collection state
Collection state SHALL be per heap: phase, mark queue, sweep cursor and generation, pacing values and statistics live in `BeskidHeapState`, whose layout in `runtime_manifest.bsol` grows by the fields `mark_trigger`, `mark_start_live`, `scan_estimate`, `scan_work_done`, `sweep_generation`, `sweep_cursor_region`, `sweep_cursor_page`, `last_cycle_max_step_bytes` and `rescan_shaded_count`, appended after `mark_fifo_tail`, with the `HEAP_*` constants of the runtime sources identical to the manifest. One heap's cycle SHALL NOT read or write another heap's phase, queue, bitmaps or headers. The process SHALL keep one word, `beskid_rt_v5_gc_barrier_active`, defined in the per-target platform support next to the TLS intrinsics (`crates/beskid_abi/assembly/<target>/`), equal to the number of heaps in the process that are marking; a heap SHALL increment it with an atomic add at mark start, before it shades the first root, and SHALL decrement it at the end of mark termination and when a cycle fails or is discarded. Generated code SHALL use the word only as a filter: `beskid_rt_v5_gc_write_barrier` SHALL check the phase of the calling thread's own heap and SHALL return without shading when that heap is not marking. A heap's own increment is ordered before its own mutator's next store by program order, so the filter never misses a store of a marking heap.

#### Scenario: The flag follows the phase
- **GIVEN** a process with one heap
- **WHEN** a test reads `beskid_rt_v5_gc_barrier_active` before `gc_cycle_start`, after it, and after the step that ends mark termination
- **THEN** the values are 0, 1 and 0


### Requirement: Incremental collection verification and stress mode
The runtime SHALL export `gc_heap_set_incremental_stress(word n)`. With `n > 0`, an idle heap SHALL start a cycle at every `n`-th allocation, a marking heap SHALL perform one mark step of the smallest granularity (one small span or one 8 KiB large-object chunk) at every allocation, a sweeping heap SHALL sweep one span at every allocation, and every mark termination SHALL run `GcHeapVerify` and a closure check, which walks every marked object and fails when a pointer field resolves to an object of the heap that is not marked, and SHALL treat a termination rescan that shades an object as a verification failure. A verification failure in stress mode SHALL trap with code 10 (`runtime_internal_corruption`) and a message that names the check. `n == 0` SHALL disable the mode. `gc_heap_set_stress_interval` SHALL keep its 0.6.0 meaning (a complete collection before every `n`-th allocation), completing an in-progress cycle first. The runtime SHALL export the test-only `gc_object_mark_state(pointer) -> word` (0 white, 1 shaded and not traced, 2 traced or allocated black, for the object the pointer resolves to) and the fault-injection hook `gc_heap_force_barrier_skip(word enabled)`, which makes `beskid_rt_v5_gc_write_barrier` return without shading, so that tests can prove that the stress checks detect a missing barrier. `GcHeapVerify` SHALL accept a heap in any phase: during marking it SHALL also check that every black slot's span is not queued with unscanned black bits and that the large-object scan cursor is within the object, and during sweeping that every span with the current generation has mark and scanned bitmaps clear.

#### Scenario: Stress mode runs the corelib collection tests clean
- **GIVEN** a fixture that sets `gc_heap_set_incremental_stress(1)` and runs a workload of `List`, `Map` and string building with 100,000 operations
- **WHEN** the workload completes
- **THEN** no trap occurred, at least 100 cycles completed, and the results equal those of the same workload without stress

#### Scenario: Stress mode detects a missing barrier
- **GIVEN** the deletion-half scenario of "Hybrid write barrier" run with `gc_heap_set_incremental_stress(1)` and `gc_heap_force_barrier_skip(1)`
- **WHEN** the cycle reaches termination
- **THEN** the process exits with status 101, standard error contains `runtime_internal_corruption (10)` and the name of the closure check (the edge from `b` to the white `w`), and the same fixture without the hook passes
