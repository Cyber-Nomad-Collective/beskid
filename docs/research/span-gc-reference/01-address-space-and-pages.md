# 01. Address space, arenas, page allocator, and span lookup

Part of the [span GC component reference](README.md). Next: [02 Size classes](02-size-classes.md), [03 Spans](03-spans.md).

## Purpose

Give every address a cheap, precise answer to two questions: "is this a heap pointer at all?" and "which span (and therefore which size class, mark bits, and pointer map) does it belong to?" Everything else in a non-moving collector rests on this map: the marker's `findObject`, the conservative stack scanner, the sweeper's whole-span reclaim, and heap verification.

## Data structures

### Pages

The unit of span management is `pageSize = 1 << gc.PageShift` with `PageShift = 13`, i.e. 8 KiB (`internal/runtime/gc/sizeclasses.go:91`; `runtime/malloc.go:110`). This is a logical page; the OS page size is tracked separately as `physPageSize`.

### Arenas

The heap is a set of aligned arenas: 64 MiB on 64-bit Linux and macOS, 4 MiB on Windows and on 32-bit, 512 KiB on Wasm (`runtime/malloc.go:238-264`; the `logHeapArenaBytes` formula is at line 259). `pagesPerArena = heapArenaBytes / pageSize` = 8192 on 64-bit. Each arena has one off-heap `heapArena` record (`runtime/mheap.go:268-330`):

```
type heapArena struct {
    spans     [pagesPerArena]*mspan      // page index -> span. In-use spans: every page maps to the
                                          // span. Free spans: only the first and last page are
                                          // meaningful. Never-allocated pages: nil.
    pageInUse [pagesPerArena / 8]uint8    // bit per span (first page only): state mSpanInUse
    pageMarks [pagesPerArena / 8]uint8    // bit per span (first page only): span has >= 1 marked object
    pageSpecials [pagesPerArena / 8]uint8 // bit per span: span has specials (finalizers etc.)
    pageUseSpanInlineMarkBits [pagesPerArena / 8]uint8 // Green Tea: span keeps mark bits inline
    checkmarks *checkmarksMap             // debug-only shadow mark bitmap (13)
    zeroedBase uintptr                    // first never-used byte of the arena; memory below is dirty
}
```

`pageMarks` is what lets the sweeper free an entirely dead span without reading it (`runtime/mheap.go:292-305`).

### Arena map

`mheap_.arenas [1 << arenaL1Bits]*[1 << arenaL2Bits]*heapArena` covers the whole usable address space (`runtime/mheap.go`, `mheap` struct, `arenas` field comment). On most 64-bit targets `arenaL1Bits` is 0 so the map is one flat array of `1 << (heapAddrBits - logHeapArenaBytes)` = `1 << (48 - 26)` = 4 Mi pointers (32 MiB of virtual space, mapped lazily). `arenaIndex(p) = (p - arenaBaseOffset) / heapArenaBytes` (`runtime/mheap.go:615`); on amd64 `arenaBaseOffset = 0xffff800000000000` so that sign-extended addresses fold into one contiguous index range (`runtime/malloc.go:299-314`).

### Page allocator

`mheap.pages pageAlloc` (`runtime/mpagealloc.go:5-46`) keeps a bitmap over all pages (1 = in use), "sharded into chunks" of 512 pages (4 MiB; 64 pages on Wasm). Over it sits a radix tree of summaries, each recording for its region "the number of contiguous free pages at the start and end of the region it represents, and the maximum number of contiguous free pages found anywhere in that region." Each level is one contiguous array (an implicit tree), `summaryLevelBits = 3` so 8 summaries (64 bytes) fit one cache line, root summaries cover 16 GiB each, and allocation is "address-ordered first-fit". Address order keeps the heap dense at low addresses so the scavenger can return high pages to the OS.

### Multi-page spans in the table

All pages of a multi-page span point to the span (`runtime/mheap.go:271-275`), so an interior pointer into a large object resolves in O(1) with no backward search.

## Algorithm

```
spanOf(p):                                        # runtime/mheap.go:696-729
    ri = arenaIndex(p)
    if ri out of range: return nil
    ha = mheap_.arenas[ri.l1()][ri.l2()]
    if ha == nil: return nil                      # address space never used by the heap
    return ha.spans[(p / pageSize) % pagesPerArena]

spanOfHeap(p):                                    # runtime/mheap.go:742-753
    s = spanOf(p)
    if s == nil or s.state.get() != mSpanInUse or p < s.base() or p >= s.limit:
        return nil                                # free span, stack span, or stale entry
    return s

findObject(p, refBase, refOff):                   # runtime/mbitmap.go:1361-1400
    s = spanOf(p)
    if s == nil: return (0, nil, 0)               # not heap; allowed (mmap'd memory, globals)
    if s.state != mSpanInUse or p < s.base() or p >= s.limit:
        if s.state == mSpanManual: return (0, nil, 0)   # goroutine stack span; fine
        if debug.invalidptr: badPointer(s, p, refBase, refOff)   # throw with diagnostics
        return (0, nil, 0)
    objIndex = s.objIndex(p)                      # ((p - base) * divMul) >> 32, no division
    return (s.base() + objIndex * s.elemsize, s, objIndex)

grow(npages):                                     # runtime/mheap.go:1553-1640
    ask = alignUp(npages, pallocChunkPages) * pageSize
    if current arena region has room: extend it
    else:
        v = sysAlloc(ask, arenaHints)             # reserve arena-aligned space; keep arenas contiguous
        if v == nil: print "runtime: out of memory: cannot allocate N-byte block (M in use)"; return false
        for each new arena frame: allocate heapArena, store in mheap_.arenas, append to heapArenas
    sysMap the new range; pages.grow(base, size)  # page allocator learns the new pages
```

