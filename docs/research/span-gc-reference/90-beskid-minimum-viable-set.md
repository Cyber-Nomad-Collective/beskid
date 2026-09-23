# 90. Minimum viable component set for Beskid v0.5

Part of the [span GC component reference](README.md). This document summarizes the "Beskid adaptation" sections of [01](01-address-space-and-pages.md) through [13](13-debugging-and-verification.md) into one decision list.

## Context

Beskid's runtime: one OS thread per runtime instance with cooperative fibers (`Runtime.Fiber.Scheduler.*`); JIT (Cranelift) and AOT sharing one ABI (`beskid_rt_v5_*` helpers, `gc_register_root`/`gc_unregister_root`); every managed object has a type-descriptor header word; stop-the-world mark-sweep over a chain of bump/free-list regions (`Runtime.Mem.Gc.*`); explicit root registration into a fixed 4095-entry array with linear-search dedupe; a 512-entry host handle table; a Dijkstra write barrier that never fires because collection is STW; typed out-of-memory traps.

The measurable problems with the current design are: O(regions) heap membership on every marking step; O(objects x passes) marking with no work list; O(roots) cost per root registration and unregistration; a sweep that touches every object and coalesces; a barrier call per managed store that does nothing.

The goal is a correct non-moving span collector that fixes those costs and whose data structures can later grow Green Tea batching, lazy sweep, in-span heap bits, and stack maps without ABI churn.

## Essential for correctness (in dependency order)

| # | Component | Decision | Document |
|---|-----------|----------|----------|
| 1 | Pages and arenas | 8 KiB logical pages; 4 MiB aligned arenas; single-level arena map; per-arena `spans[]` table; free-page bitmap with first-fit over 64-bit words; `spanOf`, `spanOfHeap`, `findObject` with Go's semantics; `pageMarks`. | [01](01-address-space-and-pages.md) |
| 2 | Size classes | Generated table (about 45 classes) with `divMagic`; span classes carry a `noscan` bit from the descriptor. No tiny allocator. | [02](02-size-classes.md) |
| 3 | Span record | `base, npages, elemsize, nelems, divMul, freeindex, allocCache, allocBits, gcmarkBits, allocCount, spanclass, state, needzero, limit, specials`; inline bitmaps; two-state swept flag; publication order kept. | [03](03-spans.md) |
| 4 | Allocator | `current[class]` plus `partial[class]`/`full[class]`; `ctz` fast path; lazy zeroing; large objects on their own spans; trigger test at span refill; `beskid_rt_v5_managed_object_allocate` unchanged. | [04](04-allocation.md) |
| 5 | Pointer maps | Descriptor header stays; `typePointers`-style iterator with array tiling; drop the per-object mark word; interior pointers through `findObject`. | [05](05-pointer-maps.md) |
| 6 | Roots | Growable per-fiber root stacks with O(1) push and truncate-to-depth; static global root table; handle table as a root array. No conservative scanning. | [06](06-roots-and-stack-maps.md) |
| 7 | Marking | STW, precise; span bitmaps; noscan fast track; Green Tea single-threaded: per small span `marks`/`scans` and `owned` byte, FIFO span ring, `marks &^ scans` at dequeue, single-object shortcut; LIFO object stack for headered/large objects. | [07](07-marking-green-tea.md) |
| 8 | Sweep | Eager at cycle end: free span if `pageMarks` clear, else bitmap swap plus popcount; rebuild class lists; `needzero` on free. | [09](09-sweeping.md) |
| 9 | Trigger | `trigger = max(minHeap, live x (1 + GOGC/100))`; soft goal near the cap; hard cap kept. | [10](10-pacing-and-growth.md) |
| 10 | OOM | Typed exhaustion trap kept; diagnostic record extended with span-level facts. | [12](12-out-of-memory.md) |
| 11 | Verification | Post-cycle heap verifier under a test flag; poison on free; collect-every-N stress mode; per-cycle trace line. | [13](13-debugging-and-verification.md) |

Write barriers ([08](08-write-barriers.md)) and finalization ([11](11-finalization-and-weak-refs.md)) are not in the essential set: the STW design needs no barrier, and no consumer needs finalizers or weak references.

## Simplifications relative to Go, and why they are safe

- No `mcache`/`mcentral` split, no `acquirem`, no publication barriers, no lock-free span sets: one OS thread.
- No `sweepgen` five-state protocol, no background sweeper, no proportional sweep credit: eager sweep in the pause.
- No write barrier, no barrier buffer, no allocate-black: the mutator never runs during marking.
- No distributed termination, no workers, no assists, no pacer runway or PI controller: STW single-threaded marking terminates when both queues are empty, and the cost model reduces to GOGC.
- No atomics in Green Tea bit operations, no SPMC chain, no steal mask: one marker.
- No conservative scanning, no unsafe-point tables, no stack-object records: cooperative fibers stop only at known points and roots are explicit.
- No radix-tree page allocator, no scavenger, no huge pages: small heaps, one thread.

