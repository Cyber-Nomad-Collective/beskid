# 09. Sweeping

Part of the [span GC component reference](README.md). Previous: [08 Write barriers](08-write-barriers.md). Next: [10 Pacing and growth](10-pacing-and-growth.md).

## Purpose

Turn mark bits into allocation bits. Unmarked allocated slots become free, spans with no marked objects return their pages, finalizers and cleanups for dead objects are queued, weak handles are cleared, and the per-class free-span lists are rebuilt. Sweeping is where memory is actually recovered; marking only decides.

## Data structures

`sweep sweepdata` (`runtime/mgcsweep.go:33-50`): `lock`, `g` (background sweeper goroutine), `parked`, `active activeSweep` (a counter of outstanding sweepers plus a "drained" top bit, lines 118-160), `centralIndex sweepClass` (the current position in the walk over `spanClass x {partial, full}`; `numSweepClasses = numSpanClasses * 2`).

Proportional sweep state in `mheap` (`runtime/mheap.go`, `mheap` struct comment "Proportional sweep"): `pagesInUse`, `pagesSwept`, `pagesSweptBasis`, `sweepHeapLiveBasis`, `sweepPagesPerByte`. Together they define a line from `heapLive` to "pages that must have been swept by now"; the allocator "works to stay in the black by keeping the current page sweep count above this line".

Two algorithms (`runtime/mgcsweep.go:5-24`):

- The **object reclaimer** (`mspan.sweep`): per span, frees unmarked slots and possibly the whole span. Driven synchronously by `mcentral.cacheSpan` and asynchronously by `sweepone`.
- The **span reclaimer** (`mheap.reclaim`): a sequential scan of `heapArena.pageMarks` that frees whole spans with no marked object, used when allocating new spans, "because freeing whole spans is the hardest task for the object reclaimer, but is critical when allocating new spans."

## Algorithm

```
(sl *sweepLocked).sweep(preserve):                    # runtime/mgcsweep.go:505-760
    require: preemption disabled; s.state == mSpanInUse; s.sweepgen == h.sweepgen - 1 (owned)
    mheap_.pagesSwept += npages
    # 1. specials (11)
    for each special on s, sorted by offset:
        i = special.offset / elemsize
        if slot i unmarked:
            if it has a finalizer: mark it (revive for one cycle); queue every finalizer for it;
                                   clear its weak handles; keep other specials
            else: queue its cleanups; clear weak handles; free all its specials
        else if special is a reachability probe: record reachable and free the probe
    if s had specials and now has none: clear pageSpecials bit
    # 2. debug hooks over newly freed slots: trace, clobberfree (0xdeadbeef), race/msan/asan (13)
    # 3. Green Tea: merge inline marks into gcmarkBits and reset the inline bits (07)
    if gcUsesSpanInlineMarkBits(elemsize): s.moveInlineMarks(s.gcmarkBits)
    # 4. zombie check: a mark on a free slot means a dangling pointer was followed
    if any (gcmarkBits &^ allocBits) bit at index >= freeindex: s.reportZombies()   # throws
    # 5. count and swap
    nalloc = popcount(gcmarkBits[0:nelems]); nfreed = allocCount - nalloc
    if nalloc > allocCount: throw("sweep increased allocation count")
    allocCount = nalloc; freeindex = 0; freeIndexForScan = 0
    allocBits = gcmarkBits; gcmarkBits = newMarkBits(nelems)      # the swap
    refillAllocCache(0)
    atomic store s.sweepgen = h.sweepgen                            # release: span is swept
    # 6. dispose
    if small-object span:
        if nfreed > 0: needzero = 1; stats
        if nalloc == 0: mheap_.freeSpan(s); return true             # pages back to the allocator
        else if allocCount < nelems: mcentral.partialSwept.push(s) else fullSwept.push(s)
    else (large span):
        if unmarked: mheap_.freeSpan(s); needzero = 1; return true  # large objects freed only here
        else: fullSwept.push(s)
```

Drivers:

- `bgsweep` (`runtime/mgcsweep.go:272-357`): a background goroutine that calls `sweepone` repeatedly, yielding, until nothing is left.
- `sweepone` (`:359-460`): `sweep.active.begin()`, claim the next unswept span from `mheap.nextSpanForSweep` (walk `centralIndex`), CAS `sweepgen`, sweep it, `end()`.
- `mcentral.cacheSpan` (`runtime/mcentral.go:82-200`): allocation-driven sweeping of the allocating class until a span with free slots appears, after `deductSweepCredit`.
- `mheap.alloc` calls `reclaim(npages)` before growing, so "when a goroutine needs to allocate large-object span from heap, it sweeps spans until it frees at least that many pages into heap" (`runtime/mgc.go:84-97`).
- `ensureSwept` (`:465`): used when the runtime must operate on a particular span (`SetFinalizer`, `AddCleanup`, weak handles, explicit free).
- `finishsweep_m` at the next cycle's sweep termination sweeps whatever is left.

