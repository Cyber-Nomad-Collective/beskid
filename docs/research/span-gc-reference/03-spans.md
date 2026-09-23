# 03. Spans and the span lifecycle

Part of the [span GC component reference](README.md). Previous: [02 Size classes](02-size-classes.md). Next: [04 Allocation](04-allocation.md).

## Purpose

The span is the unit at which the collector reasons. It owns a contiguous run of pages; all objects on it share one size and one scan/noscan bit; it carries the allocation bitmap, the mark bitmap, the free-search index, the sweep generation, and the specials list. The marker, sweeper, and allocator all work in terms of spans.

## Data structures

`runtime/mheap.go`, `type mspan struct` (Go 1.26.5; `sys.NotInHeap`, allocated from a `fixalloc`):

| Field | Type | Meaning |
|-------|------|---------|
| `next, prev, list` | `*mspan`, `*mSpanList` | intrusive list links (free span lists, debug) |
| `startAddr` | `uintptr` | first byte; `s.base()` |
| `npages` | `uintptr` | pages in the span |
| `manualFreeList` | `gclinkptr` | free list for `mSpanManual` (stack) spans |
| `freeindex` | `uint16` | slot index at which the next free-slot search begins; `== nelems` means no free slots |
| `nelems` | `uint16` | number of slots |
| `freeIndexForScan` | `uint16` | `freeindex` as published to the GC scanner only after the object and heap bits are initialized (issue 54596) |
| `allocCache` | `uint64` | complement of the 64 `allocBits` starting at `freeindex`, shifted so bit 0 is `freeindex`; `ctz` finds the next free slot |
| `allocBits` | `*gcBits` | 1 bit per slot: allocated as of the last sweep, or since (bits at index >= `freeindex` may be 0 = free) |
| `gcmarkBits` | `*gcBits` | 1 bit per slot: marked in the current cycle |
| `pinnerBits` | `*gcBits` | pinned slots (`runtime.Pinner`) |
| `sweepgen` | `uint32` | see the protocol below |
| `divMul` | `uint32` | magic for `objIndex` |
| `allocCount` | `uint16` | allocated slots |
| `spanclass` | `spanClass` | `sizeclass << 1 \| noscan` |
| `state` | `mSpanStateBox` | `mSpanDead`, `mSpanInUse`, `mSpanManual`; atomic get/set |
| `needzero` | `uint8` | free slots may be dirty; zero at allocation |
| `isUserArenaChunk` | `bool` | user arena chunk |
| `allocCountBeforeCache` | `uint16` | `allocCount` when the span was cached, for accounting |
| `elemsize` | `uintptr` | slot size: class size, or `npages*pageSize` for large |
| `limit` | `uintptr` | end of usable data (`base + nelems*elemsize`), excludes tail waste and inline metadata |
| `speciallock`, `specials` | `mutex`, `*special` | sorted list of finalizer/weak/cleanup records ([11](11-finalization-and-weak-refs.md)) |
| `userArenaChunkFree` | `addrRange` | user arena bookkeeping |
| `largeType` | `*_type` | the type of the single object on a large span (its "malloc header", [05](05-pointer-maps.md)) |

**Bitmap storage.** `allocBits` and `gcmarkBits` come from `gcBitsArenas` with four rotating roles, free / next / current / previous; `nextMarkBitArenaEpoch` rotates them at the start of a cycle, and sweep sets `allocBits = gcmarkBits` and takes fresh zeroed `gcmarkBits` from "next" (`allocBits` field comment; `runtime/mheap.go:2920-3010`). This rotation exists so the "previous" bitmap can still be read by anything that raced with the swap.

**Inline mark bits** (Green Tea, [07](07-marking-green-tea.md)): for one-page spans with 16..512-byte objects the current cycle's marks live in the last 128 bytes of the span page instead of `gcmarkBits`; sweep merges them (`moveInlineMarks`).

**Sweep generation protocol** (`runtime/mheap.go`, `sweepgen` comment), with `h.sweepgen += 2` at every mark termination:

