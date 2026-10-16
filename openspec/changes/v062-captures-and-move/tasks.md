## 1. Spec

- [x] 1.1 Validate with `openspec validate v062-captures-and-move --strict` and regenerate `openspec/catalog.json`.

## 2. Grammar and syntax

- [x] 2.1 `MoveKeyword` in `Keyword`; `MoveExpression` as a `UnaryExpression` alternative; `move` on `Parameter`; `ReceiverParameter` with `mut`/`move`; syntax model nodes; formatter emit; semantic token. (Identifier and keyword lexical rules; move grammar productions)
- [x] 2.2 `move` modifier class check and `move this` admission, E1239 at the modifier. (Locals mut and assignment)

## 3. Captures

- [x] 3.1 `[Captures(Bound: C)]` on the callable signature fact; E1248 for non-marker bounds and non-function parameters. (Capture bounds on function-typed parameters)
- [x] 3.2 Call-site fact: lambda literal capture classes against the bound (E1235, E1236, E1237), function items accepted, other arguments E1238; `move` capture consumes. (Capture bounds on function-typed parameters)
- [x] 3.3 Ordinary lambdas borrow Moved captures and may not `move` them (E1239, E1241). (Capture and closure lifetime)

## 4. Affine analysis

- [x] 4.1 `affine_ownership` fact replacing `spawn_handle_diagnostics`: owner seeds for `Fiber` and Moved-class names, owning/borrowed classification. (Owning and borrowed names)
- [x] 4.2 `move x` expression semantics and E1239 on non-owning operands. (The move expression)
- [x] 4.3 Consuming uses, E1234 with "moved here", E1242 with "write `move`", silent `let` alias and last-use return; Fiber `Join`/`Detach`/`Cancel` mapping. (Consuming uses and use after move; Fiber handles use the general affine analysis)
- [x] 4.4 Borrow escape rule E1241 including `[Isolated]` methods returning `this` or Moved fields. (Owning and borrowed names)
- [x] 4.5 Branch arms, `match`, loops with revival, E1240. (Branch and loop rules for consumption)
- [x] 4.6 `move x.f` with canonical empties, E1243; `exchange` builtin with place check and E1239. (Destructive read of a field)
- [ ] 4.7 Memory spec text for the ORCA preconditions; no code. (ORCA preconditions)

## 5. Corelib

- [ ] 5.1 `move this` on self-returning methods of `List`, `Stack`, `Queue`, `Set`, `Map`, `PriorityQueue`, `I64Map`, `StringMap`; `move` parameter on `HashTable.Insert`; migrate corelib callers, Book chapters and surface tests. (Inline public collection methods) (implemented on v06x/lang corelib 579bfbe; collection callers unaudited by build; awaiting gate)

## 6. Diagnostics and tooling

- [x] 6.1 Emission sites for E1234–E1243 and E1248; labels and help texts; retire the Fiber-only `UseAfterMove` rendering. (Diagnostic codes owned in analysis sources)
- [x] 6.2 LSP hover (owning/borrowed, class, bound, capture list) and quick fixes inserting `move` and rewriting to `exchange`. (Code actions and diagnostic publication for IntelliSense)
- [x] 6.3 Formatter corpus with every `move`, `exchange` and `[Captures]` form. (move forms in the formatter corpus)

## 7. Evidence

- [ ] 7.1 Surface tests: positives and negatives for each of E1234–E1243 and E1248, branch and loop cases, destructive read runtime behavior (`Option::None`, empty array, empty list left behind), `exchange` old-value return, Fiber tests unchanged except the code.
- [ ] 7.2 Corelib check gate and projects suite after the collection migration; a test asserting no two live `List<T>` values can share storage.

## 8. Incremental marking for the Beskid GC

