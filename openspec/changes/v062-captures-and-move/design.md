# Design: `[Captures]`, `move` and the alias discipline (0.6.2)

Paths are relative to `compiler/` unless they start with `openspec/`, `docs/` or
`corelib/`. Vocabulary (transfer classes, marker names, diagnostic codes,
owning name, borrowed name, owned expression, consuming use, Moved place,
canonical empty value) is defined in
`openspec/changes/v061-attributes-and-isolate-prerequisites/design.md`,
section "Shared vocabulary", and is used here without redefinition.

## Grounding

### Captures

- `closure_captures` records one `ClosureCapture {declaration, slot, class, span}`
  per outer declaration a lambda reads
  (`crates/beskid_queries/src/semantic_contract/closures_spawn/closures.rs:191-229`).
- `CaptureStorageClass` is binary, `TransferableValue | StackReference`
  (`semantic_contract/model/closures.rs:148-151`); a `mut` local or a non-managed
  `pointer` is a `StackReference` (`closures.rs:258-278`). The word
  "transferable" there means "safe to snapshot by value", not the isolate class.
- E1233 is a legality fact of `check_items` over non-spawn lambdas
  (`semantic_contract/legality/captures.rs:1-42`); spawn operands get E1225
  (`closures_spawn/fiber_ownership.rs:61-73`, `closures_spawn/spawn.rs:195-220`).
- Lambdas are typed by expected type (`closures_spawn/function_values.rs:14-18`),
  so a corelib `Spawn<T>(() => T body)` types its lambda argument.
- Function items as values have no environment (`FunctionItemValue`,
  `function_values.rs:10-13`).
- Attribute arguments are `Identifier ":" Expression` (`beskid.pest:272`), so
  the capture bound is spelled `[Captures(Bound: Transferable)]`.

### The Fiber-only affine analysis

`spawn_handle_diagnostics` (`fiber_ownership.rs:171-303`):

- seeds owners from `Parameter` and `LetStatement` nodes whose type is the
  corelib `Fiber` (`fiber_owner_seed`, lines 129-169; a `spawn` initializer, a
  `Fiber` annotation or a call returning `Fiber<_>` qualify);
- walks every `PathExpression` use in source order (lines 220-236);
- records, for each consuming use, the `if` branch path from the use to the
  callable, and reports `UseAfterMove` when a prior consumption lies on a path
  that is not an alternative arm (lines 238-271);
- treats a use inside a loop whose declaration precedes the loop as a repeated
  move (lines 259-266), and a use inside a non-spawn lambda as repeated;
- `Cancel` is the one non-consuming method (lines 270-276);
- `let y = x` transfers ownership to `y` (lines 280-299).

The rendering is `SpawnDiagnosticKind::UseAfterMove` through
`legality/gate/control.rs`. No `move` keyword exists: `beskid.pest:445` allows
only `-` and `!` as prefixes; `Keyword` at line 68 lists no `move`.

### Fields, assignment, places

Assignment targets are paths with member access and subscripts
(`legality/values.rs:509-523`); `AssignExpression` has `=`, `+=`, `-=` forms
(`beskid.pest:430`, Pony doc D4). Fields have no mutability modifier. The
receiver `this` is a resolver-inserted local
(`resolve/resolve_refs/items_statements.rs:58`); 0.6.1 adds the explicit
`ReceiverParameter` production that this change extends with `move this`.

### Corelib collections

`List<T>.Push` returns a new record over storage that `Storage.AppendAt<T>`
grows in place when `Array.Len<T>(storage) == logicalEnd`
(`corelib/packages/foundation/src/Core/Collections/List.bd:24-27`,
`Storage.bd:10-15`): two live `List<T>` values can share one `T[]`. The same
shape appears in `Stack.Push/Pop` (`Stack.bd:19-24`), `Queue.Enqueue/Dequeue`
(`Queue.bd:20-25`), `Set.Add` (`Set.bd:29`), `Map.Insert` (`Map.bd:23`),
`PriorityQueue.Push/Pop` (`PriorityQueue.bd:43-48`), `I64Map.Insert`
(`I64Map.bd:39`), `StringMap.Insert` (`StringMap.bd:39`) and the free function
`HashTable.Insert` (`HashTable.bd:138`). `Array.Append<T>(mut T[] values, T value)`
(`Array.bd:80`) grows in place; `Array.Set<T>(T[] values, ...)` writes in place
through a non-`mut` parameter (`Array.bd:60-63`).