| `s.sweepgen` | Meaning |
|--------------|---------|
| `h.sweepgen - 2` | needs sweeping |
| `h.sweepgen - 1` | being swept now |
| `h.sweepgen` | swept, ready to use |
| `h.sweepgen + 1` | cached in an `mcache` before sweep began, still cached, needs sweeping |
| `h.sweepgen + 3` | swept, then cached, still cached |

A sweeper claims a span with a CAS `sweepgen-2 -> sweepgen-1`, so at most one sweeper ever owns it ([09](09-sweeping.md)).

**State machine** (`runtime/mheap.go:356-392`): `mSpanDead` = the record represents no memory; `mSpanInUse` = heap objects; `mSpanManual` = runtime-managed (goroutine stacks). "Setting mspan.state to mSpanInUse or mSpanManual must be done atomically and only after all other span fields are valid", and readers who arrive at a span through the address map must load `state` atomically before trusting other fields (that is what `spanOfHeap` does).

## Algorithm

```
allocSpan(npages, typ, spanclass):                  # runtime/mheap.go, (h *mheap).allocSpan
    lock(h.lock); base = pages.alloc(npages) or grow(npages) then retry; unlock
    s = h.spanalloc.alloc(); s.init(base, npages)
    s.spanclass = spanclass; s.elemsize = class size or npages*pageSize
    s.nelems = usable bytes / elemsize (usable excludes inline heap bits and inline mark bits)
    s.limit = base + nelems*elemsize; s.divMul = SizeClassToDivMagic[class]
    s.allocBits = newAllocBits(nelems); s.gcmarkBits = newMarkBits(nelems)   # zeroed
    s.freeindex = 0; s.allocCache = ^0; s.allocCount = 0; s.needzero from page allocator
    if scan span with heapBitsInSpan: s.initHeapBits()                        # 05
    if Green Tea span: s.initInlineMarkBits()                                  # 07
    for each page: ha.spans[i] = s;  set pageInUse (and pageUseSpanInlineMarkBits) for first page
    s.sweepgen = h.sweepgen                                                    # born swept
    s.state.set(mSpanInUse)                                                    # publication, last

freeSpan(s):                                        # runtime/mheap.go, (h *mheap).freeSpan
    lock(h.lock); clear pageInUse; pages.free(base, npages); h.spanalloc.free(s) after s.state = mSpanDead
    (spans[] entries are left pointing at the dead record for the first and last page; they are
     ignored because state != mSpanInUse)

lifecycle of a small-object span (each cycle):
    allocSpan -> cached in an mcache (sweepgen+3) or on mcentral.partial/full swept sets
    mark termination: h.sweepgen += 2; every in-use span is now "unswept"
    sweep(s): allocBits = gcmarkBits; if allocCount == 0: freeSpan
              else push to partialSwept or fullSwept of its class
    cacheSpan: pop a partial span (sweeping it first if unswept) -> mcache
```

## Invariants

- Slot `i` is allocated iff `i < freeindex and allocBits[i]`, or `i >= freeindex and allocBits[i]` (bits at or above `freeindex` are authoritative; below it they are as well; see `isFree`, `runtime/mbitmap.go:1172-1190`).
- `gcmarkBits ⊆ allocBits` at sweep time; a mark on an unallocated slot is a "zombie" and the sweeper throws (`reportZombies`).
- After sweep, `allocCount == popcount(allocBits[0:nelems])`; the sweeper throws if `nalloc > allocCount` ("sweep increased allocation count").
- `freeIndexForScan <= freeindex`; slots in between are allocated but not yet initialized from the scanner's point of view.
- No allocation from an unswept span; `mcentral.cacheSpan` sweeps first ("It's critical to ensure that no operations proceed on unswept spans", `runtime/mgc.go:98-100`).
- A span record never moves; pointers to `mspan` are stable for its lifetime.

## Concurrency notes

