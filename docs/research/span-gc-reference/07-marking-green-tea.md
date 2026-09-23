# 07. Marking: tri-color invariant, work queues, Green Tea, termination

Part of the [span GC component reference](README.md). Previous: [06 Roots](06-roots-and-stack-maps.md). Next: [08 Write barriers](08-write-barriers.md).

## Purpose

Compute the set of objects reachable from the roots and record it in the mark bits, without missing an object the mutator can still reach, and with memory access patterns the CPU can tolerate. Green Tea exists because the classic object-at-a-time "graph flood" stalls: the blog reports that of marking time "usually at least 35%, is simply spent stalled on accessing heap memory", and the design issue that ">35% of CPU cycles in the scan loop are spent solely stalled on memory accesses" with 85% of GC time in that loop.

## Data structures

### Tri-color abstraction

White: not seen. Gray: seen (mark bit set) and still to be scanned. Black: marked and scanned. In Go's work-buffer marking "a grey object is one that is marked and on a work queue. A black object is marked and not on a work queue." In Green Tea "a grey object is one that is marked and has an unset scan bit. A black object is marked and has its scan bit set." (`runtime/mgcwork.go:35-47`).

### Classic work buffers (`runtime/mgcwork.go`)

`workbuf` is 2048 bytes (about 250 pointers). Each P's `gcWork` holds `wbuf1` (push/pop) and `wbuf2` (spare) for one buffer of hysteresis before touching the global `work.full` list; `spanq spanQueue` (Green Tea); `ptrBuf *[pageSize/PtrSize]uintptr` scratch; `bytesMarked`; `heapScanWork`; `flushedWork` (published work since the last termination check); `mayNeedWorker`. Queue priority (`runtime/mgcwork.go:48-58`):

| Priority | Queue | Scope | Function |
|----------|-------|-------|----------|
| 1 | workbufs | P-local | `tryGetObjFast` |
| 2 | span queue | P-local | `tryGetSpanFast` |
| 3 | workbufs | global | `tryGetObj` |
| 4 | span queue | steal | `tryGetSpan`, `tryStealSpan` |

### Green Tea inline mark bits (`runtime/mgcmark_greenteagc.go:50-78`)

Stored in the last 128 bytes of every one-page span whose objects are 16..512 bytes (`gcUsesSpanInlineMarkBits(size) = heapBitsInSpan(size) && size >= 16`, line 258; `heapArena.pageUseSpanInlineMarkBits` says which pages have it):

```
type spanInlineMarkBits struct {
    scans [63]uint8           // scanned bits (blog: "scanned"; issue: black bit)
    owned spanScanOwnership   // 0 unowned | 1 oneMark | 2 manyMark
    marks [63]uint8           // mark bits (blog: "seen"; issue: gray bit)
    class spanClass           // so scanning needs no mspan lookup
}   // 128 bytes at spanBase + 8192 - 128
```

`owned` is the issue's "hit flag": `tryAcquire` (line 146) moves unowned to oneMark (this thread queues the span) or oneMark to manyMark (someone else already queued it; at least two marks now); `release` (line 173) exchanges it back to 0 and returns the old value. During the cycle these spans' marks are not in `gcmarkBits`; the sweeper merges them (`moveInlineMarks`, line 196).

### Span queue (`runtime/mgcmark_greenteagc.go:339-360`)

Per P: a local FIFO ring of 256 `objptr` entries (`objptr = spanBase | objIndex`, lines 824-841; span bases are page aligned and indices fit in 13 bits), plus a chain of single-producer multi-consumer rings (`spanSPMC`, capacity 1024 doubling up to `1<<20/8` entries) other Ps can steal from. `work.spanqMask` is a bitmap of Ps with stealable spans. FIFO is deliberate: "Empirically, a FIFO policy appears to work best for accumulating objects to scan on a span" (file header); the issue: FIFO "turned out to accumulate the highest average density of objects to scan on a span by the time it was dequeued." Spans "can reappear on the work list multiple times per mark phase" (blog).

## Algorithm