### Specification constraints

- Closures may not capture `mut` bindings
  (`openspec/specs/language-meta--evaluation--lambdas-and-closures/spec.md:18-24`,
  as modified by `v06-function-values`); this change copies the
  `v06-function-values` text as its base because 0.6.0 ships before 0.6.2.
- `StackReferenceEscapesSpawn` is normative
  (`language-meta--evaluation--fibers-and-spawn/spec.md:43-55`).
- Keywords are reserved by the `Keyword` production
  (`language-meta--surface-syntax--lexical-and-syntax/spec.md:18-25`).

### Collector (incremental marking)

Runtime paths are under `runtime/beskid/src/Runtime/`.

- `GcCollect` (`Mem/Gc/Collection.bd:149-173`) sets `GC_PHASE_MARKING`, calls
  `MarkRoots` and `ProcessMarkWork`, then `Sweep`, inside one call; the
  threshold becomes `max(2 * live, 512 KiB)` (`:166-170`).
  `GcCollectIfNeeded` (`:175-184`) collects when live bytes reach it.
- `GcWriteBarrier(parent, child)` (`Collection.bd:36-46`) shades only `child`
  and only while the phase is marking. Runtime callers:
  `AbiValueInitialize`/`AbiValueClear`/`AbiValueReplaceWithBarrier`
  (`Mem/AbiValue.bd:153,167,193-194`, which already shade old and new),
  `Utf8RecordAdopt` (`Data/Utf8ViewRecord.bd:46`) and `ArrayWriteBarrier`
  (`Data/Collections.bd:233-240`), which passes the array object.
- `GcMarkGray` (`Mem/Gc/Marking.bd:110-144`) sets a small object's span mark
  bit and enqueues the span (`EnqueueSpan`, `:77-92`); a large object only gets
  its header word set gray (`:127-133`) and is found again by
  `ProcessLargeObjectsOnce` (`:217-241`), a pass over every region's span
  directory. `DrainSpan` (`:194-211`) scans marked-and-unscanned slots;
  `ProcessMarkWork` (`:247-264`) loops until both are quiescent, with no budget.
- `MarkRoots` (`Mem/Gc/RootsHandles.bd:336-381`) shades the current
  `RootFrame` chain (`tls + 8`), the root stack, suspended fiber frames
  (`MarkSuspendedFiberRoots`, `Fiber/Scheduler/Core.bd:438-451`, frames at
  `FiberRecord + 80`) and the handle stack, without tracing.
- `GcTryAlloc` (`Mem/Gc/Allocation.bd:339-398`) runs `GcCollect` for stress
  mode before the allocation (`:353-355`), when a refill fails at the threshold
  (`:358-367`) and when growth hits the cap (`:368-379`). `GcAllocSmall`
  (`:98-123`) pops a free slot from the cached span; `GcAllocLargeOnce`
  (`:145-159`) carves a dedicated span. `Alloc` zeroes the whole object after
  `GcAlloc` returns (`:452`), as do `AllocateObject`
  (`Bootstrap/Objects.bd:252`) and the array allocators
  (`Data/Collections.bd:63,187`); the large-object mark word at offset 8 is part
  of those bytes.
- `Sweep` (`Mem/Gc/Sweep.bd:59-112`) walks every span once, swaps the
  allocation bitmap for the mark bitmap, rebuilds free lists, frees empty spans,
  resets black large objects to white and coalesces each region.
- `BeskidSpanHeader` (`Mem/Gc/Span.bd:17-30`) uses 248 bytes padded to 256;
  the word at 248 is free. A large span does not use its mark bitmap words.
  `BeskidHeapState` is 328 bytes (`Mem/Gc/State.bd:40`), last field
  `mark_fifo_tail` at 320.
