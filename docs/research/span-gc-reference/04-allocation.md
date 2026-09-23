# 04. Allocation: fast path and slow path

Part of the [span GC component reference](README.md). Previous: [03 Spans](03-spans.md). Next: [05 Pointer maps](05-pointer-maps.md).

## Purpose

Make the common allocation a handful of instructions: pick the cached span for the size class, `ctz` the allocation cache, bump `freeindex`, optionally zero, write the pointer map, and, during a mark phase, mark the new object black. Push all lock-taking and sweeping into a slow path that runs once per span, not once per object.

## Data structures

**Per-P cache** `mcache` (`runtime/mcache.go`, `type mcache struct`):

```
type mcache struct {
    nextSample  int64      // heap-profile sampling countdown
    memProfRate int
    scanAlloc   uintptr    // bytes of scannable heap allocated since last flush (pacer input)
    tiny, tinyoffset, tinyAllocs uintptr   // tiny allocator block (02)
    alloc [numSpanClasses]*mspan           // current span per span class; &emptymspan when none
    reusableNoscan [numSpanClasses]gclinkptr // Go 1.26: free list of reusable noscan objects
    stackcache [_NumStackOrders]stackfreelist
    flushGen atomic.Uint32 // sweepgen at last flush; stale caches are flushed in acquirep
}
```

**Central lists** `mcentral` (`runtime/mcentral.go:22-60`): `partial [2]spanSet` and `full [2]spanSet`; index `sweepgen/2 % 2` is the swept set and `1 - sweepgen/2 % 2` the unswept set. The roles swap each cycle, so last cycle's "full swept" set is this cycle's "full unswept" set without moving any span. `spanSet` is a lock-free stack of spans.

**Sentinel** `emptymspan`: a span with `nelems == 0`, so the fast path never nil-checks `alloc[spc]`.

## Algorithm

```
mallocgc(size, typ, needzero):                          # runtime/malloc.go:1067-1200
    if size == 0: return &zerobase
    if gcBlackenEnabled: deductAssistCredit(size)        # mutator assist (10)
    if size <= 32768 - 8:
        if typ == nil or !typ.Pointers():
            if size < 16: mallocgcTiny(size, typ)
            else:         mallocgcSmallNoscan(size, typ, needzero)
        else if heapBitsInSpan(size) (<= 512): mallocgcSmallScanNoHeader(size, typ)
        else:                                  mallocgcSmallScanHeader(size, typ)   # +8-byte header
    else: mallocgcLarge(size, typ, needzero)
    (sanitizer hooks, profiling; checkGCTrigger -> gcStart(gcTriggerHeap) if test())

mallocgcSmallScanNoHeader(size, typ):                    # runtime/malloc.go:1503-1592
    mp = acquirem(); mp.mallocing = 1                     # non-preemptible while touching the cache
    sizeclass = SizeToSizeClass8[divRoundUp(size, 8)]; spc = makeSpanClass(sizeclass, false)
    span = c.alloc[spc]
    v = nextFreeFast(span)                                # ctz path; 0 if cache exhausted
    if v == 0: v, span, checkGCTrigger = c.nextFree(spc)  # slow path
    if span.needzero: memclrNoHeapPointers(v, size)
    c.scanAlloc += heapSetTypeNoHeader(v, size, typ, span) # write heap bits (05)
    publicationBarrier()                                  # bits + zeroing visible before v escapes
    if writeBarrier.enabled: gcmarknewobject(span, v)     # allocate black during mark (07)
    else: span.freeIndexForScan = span.freeindex
    mp.mallocing = 0; releasem(mp)

nextFreeFast(s):                                          # runtime/malloc.go, nextFreeFast
    bit = ctz64(s.allocCache)
    if bit < 64:
        idx = s.freeindex + bit
        if idx < s.nelems and (idx+1) % 64 != 0 or idx+1 == s.nelems:  # do not cross a cache word here
            s.allocCache >>= bit + 1; s.freeindex = idx + 1; s.allocCount++
            return s.base() + idx * s.elemsize
    return 0

(c *mcache).nextFree(spc):                                # runtime/malloc.go:996
    s = c.alloc[spc]; idx = s.nextFreeIndex()             # refills allocCache 64 bits at a time (mbitmap.go:1113)
    if idx == s.nelems:
        c.refill(spc); s = c.alloc[spc]; idx = s.nextFreeIndex(); checkGCTrigger = true
    s.allocCount++
    return s.base() + idx*s.elemsize, s, checkGCTrigger

(c *mcache).refill(spc):                                  # runtime/mcache.go:160-240
    old = c.alloc[spc]; if old != &emptymspan: mcentral.uncacheSpan(old); account slots used
    s = mheap_.central[spc].cacheSpan()
    if s == nil: throw("out of memory")
    s.sweepgen = h.sweepgen + 3                           # cached; background sweeper must skip it
    s.allocCountBeforeCache = s.allocCount
    gcController.update(npages*pageSize - used, c.scanAlloc)  # heapLive counts the whole span (overestimate)
    c.alloc[spc] = s

(c *mcentral).cacheSpan():                                # runtime/mcentral.go:82-200
    deductSweepCredit(spanBytes)                          # proportional sweep (09)
    try partialSwept.pop()                                # has free slots, already swept
    try partialUnswept.pop(): sweep it; use it
    try fullUnswept.pop():    sweep it; if it freed anything, use it; else push to fullSwept
    (bounded number of attempts) else s = c.grow()        # allocSpan + initHeapBits
    s.freeindex = first free; refillAllocCache
```