- [ ] 8.1 Cycle state machine in `Runtime/Mem/Gc/Collection.bd`: mark start (flag increment, `MarkRoots` shade only), mark step, mark termination (rescan until no new shade, flag decrement, generation advance), sweep step, idle; `gc_collect` completes the in-progress cycle and one fresh cycle; mark failure and shutdown discard. (Incremental collection cycle; Span-batched tri-color mark-sweep collection and barrier exports: Decision [D-EXEC-RT-0006]) (implemented on v06x/runtime 52fc9db1; awaiting gate)
- [ ] 8.2 Mark queue: large objects enqueued on the span FIFO from `GcMarkGray`; chunked large-object drain with the cursor in the span entry's first mark-bitmap word; remove `ProcessLargeObjectsOnce`; bounded per-span sweep step with region coalescing on leaving a region. (Span-queued incremental marking and per-span sweep) (implemented on v06x/runtime 52fc9db1; awaiting gate)
- [ ] 8.3 Pacing: `mark_trigger`, scan estimate, runway and debt at span refills and large requests; step budget clamp 32-256 KiB; completion at the threshold before growth; finish sweeping before growth; two-cycle cap-pressure retry in `GcTryAlloc`; `FiberYield` step; exports `gc_cycle_start`, `gc_mark_step`, `gc_last_cycle_max_step_bytes`. (Mark pacing and bounded steps; Heap growth pacing and committed-size cap) (implemented on v06x/runtime 52fc9db1; awaiting gate)
- [ ] 8.4 Hybrid barrier `beskid_rt_v5_gc_write_barrier(slot, value)` in `Collection.bd` (own-heap phase check, shade old then new, no allocation or mark work); runtime stores: `Utf8RecordAdopt`, any multi-slot copy into an existing object; remove the barrier calls from `AbiValue.bd:153,167,193-194`; keep `gc_write_barrier` and `beskid_rt_v5_array_write_barrier` unchanged for adapters. (Hybrid write barrier) (implemented on v06x/runtime 52fc9db1; awaiting gate)
- [ ] 8.5 Process word `beskid_rt_v5_gc_barrier_active` in `beskid_abi/assembly/<target>/` platform support for all three targets, atomic add and subtract from the runtime; ABI-v5 manifest entries for it and the new barrier; regenerate the ABI JSON, C header, Rust bindings and kit allowlist. (Per-heap collection state; Write barrier emission in generated code) (implemented on v06x/runtime 52fc9db1; awaiting gate)
- [x] 8.6 ISLE: guarded barrier before the store in `emit_field_assign` and `emit_index_assign` from `managed_reference(target) == GcManaged`, missing fact as a lowering error, cold barrier block; barrier on the collection mutation owner store (`calls/collections.rs:285`) and on the field writes of `move x.f` and `exchange`; remove `ArrayLayout::needs_write_barrier` and the array-barrier calls at `aggregate.rs:75,179`, `calls/collections.rs:50,254`, `calls/checked_collections.rs:120`, `composition.rs:122`; root elision treats the barrier as a non-safepoint call; update the stop-the-world comments and the static tests that assert no barrier. (Write barrier emission in generated code)
- [x] 8.7 Audit native Mod adapter emitters (`native_mod/c_codec.rs`, `native_mod/producer.rs`) and `dynamic_mapping.rs` for stores into existing objects; switch any found to `beskid_rt_v5_gc_write_barrier`. (Hybrid write barrier)
- [ ] 8.8 Allocation in black in `GcAllocSmall` and `GcAllocLargeOnce`; zeroing moved into `GcTryAlloc` and removed from `Alloc`, `AllocateObject` and the array allocators; span sweep generation at header offset 248, sweep-on-allocate for cached and refilled spans, carve stamping; `live_bytes` decreased per swept span; no new cycle before the sweep ends. (Allocation and sweeping during a cycle) (implemented on v06x/runtime 52fc9db1; awaiting gate)
- [ ] 8.9 Root set at mark start and termination rescan including suspended fiber frames; rescan shade count in the cycle statistics; `BeskidHeapState` fields appended in `runtime_manifest.bsol` and `HEAP_*` constants, layout test updated. (Roots during incremental marking; Per-heap collection state) (implemented on v06x/runtime 52fc9db1, f71efec2; awaiting gate)
- [ ] 8.10 Stress and verification: `gc_heap_set_incremental_stress`, closure check and rescan check at termination trapping with code 10, `GcHeapVerify` for every phase, `gc_object_mark_state`, `gc_heap_force_barrier_skip`; `gc_heap_set_stress_interval` completes an in-progress cycle first; test that a Glue shared provider from another kit is rejected. (Incremental collection verification and stress mode) (implemented on v06x/runtime 52fc9db1, 94504109; awaiting gate)

## 9. Incremental marking evidence

- [ ] 9.1 Runtime fixture `crates/beskid_engine/tests/fixtures/incremental_marking.bd` with `crates/beskid_engine/tests/native_kit/incremental_marking_native.rs`, driven by `gc_cycle_start`/`gc_mark_step`: lost-object cases for field overwrite, array element overwrite, `move x.f`, `exchange`, collection mutation owner, `Utf8RecordAdopt`; insertion-half observation through `gc_object_mark_state`; root registered during marking; suspended fiber holding the only reference; allocation in black (small and 64 KiB large through `Alloc`); allocation from an unswept span; chunked 1 MiB pointer array with overwrites before and after the cursor; mark failure discard; phase order and flag values. (Hybrid write barrier; Allocation and sweeping during a cycle; Roots during incremental marking; Incremental collection cycle; Per-heap collection state; Span-queued incremental marking and per-span sweep) (implemented on v06x/runtime 9106490f; awaiting gate)
- [ ] 9.2 Negative control: every lost-object case under `gc_heap_set_incremental_stress(1)` with `gc_heap_force_barrier_skip(1)` traps with `runtime_internal_corruption (10)`, and passes without the hook. (Incremental collection verification and stress mode) (implemented on v06x/runtime 9106490f; awaiting gate)
- [ ] 9.3 Stress workload: `List`, `Map` and string building, 100,000 operations under `gc_heap_set_incremental_stress(1)`, results equal to the unstressed run, at least 100 cycles. (Incremental collection verification and stress mode) (implemented on v06x/runtime 9106490f; asserts result equality only, no cycle-count assertion; awaiting gate)
- [ ] 9.4 Pacing fixtures: trigger without blocking growth, completion at the threshold before growth, cap-pressure two-cycle retry with `BESKID_HEAP_MAX=8m`, yielding fibers finish a cycle, the four 0.6.0 pacing scenarios unchanged. (Heap growth pacing and committed-size cap; Mark pacing and bounded steps) (implemented on v06x/runtime 94504109; awaiting gate)
- [ ] 9.5 Pause bound: 64 MiB live graph with 128 MiB churn asserts `gc_last_cycle_max_step_bytes <= 270336`; a benchmark records mark-start, step and termination wall times against the 0.6.1 full collection on the same workload, reported in the change's release notes, not gated. (Mark pacing and bounded steps; Span-batched tri-color mark-sweep collection and barrier exports: Decision [D-EXEC-RT-0006]) (open: pause-bound fixture and benchmark not written)
- [x] 9.6 CLIF tests: guarded field and index stores, no barrier for scalar fields and literals, no `beskid_rt_v5_array_write_barrier` in generated code, leaf root elision with a barrier, lowering error without a managed-reference fact. (Write barrier emission in generated code)
- [ ] 9.7 Existing runtime heap tests (`heap_growth_native.rs`), the corelib check gate and the projects suite pass unchanged with default pacing. (Span-batched tri-color mark-sweep collection and barrier exports: Decision [D-EXEC-RT-0006])