- Stress mode: `GcHeapSetStressInterval`/`StressShouldCollect`
  (`Mem/Gc/Verify.bd:135-176`) force a full collection every `n`-th
  allocation. `GcHeapVerify` (`Verify.bd:112-133`) checks span bookkeeping only.
  Fixtures call these through an `[Extern(Abi:"C")]` contract
  (`crates/beskid_engine/tests/fixtures/heap_growth.bd`, driven by
  `crates/beskid_engine/tests/native_kit/heap_growth_native.rs`).
- `FiberYield` (`Fiber/Scheduler/Core.bd:455-473`) changes fiber state and
  switches context; it does no GC work.

Codegen side (`crates/` paths):

- `ManagedReferenceFact {NativeOrScalar, GcManaged}`
  (`beskid_isle/src/facts/operations.rs:65-68`) is filled from the
  `managed_reference_kind` query
  (`beskid_queries/src/semantic_contract/queries.rs:122`, `ManagedReferenceKind`
  in `semantic_contract/model/types.rs:25`) through
  `beskid_codegen/src/isle_adapter/facts_node/types.rs:56-61`. It decides
  managed-local rooting (`beskid_isle/src/context/roots.rs:58`).
- `emit_field_assign` (`beskid_isle/src/context/aggregate.rs:270-296`) stores
  with no barrier; `FieldLayout` has only `value_type` and `offset`
  (`beskid_isle/src/layout.rs:51-54`). `emit_index_assign` (`aggregate.rs:133-190`)
  and array literals (`aggregate.rs:33-90`) call
  `beskid_rt_v5_array_write_barrier` after the store when
  `ArrayLayout::needs_write_barrier` (`layout.rs:31-33`) holds; the same call is
  in `calls/collections.rs:50,254`, `calls/checked_collections.rs:120` and
  `composition.rs:122`.
- The collection mutation owner field store
  (`beskid_isle/src/context/calls/collections.rs:285-289`), spawn argument
  environments (`spawn_arguments.rs:33-37`) and dynamic mapping records
  (`beskid_codegen/src/dynamic_mapping.rs:194`) state that collection is
  stop-the-world and emit no barrier. Closure captures are stored through
  `beskid_rt_v5_closure_capture_store` (`calls/closures.rs:46-62`,
  `Bootstrap/Objects.bd:271-291`) into a fresh environment.
- Leaf root elision (`beskid_isle/src/root_elision.rs:1-44`) relies on "a
  collection runs only inside a runtime call"; any call other than root
  registration disables it.
- Data symbols reach generated code through `symbol_global`
  (`beskid_isle/src/context/calls/helpers.rs:6-14`). The TLS intrinsics are C
  in `beskid_abi/assembly/<target>/platform_tls.c`.
- Native Mod adapters use `gc_write_barrier` and
  `beskid_rt_v5_array_write_barrier` for construction stores
  (`beskid_codegen/src/native_mod/producer.rs:596-597`,
  `native_mod/c_codec.rs:107-108,510`).
- Canonical artifacts link the hash-verified runtime kit statically
  (`beskid_aot/src/runtime.rs:36-48`).

Specification and prior design:

- D-EXEC-RT-0006 says 0.6.0 is non-incremental and generated code does not
  call `gc_write_barrier` for field stores; "Span-queued marking and per-span
  sweep" repeats it with the scenario "No write-barrier call is emitted for a
  managed field store" (`openspec/specs/execution--runtime--memory-and-gc-runtime-contract/spec.md:28-47,128-146`).
  GC-002 in that file's informative provenance ("pointer stores must lower to
  `gc_write_barrier` when concurrent marking is enabled") becomes true again.
- `docs/superpowers/specs/2026-09-22-gc-span-heap-design.md` sec. 6.3 removed
  the barrier calls for the stop-the-world collector and kept the export "so
  re-enabling an incremental collector later needs no ABI change"; the
  deferred list names "Concurrent/incremental marking with a Dijkstra-Yuasa
  hybrid barrier" (line 652).
- `docs/research/span-gc-reference/08-write-barriers.md`, "Beskid
  adaptation", lists the requirements for a later incremental collector: an
  inlined flag test with an out-of-line slow path, both shades or a deletion
  barrier with root rescan, allocation in black, and an argument for root
  stacks.