```
greyobject(obj, base, off, span, gcw, idx):           # runtime/mgcmark.go:1639-1700 (classic path)
    if span.markBitsForIndex(idx).isMarked(): return
    setMarked()
    if arena.pageMarks bit for span clear: atomic Or8   # sweeper finds entirely dead spans (09)
    if span.spanclass.noscan(): gcw.bytesMarked += elemsize; return   # black at once
    prefetch(obj); gcw.putObj(obj)                      # gray

tryDeferToSpanScan(p, gcw):                           # runtime/mgcmark_greenteagc.go:264-315, tried first
    ha = heapArenaOf(p); if ha == nil or pageUseSpanInlineMarkBits bit for page(p) clear: return false
    base = alignDown(p, 8192); imb = base + 8192 - 128
    objIndex = ((p - base) * SizeClassToDivMagic[imb.class.sizeclass()]) >> 32
    if marks[objIndex] set: return true
    atomic Or8 marks[objIndex]
    if imb.class.noscan(): bytesMarked += size; return true
    if imb.tryAcquire():                              # first marker since the last release queues it
        gcw.spanq.put(objptr(base, objIndex))         # objIndex is the "representative"
        set work.spanqMask[P]; gcw.mayNeedWorker = true; gcw.flushedWork = true
    return true

scanSpan(p, gcw):                                     # runtime/mgcmark_greenteagc.go:844-935
    base = p.spanBase(); imb = inline bits; elemsize from imb.class
    if imb.release() == oneMark:                      # nothing else was marked while queued
        if scans[p.objIndex] set: return
        set scans[p.objIndex]; scanObjectSmall(representative only); return
    nelems = usable span bytes * divMagic >> 32
    toScan = marks &^ scans; scans |= marks           # spanSetScans: one uintptr at a time, atomic OR, sets pageMarks
    if popcount(toScan) == 0: return
    if HasFastScanSpanPacked() and objsMarked >= nelems/8:
        nptrs = scan.ScanSpanPacked(base, gcw.ptrBuf, toScan, sizeclass, spanPtrMask)  # SIMD dense kernel
    else:
        scanObjectsSmall(base, elemsize, nelems, gcw, toScan)   # per-object via in-span heap bits
    for q in ptrBuf[:nptrs]: if !tryDeferToSpanScan(q): findObject + greyobject

gcDrain(gcw, flags):                                  # runtime/mgcmark.go:1239-1390
    drain root jobs (markroot) until none left
    loop until preempted:
        if work.full == 0: gcw.balance()              # keep global work available
        b = tryGetObjFast() or s = tryGetSpanFast() or b = tryGetObj() or s = tryGetSpan()
        if none: wbBufFlush(); retry; if still none: s = tryStealSpan(); if none: break
        if b: scanObject(b) else: scanSpan(s)
        flush heapScanWork credit to the pacer every gcCreditSlack (10)
```

`scanObject` (`runtime/mgcmark_greenteagc.go:1187`, and the classic `scanobject`) splits objects over `maxObletBytes` = 128 KiB into oblets (`runtime/mgc.go:118-125`).

The dense kernel (blog): load the seen and scanned bitmaps, compute the difference, expand one bit per object to one bit per word (`VGF2P8AFFINEQB` on AVX-512), AND with the span's pointer/scalar bitmap, gather pointers in bulk; this "wasn't even an option for the graph flood". The issue reports prototype AVX-512 kernels giving "another 15-20% reduction in garbage collection overheads" when a density threshold is met; the blog reports 10-40% GC CPU reduction without vectors and about 10% more with them, with a caveat that irregular heaps that scan one object per span can regress, though "scanning a mere 2% of a page at a time can yield improvements over the graph flood".

### Termination

`gcMarkDone` (`runtime/mgc.go:1015` and comment): with `markDoneSema` held, run a `forEachP` that flushes each P's write-barrier buffer and local work to global queues; if any P had work (`flushedWork`) or `spanqMask` is nonzero, resume draining; else stop the world, re-check, and enter `gcMarkTermination` (`runtime/mgc.go:1344`): set `_GCmarktermination`, run `gcMark` on g0 (which can shrink stacks), optionally the checkmark pass ([13](13-debugging-and-verification.md)), set `_GCoff` (barrier off), set up sweep, `gcControllerCommit` for the next cycle ([10](10-pacing-and-growth.md)), record pause statistics.

## Invariants

- Mark bit set implies the object was reachable at some point this cycle, or was allocated this cycle (allocate-black).
- Classic path: an object is on at most one work list at a time. Green Tea path: a span may be queued repeatedly, but a queued span has `owned != 0`, each dequeue clears `owned` before scanning, and a mark arriving after `release()` re-queues the span.
- Green Tea precision: scanning `marks &^ scans` and then ORing marks into scans means each object is scanned exactly once even though its span is processed many times.
- `scans ⊆ marks` always; for scan spans `marks == scans` at sweep (checked under `doubleCheckGreenTea`).
- Termination: no gray object exists and none can be produced; in a concurrent design this needs the barrier buffers flushed; in a STW design it is "both queues empty".

## Concurrency notes