Publication order (initialize, then set state) plus atomic state loads is the whole protocol for readers coming from `spanOf`. The `sweepgen` CAS serializes sweepers. A span cached in an `mcache` (`sweepgen+3`) is invisible to the background sweeper until the cache is flushed at mark termination (`releaseAll`). `speciallock` guards the specials list. Bitmap words are written atomically only when two writers can share a byte (the marker uses `atomic.Or8`; the allocator's `allocBits` updates are single-owner).

## How Go does it

As above. `mspan` is about 160 bytes; Go keeps `nelems` although it is derivable from the class (the field comment notes a TODO to remove it). `elemsize` for large objects is the whole span, so `objIndex` is always 0 and `findObject` returns the span base. `limit` matters because the last part of a page may hold inline heap bits and inline mark bits, which must never be mistaken for object memory.

## Alternatives in other collectors

- **BDWGC**: the block header (`hblkhdr`) is the direct analogue, holding "the size of the object(s) in that page, the object kind, and the necessary mark bits for those objects" plus "a pointer to a precomputed map of page offsets to displacements from the beginning of an object" (gcdescr.html). Mark bits are cleared at the start of a collection rather than swapped.
- **Immix**: per-block metadata is a line mark byte array (one byte per 128-byte line) and block state (free / recyclable / unavailable); there is no per-object alloc bitmap; liveness is recorded per line ("conservative line marking" marks the line after a small object too, because most objects are under 128 bytes and can straddle at most two lines).
- **Per-object mark words** (Beskid today, many simple collectors): mark state inside the object header; simplest but touches every object during sweep and costs a word per object.

## Beskid adaptation

Today (`Runtime.Mem.Gc.State`) every object carries a descriptor at offset 0 and a mark word at offset 8; regions have `bump`, `limit`, `free_bytes`, `largest_free`. Sweep coalesces free blocks in address order.

- **Keep**: the span record with `base, npages, elemsize, nelems, divMul, freeindex, allocCache, allocBits, gcmarkBits, allocCount, spanclass, state, needzero, limit` and a `specials` pointer reserved for [11](11-finalization-and-weak-refs.md). Keep the state machine and publication order even in single-threaded code; the verifier ([13](13-debugging-and-verification.md)) relies on it.
- **Simplify**: store `allocBits`/`gcmarkBits` inline in the span record for spans of up to 1024 slots (two 128-byte arrays) and swap two pointers at sweep; no epoch rotation. Replace the 5-value `sweepgen` protocol with a per-span `swept` generation compared against the heap's (values `needs sweep` and `swept` only), because a single-threaded STW design has no "being swept" or "cached across the cycle" states.
- **Drop**: `pinnerBits`, `manualFreeList` (fiber stacks are not span-allocated in Beskid), user-arena fields, `allocCountBeforeCache`.
- **Why**: moving marks out of object headers is the main win of the redesign. The marker stops writing into objects, the sweeper becomes a bitmap walk plus popcount, and every object shrinks by 8 bytes.

Related: [04 Allocation](04-allocation.md) uses `freeindex`/`allocCache`; [09 Sweeping](09-sweeping.md) performs the bitmap swap; [07 Marking](07-marking-green-tea.md) writes `gcmarkBits` or the inline bits.

## References

- `runtime/mheap.go`: `type mspan struct`; `:356-392` (states); `sweepgen` comment; `allocBits` comment; `:518` (`base`); `:2920-3010` (`newMarkBits`, `newAllocBits`, `nextMarkBitArenaEpoch`); `allocSpan`, `freeSpan`
- `runtime/mbitmap.go:1086-1230` (`allocBitsForIndex`, `refillAllocCache`, `nextFreeIndex`, `isFree`, `isFreeOrNewlyAllocated`, `objIndex`); `:1495` (`countAlloc`)
- `runtime/mgcsweep.go:505-760` (`sweep`, zombie check)
- `runtime/mgc.go:84-105` (concurrent sweep design comment)
- BDWGC gcdescr.html (block header)
- Immix PLDI 2008, section 3