**Large objects** (`mallocgcLarge`, `runtime/malloc.go:1687`; `allocLarge`, `runtime/mcache.go:242`): `npages = divRoundUp(size, pageSize)`, deduct sweep credit, `mheap_.alloc(npages, spanclass)`, `s.largeType = typ`, zero if `needzero` (very large objects are zeroed after re-enabling preemption), publish, mark black during a cycle. Large objects are only freed by the sweeper ([09](09-sweeping.md)).

**Zeroing** (`runtime/malloc.go:56-66`): `needzero` on a span means free slots may hold garbage; pages fresh from the OS are known zero (`heapArena.zeroedBase`) and are not touched. Objects with pointers are always zeroed before publication ("objects with pointers must be zeroed", `runtime/malloc.go:1090`) so the marker never reads stale pointers.

## Invariants

- Allocation never proceeds on an unswept span.
- A pointer-bearing object becomes visible to the collector only after its memory is zeroed and its heap bits are written (`publicationBarrier`).
- During the mark phase every new object is black (`gcmarknewobject`, `runtime/mgcmark.go:1748-1775`) and cannot be freed this cycle; the pacer accounts for that as allocation.
- `heapLive` is an overestimate between cycles: a cached span counts as fully used (`refill` comment, issue 53738) because an underestimate makes the pacer use more memory.
- `checkGCTrigger` is evaluated only when a span was refilled, not per object.

## Concurrency notes

The fast path is lock-free: the `mcache` is owned by one P and the allocating M is pinned (`acquirem`). `mcentral` uses lock-free span sets; `mheap_.lock` is taken only for page and span-record allocation. Mark termination flushes all caches (`releaseAll`) so the sweeper sees every span. `mp.mallocing` prevents re-entrant allocation from signal handlers.

## How Go does it

As above, plus Go 1.26 specifics: size-specialized entry points chosen at compile time (`mallocNoScanTable`/`mallocScanTable`, `runtime/malloc.go:1080-1090`), a `reusableNoscan` per-class free list that recycles noscan objects before sweep, the "secret" mode that forces zeroing of freed memory, and sanitizer red zones under ASAN. `deductAssistCredit` is the hook that makes allocation pay for marking during a cycle ([10](10-pacing-and-growth.md)).

## Alternatives in other collectors

- **BDWGC**: per-size free lists threaded through the free objects themselves; allocation pops a free list, and when a list is empty the allocator sweeps blocks of that size ("Pages for the correct size and kind are repeatedly swept until at least one empty block is found", gcdescr.html). Thread-local free lists exist in the parallel build.
- **Immix**: bump allocation into holes (runs of free lines) with a thread-local bump cursor and limit; a new hole is found by scanning the block's line-mark bytes. No per-object free list and no size classes, at the cost of medium-object hole search.
- **Bump allocation with mark-region** is the fastest mutator path but needs either evacuation or accepting line-level fragmentation; a strictly non-moving span design pays a `ctz` per allocation instead.

## Beskid adaptation

Today (`Runtime.Mem.Gc.Allocation`): bump-allocate in the current region, else first-fit over the region's free list, else collect, else grow; `GcAlloc` traps with a typed exhaustion instead of returning null.

- **Keep**: `freeindex + allocCache + ctz`; lazy zeroing keyed by `needzero`; the scan/noscan split; the rule that `checkGCTrigger` runs at span refill, not per object; the `beskid_rt_v5_managed_object_allocate` signature.
- **Simplify**: with one OS thread and cooperative fibers, `mcache` and `mcentral` collapse into a single `current[spanClass]` plus `partial[spanClass]` and `full[spanClass]` lists. No `acquirem`, no `publicationBarrier`, no lock-free sets. `refill` becomes: pop `partial`, else sweep the next unswept span of that class (if lazy sweep is adopted), else `allocSpan`.
- **Drop**: assists, `reusableNoscan`, the memory-profile sampling hook (replace with a debug counter), user arenas, secret mode, sanitizer hooks (keep a single poison-on-free switch, [13](13-debugging-and-verification.md)).
- **Why**: the current bump-then-first-fit path is fine until the first collection, after which free-list search dominates. `ctz` on a bitmap is constant time and does not need coalescing.

Related: [09 Sweeping](09-sweeping.md) supplies free slots; [10 Pacing](10-pacing-and-growth.md) decides the trigger tested at refill.

## References

- `runtime/malloc.go:5-66` (hierarchy and zeroing), `:996` (`nextFree`), `:1067-1200` (`mallocgc`), `:1202` (`mallocgcTiny`), `:1358` (`mallocgcSmallNoscan`), `:1503-1592` (`mallocgcSmallScanNoHeader`), `:1594` (`mallocgcSmallScanHeader`), `:1687` (`mallocgcLarge`), `nextFreeFast`
- `runtime/mcache.go` (`mcache`, `:160-240` `refill`, `:242` `allocLarge`, `:290` `releaseAll`)
- `runtime/mcentral.go:22-60`, `:82-200` (`cacheSpan`), `:205` (`uncacheSpan`), `:251` (`grow`)
- `runtime/mbitmap.go:1113-1170` (`nextFreeIndex`)
- `runtime/mgcmark.go:1748-1775` (`gcmarknewobject`)
- BDWGC gcdescr.html ("Allocation", "Sweep phase")
- Immix PLDI 2008, section 4 (allocation)