## Rationale

- `[Captures(Bound: C)]` is Spores (Miller, Haller, Odersky, ECOOP 2014): only
  a closure literal exposes its captures, so only a literal (or an
  environment-free function item) is accepted where a bounded closure is
  required (E1238). Cloud Haskell static pointers (Epstein, Black, Peyton
  Jones, Haskell 2011) are the function-item case. The rule composes the
  existing capture facts with `transfer_class`; it is not a Mod analyzer
  because `Semantic.bd` exposes no capture facts (ruling 13).
- D1, the full alias discipline: per-binding consumption is not enough for
  pointer hand-over. Pony's `iso` is sound because every alias-creating
  operation either consumes the source or yields a `tag` (Clebsch et al.,
  AGERE 2015, sec. 2); the three counterexamples in today's Beskid are a field
  alias before the move, `List<T>.Push` sharing storage, and callee retention
  (Pony doc 2.3). Haller and Odersky (ECOOP 2010) give the borrowed-reference
  form adopted here: stores, owning passes, returns and captures consume; reads
  borrow and borrows do not escape. Clarke and Wrigstad (ECOOP 2003) justify
  internal aliasing inside a Moved graph (external uniqueness).
- D2, `move` as a modifier not an attribute: ownership changes the calling
  contract and should read like `mut`.
- D3, owning receivers on self-returning collection methods: keeps the fluent
  linear style the doc comments already promise (`List.bd:3-4`) and ends
  storage sharing between two live values. In-place mutators on `mut this` were
  the rejected alternative.
- D4, destructive read: `move x.f` only where a canonical empty exists, because
  another alias of `x` may read `x.f` afterwards (Pony tutorial, Consume and
  Destructive Read); `exchange` replaces Pony's "assignment returns the old
  value" because Beskid assignment has `+=`/`-=` forms and a silent value
  change would be a trap.
- Branch-aware, loop-conservative flow: reuses `fiber_ownership.rs` verbatim
  for branches and loops; the conservative loop rule may reject legitimate code,
  which Fibers already accept today (REQ 3.2, risk note).
- ORCA preconditions (ruling 6 amended, 0.6.2 line): ORCA (Clebsch et al.,
  OOPSLA 2017) is sound under I1 (one writer excludes all other readers and
  writers) and I2 (immutability is deep and persistent). `[Immutable]` supplies
  I2 (`val`); the alias discipline supplies I1 for Moved graphs (`iso`): after a
  consuming use no name in the sender reaches the graph. Stating both here lets
  0.6.3-0.6.5 change only the runtime.

### Incremental marking