All Green Tea bit operations are atomic ORs on bytes or words; `tryAcquire` is an OR that inspects the old value; `release` is `Xchg8`. SPMC rings are freed only when `gcphase == _GCoff` to avoid use-after-free with a stalled stealer (`spanSPMC` comment, lines 660-676). `spanqMask` updates are "intentionally racy" and fixed up by the ragged barrier in `gcMarkDone`. Workbufs move between local and global lists via lock-free stacks.

## How Go does it

Go 1.25 shipped Green Tea behind `GOEXPERIMENT=greenteagc`; Go 1.26 made it the default with an opt-out and enabled the vector kernel on capable x86 (blog). Only small-object spans (one page, 16..512-byte objects) use the span path; larger and headered objects stay on the workbuf path, which is why Green Tea's file says it focuses "on the worst case for locality, small objects". Workers are dedicated (25% of Ps), fractional, and idle; assists drain too ([10](10-pacing-and-growth.md)).

## Alternatives in other collectors

- **BDWGC**: an explicit mark stack of (address, length, descriptor) entries; "The mark bit for the target object is checked and set. If the object was previously unmarked, the object is pushed on the mark stack" (gcdescr.html). This is the graph flood, with a prefetch queue in newer versions.
- **Immix**: object-granular marking that also sets line marks; the batching Immix gets is on the reclamation side (lines and blocks), the dual of Green Tea's batching on the scan side. Immix's parallel marking uses per-thread work packets (MMTk).
- **Concentrator network** (issue 73581): Austin Clements' original design, a sorting network to raise pointer density before scanning; deferred as more complex.
- **Prefetch-buffer marking** (Cher, Boehm; used in BDWGC and HotSpot): FIFO prefetch queue in front of the mark stack; attacks the same stall without changing granularity; Go retains `sys.Prefetch` calls in `greyobject` and `scanObjectSmall`.

## Beskid adaptation

Today (`Runtime.Mem.Gc.Marking`, `ProcessGrayStack`): no work list; a gray state is written into the object header and the collector repeatedly walks every object of every region until a pass finds no gray object. Cost is O(objects x passes) and every pass touches every header.

- **Keep**: precise tri-color marking with span-side bitmaps; a real work list; the noscan fast track; `pageMarks`.
- **Adopt Green Tea single-threaded**: per one-page small-object span, `marks` and `scans` bitmaps and a one-byte `owned` (0 / oneMark / manyMark); a FIFO ring of `objptr` entries that grows on demand; `toScan = marks &^ scans` at dequeue; the single-object shortcut. Without threads: plain stores instead of atomics, no SPMC chain, no steal mask, no `mayNeedWorker`, no ragged barrier. The FIFO still matters because it is what creates batching. Keep a plain LIFO object stack for headered and large objects and for roots.
- **Defer**: the dense SIMD kernel (needs in-span heap bits, [05](05-pointer-maps.md)); oblets (a latency and parallelism feature).
- **Drop**: distributed termination, workers, assists, credit accounting. Termination is "both queues empty" in STW.
- **Why**: the span FIFO and two bitmaps are about 200 lines and decide where marks live; retrofitting them after a classic design would change the span layout twice. The remaining Green Tea machinery exists only for parallelism.

Related: [03 Spans](03-spans.md) (bitmap ownership), [09 Sweeping](09-sweeping.md) (`moveInlineMarks`), [08 Write barriers](08-write-barriers.md).

## References

- `runtime/mgcmark_greenteagc.go:5-33` (design), `:50-260` (inline bits, ownership, `gcUsesSpanInlineMarkBits`), `:264-315` (`tryDeferToSpanScan`), `:339-660` (`spanQueue`, `put`, `drain`, `steal`, `refill`), `:660-830` (`spanSPMC`, `tryStealSpan`, `objptr`), `:844-1062` (`scanSpan`, `spanSetScans`, `scanObjectSmall`, `scanObjectsSmall`), `:1187` (`scanObject`)
- `runtime/mgcwork.go:15-120` (workbufs, `gcWork`, priorities)
- `runtime/mgcmark.go:35` (`maxObletBytes`), `:1239-1390` (`gcDrain`), `:1639-1700` (`greyobject`), `:1748-1775` (`gcmarknewobject`), `scanobject`
- `runtime/mgc.go:5-115` (phases), `:118-125` (oblets), `:344-351` (`spanqMask`), `:1015` (`gcMarkDone`), `:1344` (`gcMarkTermination`)
- Blog https://go.dev/blog/greenteagc; issue https://github.com/golang/go/issues/73581
- BDWGC gcdescr.html ("Mark phase"); Immix PLDI 2008