Lazy versus eager: Go sweeps lazily with a proportional debt so allocation pays bounded sweep work per byte and the heap is fully swept before the next trigger; `sweepMinHeapDistance = 1 MiB` is the minimum runway reserved for it (`runtime/mgc.go:159-161`). Eager sweeping (`concurrentSweep = false`, `GODEBUG=gcstoptheworld=2`) sweeps everything during STW and exists for debugging.

## Invariants

- A span is swept exactly once per cycle; the `sweepgen` CAS enforces it.
- After sweep, `freeindex = 0` and `allocBits == marks`, so the next allocation reuses the lowest free slot.
- No allocation from an unswept span; no finalizer runs before its span is swept ("The finalizer goroutine is kicked off only when all spans are swept", `runtime/mgc.go:103`).
- Spans cached in `mcache`s across mark termination are flushed first (`releaseAll`), so the sweeper can see them; `refill` throws "swept cached span" if the protocol is violated.
- `pageMarks` for a span is clear iff no object on it was marked; the span reclaimer trusts this without reading the span.

## Concurrency notes

Ownership via `sweepgen` CAS; `activeSweep` blocks sweep termination while any sweeper is inside `sweep`; the sweeper runs with preemption disabled ("GC must not start while we are in the middle of this function"). The background sweeper and allocation-driven sweepers coexist without a lock beyond the lock-free span sets; `centralIndex` is a monotonic atomic. `pageMarks` reads are non-atomic because marking and sweeping never overlap ([01](01-address-space-and-pages.md)).

## How Go does it

As above. The two-set trick in `mcentral` (`partial[2]`, `full[2]`) makes "all spans become unswept" at mark termination an O(1) operation: bumping `h.sweepgen` flips which set is "unswept" ([04](04-allocation.md)). Large objects have no free path other than sweep; `runtime.SetFinalizer` on a large object works the same way through specials.

## Alternatives in other collectors

- **BDWGC**: lazy sweep on demand: "Nonempty small object pages are swept when an allocation attempt encounters an empty free list for that object size and kind. Pages for the correct size and kind are repeatedly swept until at least one empty block is found." Unmarked large objects "are immediately returned to the large object free list", and "each small object page is checked to see if all mark bits are clear" at the end of marking so empty pages are freed early; mark bits of leftover free lists are cleared after marking (gcdescr.html, "Sweep phase", "Mark bit clearing"). Sweeping rebuilds free lists by threading through free objects.
- **Immix**: sweeps at line and block granularity from the line mark bytes; no per-object free lists; a block with all lines free becomes free, a block with some free lines becomes "recyclable" and is bump-allocated into. This is the cheapest possible sweep but only because allocation tolerates line-level fragmentation.
- **Eager whole-heap sweep** (simple STW collectors): one pass at the end of the pause; bounded by heap size; simplest correctness argument.

## Beskid adaptation

Today (`Runtime.Mem.Gc.Sweep`): walk every object of every region, free unmarked blocks, coalesce adjacent free blocks, maintain per-region `free_bytes` and `largest_free`.

- **Keep**: the bitmap swap; per-class partial/full lists; whole-span free via `pageMarks`; `needzero` on any free; the zombie check as a test-mode assertion.
- **Simplify**: eager sweep at the end of the STW cycle for v0.5: for every in-use span, if `pageMarks` clear then free the span, else swap bitmaps and popcount. No `sweepgen` CAS, no `activeSweep`, no background sweeper, no proportional credit. Large spans freed by sweep go straight back to the page bitmap.
- **Defer**: lazy sweeping driven by `refill` ("sweep the next unswept span of this class; if none, allocate") with a small budget of extra spans per refill to spread cost. This is the first optimization to add after correctness because it is where allocation-driven pacing hooks in.
- **Drop**: proportional sweep, the separate span reclaimer pass (eager sweep already frees empty spans), sanitizer hooks beyond a single poison switch.
- **Why**: the current sweep is O(objects) with coalescing; the span sweep is O(spans) plus popcount and touches no object memory except for poisoning.

Related: [11 Finalization](11-finalization-and-weak-refs.md) for the specials pass; [13 Debugging](13-debugging-and-verification.md) for clobber and zombie checks.

## References

- `runtime/mgcsweep.go:5-160` (design, `sweepdata`, `sweepClass`, `activeSweep`), `:272` (`bgsweep`), `:359` (`sweepone`), `:465` (`ensureSwept`), `:505-760` (`sweep`), `:973` (`clobberfree`)
- `runtime/mcentral.go:22-60`, `:82-200`
- `runtime/mheap.go` (`mheap` proportional sweep fields; `reclaim`; `freeSpan`; `nextSpanForSweep`)
- `runtime/mgc.go:84-105`, `:159-161`
- `runtime/mgcmark_greenteagc.go:196` (`moveInlineMarks`)
- BDWGC gcdescr.html ("Sweep phase")
- Immix PLDI 2008, section 4
- Beskid: `Runtime.Mem.Gc.Sweep`