- Correctness argument. Dijkstra et al. (CACM 21(11), 1978,
  https://doi.org/10.1145/359642.359655) define the tri-color abstraction and
  the insertion barrier, which keeps the strong invariant (no black-to-white
  edge) but leaves roots gray, so a collector must rescan roots at the end.
  Yuasa (J. Systems and Software 11(3), 1990,
  https://doi.org/10.1016/0164-1212(90)90084-Y) gives snapshot at the
  beginning: scan roots atomically at the start, shade every overwritten
  pointer, allocate black; every object reachable at the snapshot is then
  marked. A Beskid heap has one mutator thread and cooperative fibers, so the
  whole root set (root stack, handles, current `RootFrame` chain and every
  suspended fiber frame) is shaded in one step at mark start, and Yuasa's
  argument applies directly: root stores need no barrier, and a value that a
  root receives during marking was reachable at the snapshot or was allocated
  black.
- Why both shades. The Go hybrid barrier (Clements and Hudson, proposal 17503,
  2016, https://github.com/golang/proposal/blob/master/design/17503-eliminate-rescan.md)
  shades the old value always and the new value while the current stack is
  gray; Go runs both unconditionally. Beskid has no gray running stack, so the
  insertion half is not needed for soundness. It is kept for three reasons:
  the runtime's own barrier already shades the new value (`Collection.bd:43`)
  and `AbiValueReplaceWithBarrier` shades both, so one barrier semantics
  replaces two; v065's receiver stores into foreign mutable objects
  (`execution--runtime--isolates-and-transit`, "Moved hand-over at receive")
  rely on the barrier shading the child; and with both halves no store creates
  a black-to-white edge, so the termination rescan and the stress-mode closure
  check have an exact oracle (they find nothing in a correct runtime). The
  cost is one extra `GcMarkGray` per barriered store, only while marking.
- Simpler choices rejected. Dijkstra only with a final rescan (the
  `08-write-barriers.md` table, row 2) needs no deletion half, but the final
  rescan must then trace everything that roots acquired during marking in one
  unbounded termination pause, the problem proposal 17503 measured at "10's to
  100's of milliseconds" in Go. Yuasa only is sound here but makes the
  termination rescan a check without an exact oracle and changes the barrier
  semantics that v065 already specified.
- Barrier placement. The barrier runs before the store and reads the old value
  from the slot, as Go's buffered pre-write barrier does (`mbarrier.go`,
  `mwbbuf.go`, summarized in `08-write-barriers.md`). The inline filter is a
  load of one process word and a branch to a cold block, the
  "single-flag test with an out-of-line slow path" of the same note; Beskid has
  no generated TLS access (the TLS intrinsic is a C call), so the filter is a
  process-wide count of marking heaps and the slow path checks the calling
  heap's own phase. One heap's own increment precedes its own stores in
  program order, so the filter cannot miss them; another heap's marking only
  costs a call that returns.
- Initialization stores. A store into an object that the same construction
  allocated overwrites null (nothing for the deletion half) and, during
  marking, writes into a black object a value that the snapshot argument
  already covers. Go elides barriers for the same case. Keeping these stores
  barrier-free keeps array literals and closure environments as cheap as in
  0.6.1 and removes the unconditional `beskid_rt_v5_array_write_barrier` call
  per element that 0.6.1 executes even when idle.
- ISLE fact. `ManagedReferenceFact::GcManaged` on the assignment target is the
  existing source-proven classification that already decides rooting; using it
  for barriers gives one authority, and a missing fact fails closed.
  `ArrayLayout::needs_write_barrier` (pointer-typed and not proven scalar) is
  weaker and goes.
- Pacing. Baker (CACM 21(4), 1978, https://doi.org/10.1145/359460.359470)
  ties collector work to allocation so a cycle ends before memory runs out; Go
  does the same with assists (`gcAssistAlloc`, `runtime/mgcmark.go`) and starts
  the cycle 70-95% of the way from live heap to goal
  (`runtime/mgcpacer.go:1170-1180`, `10-pacing-and-growth.md`). Beskid has no
  background worker, so all marking is assist work and the trigger sits halfway
  (`threshold - threshold/4` with `threshold = 2 * live`, so 1.5 times live):
  with scan estimate equal to last live bytes, the assist rate is about two
  traced bytes per allocated byte and the cycle normally ends before the
  0.6.0 threshold. Steps are charged at span refills and large requests,
  which the pacing requirement already names as pacing points, so the
  free-slot fast path stays O(1). `FiberYield` steps cover fibers that run
  without allocating.
- Bounded steps. Green Tea (Go issue 73581,
  https://github.com/golang/go/issues/73581; `07-marking-green-tea.md`) makes
  the span the unit of mark work, which gives a natural step boundary (one
  8 KiB page). Large objects join the same FIFO and are traced in 8 KiB
  chunks with a cursor in the span entry's unused mark bitmap, so neither the
  directory pass of `ProcessLargeObjectsOnce` nor a single huge array can
  exceed the step bound.
- Sweep. Lazy sweeping before allocation (Hughes, 1982, "A semi-incremental
  garbage collection algorithm", Software: Practice and Experience 12(11); Go
  `mspan.sweepgen`, `09-sweeping.md`) lets the mutator run while garbage is
  still in unswept spans; the per-span generation word in the header padding
  is Go's `sweepgen` reduced to one heap and one thread. A new cycle waits
  for the sweep to finish, as in Go.
- Allocation in black and zeroing. Allocating black is the Yuasa rule and
  Go's `gcmarknewobject`. Moving zeroing into `GcTryAlloc` is required because
  three callers clear the large-object mark word after the allocator returns.
- ORCA under incremental marking. D8 and D9 hold unchanged in substance. Each
  heap's cycle stays private (D9: the receiver writes only its own tables). Two
  events that 0.6.3-0.6.5 place "during marking" now also happen between mark
  steps, so they get the allocation-in-black treatment: a foreign entry created
  or incremented while marking is stamped with the current epoch, and a
  mutable entry created while the owner is marking is shallow-marked by the
  sender before publication (else a span queued earlier could be drained while
  the receiver writes, violating I1). Adoption while the parent is marking
  adopts black; adoption while it is sweeping stamps the parent's generation.
  These are edits to the ADDED requirements of v063, v064 and v065, not new
  chain links.
- ABI. Every existing ABI-v5 export keeps its signature and meaning;
  `beskid_rt_v5_gc_write_barrier` and `beskid_rt_v5_gc_barrier_active` are
  appended (ABI-005 of D-EXEC-ABI-0002). The semantic that 0.6.1 lowering
  relied on (no marking between allocation calls) does change; see open
  issue 9.

## Open issues

1. `Array.Set<T>(T[] values, ...)` mutates through a non-`mut` parameter, so a
   borrow can mutate array contents. This is permitted by the discipline (a
   borrow may read and mutate); it is listed because it means "borrowed" does
   not mean "read-only", and documentation must say so.
2. The loop rule is syntactic. A Moved value consumed in a loop body and
   reassigned later in the same body on every path is accepted; a reassignment
   under a condition is not analyzed and the consume is E1240. This matches
   the Fiber behavior today and may be refined later.
3. `exchange` is a builtin with a place operand; the grammar has no place
   category, so the first argument is restricted syntactically to a path with
   at least one member access or subscript, and the semantic rule checks it is
   assignable.
4. `move this` on a collection method changes every caller that reads the
   receiver after the call (`List<T> l2 = l.Push(x); l.Count()` becomes
   E1234). Corelib and the Book examples must be migrated in the same change;
   no compatibility path is kept (no users yet).
5. The 0.6.1 `ReceiverParameter` production is extended here with the
   `MoveKeyword` alternative; if 0.6.1 ships without the production, this
   change adds it whole.
6. E1247 from the Pony doc's proposal ("method on an `[Isolated]` type returns
   `this` or a Moved field from a borrowed receiver") is subsumed by E1241
   (borrow escapes) and was reallocated in 0.6.1 to the marker field class
   rule. The Pony doc's table is therefore not followed one to one for E1247.
7. Mark start shades the whole root set in one step, so its pause grows with
   the number of roots and suspended fibers, not with the heap. A later release
   may scan suspended fiber frames lazily, before each fiber resumes; that is
   Go's black-stack argument and also requires revisiting the initialization
   store exemption, because a gray stack could then store into a black new
   object.
8. The 32 KiB, 256 KiB, 8 KiB and 32-span constants and the trigger at
   three quarters of the threshold are starting values. Task 9.5 records step
   time distributions; changing a constant needs no spec change only if the
   bounds in the requirement text still hold, so the constants are stated in
   the requirement.
9. D-EXEC-ABI-0002 asks for a version bump when "semantics relied on by
   lowering" change. The ruling recorded on 2026-10-13 keeps ABI version 5:
   every existing export keeps its semantics, the new symbols are additive,
   canonical artifacts link the exact hash-verified kit
   (`beskid_aot/src/runtime.rs:36-48`), so no artifact of the 0.6.1 compiler
   can run on the 0.6.2 collector, and there are no users. The Glue shared
   provider (`GlueSharedProviderV1`) is resolved from the same installed
   prefix; task 8.10 adds a test that a provider from another kit is rejected.
10. Native Mod adapters keep `gc_write_barrier(parent, child)` and
    `beskid_rt_v5_array_write_barrier` for construction stores only. An
    adapter that overwrites a pointer in an existing object must use
    `beskid_rt_v5_gc_write_barrier`; task 8.7 audits the C codec and dynamic
    mapping emitters for such stores.
11. The two-heap case of the barrier filter (another heap marking, the
    calling heap idle) cannot be exercised in 0.6.2, which has one runtime
    instance; v063's isolate tests cover it.