## Invariants

- Arena map entries transition nil to non-nil only, never back (`mheap.arenas` comment). This is what makes unlocked reads safe.
- `spans[]` entries are exact for pages of in-use spans and for the first and last page of free spans only. A reader must already know an address is live before trusting its entry, and "there must not be a safe-point between establishing that an address is live and looking it up in the spans array" (`runtime/mheap.go:277-281`).
- `pageInUse`, `pageMarks`, `pageSpecials`, `pageUseSpanInlineMarkBits` set only the bit of a span's first page.
- A span never crosses an arena boundary unless the arenas are contiguous; the allocator uses address hints to keep them so.
- The page allocator's bitmap and the `spans[]` table agree: a page marked free in the bitmap has no in-use span.

## Concurrency notes

Writes to `heapArena.spans` and the arena map are under `mheap_.lock`; reads are lock-free with the discipline above. `pageMarks` is written with `atomic.Or8` by the marker and read non-atomically by the sweeper, safe only because marking and sweeping never overlap (`runtime/mheap.go:296-298`). `mheap_.lock` "must only be acquired on the system stack" because stack growth under it would self-deadlock (`mheap` struct comment). The page allocator is entirely under `mheap_.lock`.

## How Go does it

As above. Points worth keeping in mind:

- The two-level arena map exists for 32-bit and for platforms with more address bits than 48; the comment says on most 64-bit platforms it is effectively single-level and `arenas[0]` is never nil.
- The radix-tree page allocator (Go 1.14) replaced a treap; its `find` walks summary levels with bit intrinsics rather than pointer chasing, and `searchAddr` caches where the lowest free page might be.
- Heap growth is in whole 4 MiB chunks so `sysMap` is rare; the first growth may randomize the heap base.
- `zeroedBase` per arena lets the allocator skip zeroing fresh pages ([04 Allocation](04-allocation.md)).

## Alternatives in other collectors

- **BDWGC** (gcdescr.html, "Pointer-to-block mapping"): a two-level page table where "each table entry contains either 0, indicating that the page is not part of the garbage collected heap, a small integer n, indicating that the page is part of large object, starting at least n pages back, or a pointer to a descriptor for the page." Heap blocks (`HBLKSIZE`) are "typically on the order of the page size". The "n pages back" encoding saves a pointer per page of a large object but costs a loop on interior pointers; Go spends the pointer and gets O(1).
- **Immix** (PLDI 2008): 32 KiB blocks subdivided into 128-byte lines; block and line state live in side tables indexed by address. Reclamation is at line granularity, so there is no per-object free list; the address map is coarser than Go's because objects are not size-segregated.
- **Precise runtimes with a card table** (e.g. HotSpot, .NET) also keep a byte-per-region side table for their remembered sets; that structure is unnecessary in a non-generational collector.

## Beskid adaptation

Today (`Runtime.Mem.Gc.State`) the heap is a singly linked chain of independently mapped regions with a 64-byte header, a bump pointer in the current region, and per-region free lists; `HeapContains`/`IsAllocatedObject` walk regions to answer membership, and every marking step goes through that walk (`Runtime.Mem.Gc.Marking`, `ManagedObjectForReference`). Replacing this map is the first step of the redesign because every other component depends on `spanOf` being two loads.

- **Keep**: a fixed 8 KiB logical page; aligned arenas (4 MiB is enough at Beskid's scale; 64 MiB wastes virtual space for small programs); a page-to-span table per arena; `spanOf`, `spanOfHeap`, `findObject` with the same semantics; `pageMarks`.
- **Simplify**: single-level arena map keyed by `(p - heapBase) >> logArenaBytes`; a per-arena free-page bitmap searched with 64-bit `ctz`/popcount for first-fit, plus a small cache of free runs by length. This is O(arena pages / 64) per allocation in the worst case, acceptable for v0.5, and upgradable to summaries later without changing any interface.
- **Drop**: the radix-tree summaries, huge-page hints, `arenaBaseOffset` folding (Beskid addresses are user-space positive), the 32-bit pre-reserved linear allocators, and the scavenger (keep a hook to release entirely free arenas with `madvise`/`VirtualFree` later).
- **Why**: the current region walk makes membership O(regions) and marking O(heap) per pass; a table makes both O(1). The radix tree only pays off with many gigabytes of heap and many threads contending on `mheap_.lock`.

Related: [12 Out of memory](12-out-of-memory.md) for what `grow` failure should report; [13 Debugging](13-debugging-and-verification.md) for the `invalidptr` checks that live in `findObject`.

## References

- `runtime/malloc.go:5-100` (allocator overview and virtual memory layout), `:110`, `:238-264`, `:299-314`
- `runtime/mheap.go:268-330` (`heapArena`), `mheap` struct (`arenas`, `heapArenas`, `arenaHints`), `:615` (`arenaIndex`), `:696-753` (`spanOf`, `spanOfUnchecked`, `spanOfHeap`), `:1553-1640` (`grow`)
- `runtime/mpagealloc.go:5-120`
- `runtime/mbitmap.go:1361-1400` (`findObject`)
- BDWGC gcdescr.html, sections on heap blocks and pointer lookup
- Immix PLDI 2008, section 3 (heap organization)