## Optimizations to defer (in suggested order)

1. Lazy sweeping driven by `refill`, with a per-refill budget ([09](09-sweeping.md)).
2. In-span heap bits and header-free small objects, which unlock Green Tea's dense path ([05](05-pointer-maps.md)).
3. The SIMD dense scan kernel; oblets ([07](07-marking-green-tea.md)).
4. Compiler-emitted stack maps via Cranelift user stack maps, behind a flag with a cross-check mode ([06](06-roots-and-stack-maps.md)).
5. Releasing entirely free arenas to the OS ([01](01-address-space-and-pages.md)).
6. Cleanup and weak-handle specials when a consumer exists ([11](11-finalization-and-weak-refs.md)).
7. Incremental marking with an inlined barrier, only if pause times demand it ([08](08-write-barriers.md)).

## Open decisions

1. **Root finding: growable root stack now, stack maps later.** Explicit root stacks are correct, ABI-stable across JIT and AOT, and trivially per-fiber; their cost is a store per rooted binding and scope-based rather than use-based liveness. Compiler stack maps remove the mutator cost and give liveness-precise roots but require safe-point annotation at every call in ISLE, a Cranelift-frame unwinder in the runtime, per-fiber saved contexts the unwinder can start from, identical map formats from JIT and AOT, and a liveness test suite. Recommendation: ship v0.5 on a growable root stack with O(1) push and truncate; prototype Cranelift stack maps behind a flag with a cross-check that every stack-map root is on the root stack and that reports root-stack entries the map says are dead. Switch on measurement.
2. **Header-full or header-free small objects.** Keeping the descriptor header for every object is Go's over-512-byte design applied uniformly; it preserves the ABI (`aggregate_static.rs` pointer-map offsets, arrays at +24). Header-free small objects with in-span heap bits save 8 bytes per object and enable SIMD scanning but change the layout codegen sees. Recommendation: header-full for v0.5; the span class still carries `noscan` so pointer-free objects are never scanned.
3. **Inline marks in the span page or a side bitmap.** Inline `marks`/`scans` cost 128 bytes per one-page span and keep marking cache-local; side bitmaps keep pages pure data and are simpler for multi-page and large spans. Recommendation: Go's split, inline for one-page small-object spans, side bitmaps otherwise.
4. **Eager or lazy sweep at first release.** Eager is simplest and its pause is bounded by span count; lazy spreads cost but adds the "never allocate from an unswept span" invariant to every allocation path. Recommendation: eager for v0.5, lazy as the first optimization.
5. **Fiber stacks are not scanned; boundary crossings must root.** With a root stack per fiber, every managed value crossing a fiber boundary (`fiber_join_value`, channels, `beskid_rt_v5_abi_value_*`) must be rooted by the transfer code, as `Runtime.Mem.AbiValue` already does with `GcRegisterRoot`. This must be stated as a normative invariant in the OpenSpec runtime capability before observable behavior changes (AGENTS.md: update the spec before behavior changes).
6. **Where the collector runs.** Collecting from inside an arbitrary fiber's allocation is safe in STW because all other fibers are suspended at cooperative points, but the collector must use an explicit work stack (no recursion) and must not run on a small fiber stack; Go runs `gcMark` on g0 for the same reason. Decide whether the scheduler switches to the runtime's own stack for collection or whether fiber stacks are guaranteed large enough.
7. **GOGC default and minimum heap.** Go's defaults are 100 and 4 MiB; Beskid's current minimum threshold is 512 KiB. A smaller minimum means more cycles in small programs (Go added a 512 KiB experiment for exactly this trade-off). Recommendation: 100 and 1 MiB, tunable through the runtime manifest.

## What "done" looks like for the essential set

- `spanOf` and `findObject` replace `HeapContains`/`IsAllocatedObject`; no region walk remains.
- `ProcessGrayStack` is replaced by a work-list marker with span bitmaps; the per-object mark word is gone from the layout.
- `GcRegisterRoot`/`GcUnregisterRoot` are O(1) and the 4095-entry limit is gone.
- `gc_write_barrier` is no longer emitted for the STW collector.
- The heap verifier and the collect-every-N stress mode pass on the engine, ISLE, and AOT test suites.
- The OpenSpec runtime capability states the span layout, the root-stack invariant for fiber boundaries, the GOGC rule, and the exhaustion contract.
