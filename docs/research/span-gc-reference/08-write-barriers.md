# 08. Write barriers

Part of the [span GC component reference](README.md). Previous: [07 Marking](07-marking-green-tea.md). Next: [09 Sweeping](09-sweeping.md).

## Purpose

Preserve the marking invariant when the mutator runs while the collector is marking. Without a barrier a mutator can move the only reference to a white object into an already-black object (or onto an already-scanned stack) and the object is freed while live. A barrier is required only when marking is incremental or concurrent; a stop-the-world collector that never interleaves mutator and marker needs none.

## Data structures

- `writeBarrier.enabled` (a global flag the compiler tests before every barriered store; `runtime/mgc.go`), set during the STW at mark start and cleared at mark termination.
- Per-P `wbBuf` (`runtime/mwbbuf.go:35-70`): `next uintptr`, `end uintptr`, `buf [512]uintptr` (`wbBufEntries = 512`). The barrier appends the old and new pointer values; when the buffer is full the slow path `wbBufFlush` feeds every entry to the marker. The comment calls it "closely related to a sequential store buffer (SSB), except that SSBs are usually used for maintaining remembered sets, while this is used for marking."
- The fast path `gcWriteBarrier` is assembly that "doesn't clobber any general purpose registers" (`runtime/mwbbuf.go:11-21`); the flush spills all registers and forbids safe points that could observe the frame.

## Algorithm

Go's hybrid barrier (`runtime/mbarrier.go:24-60`; proposal 17503):

```
writePointer(slot, ptr):
    shade(*slot)                     # Yuasa deletion barrier: the overwritten referent
    if current stack is grey:
        shade(ptr)                   # Dijkstra insertion barrier: the new referent
    *slot = ptr
```

`shade(x)` = mark `x` and, if it has pointers, enqueue it. Go executes both shades unconditionally (the "stack is grey" test is omitted) because making either conditional on the color of the containing object or stack would need a memory barrier on every store (`mbarrier.go:59-95`: the store/load reordering example where "the final result on most HW (including 386/amd64) can be r1==r2==0").

Why the two halves (`mbarrier.go:41-55`): `shade(*slot)` stops the mutator from hiding an object by moving its only reference from the heap onto a stack; `shade(ptr)` stops it from hiding an object by moving a stack-held reference into a black heap object; after a stack has been scanned it "only points to shaded objects, so it's not hiding anything", so stacks are scanned once and never rescanned. The barrier maintains the weak tri-color invariant ("any white object pointed to by a black object is reachable from a grey object via a chain of white pointers", proposal 17503).

Stack writes carry no barrier ("The compiler omits write barriers for writes to the current frame", `mbarrier.go:100-105`). Bulk typed copies use `bulkBarrierPreWrite` over the pointer bitmap (`runtime/mbitmap.go:388`) before the copy. Globals are written with barriers like heap slots.

Lifetime: "No objects may be scanned until all Ps have enabled the write barrier, which is accomplished using STW" (`runtime/mgc.go:37-39`); disabled in mark termination after marking is complete (`runtime/mgc.go:1371`).

## Invariants

- Barrier enabled before the first object is scanned; disabled only after no gray objects remain.
- Allocation during the barrier window allocates black ([04](04-allocation.md)), so the barrier never has to consider a new object.
- Every pointer store to heap or global memory that the compiler cannot prove is to the current stack frame goes through the barrier, including runtime-internal stores (`//go:nowritebarrier` annotations mark the exceptions and are checked by the compiler).

## Concurrency notes

The barrier buffer is per P and flushed on GC phase transitions and by the ragged barrier in `gcMarkDone` ([07](07-marking-green-tea.md)). Correctness depends on publication ordering of the object's initialization before the pointer store, which the allocator's `publicationBarrier` provides.

## How Go does it

As above. Before Go 1.8 Go used a pure Dijkstra insertion barrier and had to rescan all stacks during STW at the end of the cycle, which "could consume 10's to 100's of milliseconds" (proposal 17503); the hybrid barrier removed that rescan. The compiler inlines only the `writeBarrier.enabled` test; the buffered fast path is one call into assembly.

## When a collector can omit the barrier

| Marking mode | Barrier needed |
|--------------|----------------|
| Stop-the-world, non-incremental | none: the mutator never runs between root scan and termination |
| Incremental, but mutator only runs between marking slices while all roots are re-scanned at termination | insertion barrier not needed if the final root rescan is affordable; the heap can still hide objects unless a deletion (Yuasa) or insertion (Dijkstra) barrier runs on heap stores during the whole window |
| Incremental with black stacks after scan | hybrid barrier, exactly Go's |
| Concurrent on another thread | hybrid barrier plus the memory-ordering reasoning in `mbarrier.go` |

A cooperative-fiber runtime has a cheaper intermediate: fibers switch only at known points, so if marking slices run only at those points and only between slices the mutator runs, the collector can treat the fiber's root stack as snapshot-at-the-beginning and re-scan the root stacks of fibers that ran since their last scan. That removes the need for stack barriers but not for a heap barrier: a fiber that ran can store a pointer into a black heap object, so an insertion barrier on heap stores (or a deletion barrier plus re-scan) is still mandatory.

## Alternatives in other collectors

- **Dijkstra insertion only** (early Go, many incremental collectors): simple; requires a final stack rescan or gray stacks.
- **Yuasa deletion only / snapshot-at-the-beginning** (Immix's concurrent variants, many concurrent JVM collectors): scan roots at the start, shade overwritten pointers; new objects are allocated black; more floating garbage.
- **Card marking** (generational collectors): records which regions were written, for a later scan; a remembered-set barrier rather than a marking barrier. Not needed without generations.
- **No barrier, conservative STW** (BDWGC default): stop all threads, scan everything; BDWGC's incremental mode instead uses virtual-memory dirty bits (mprotect or /proc) as a hardware "barrier".

## Beskid adaptation

Today `gc_write_barrier(parent, child)` (`Runtime.Mem.Gc.Collection`) grays `child` when the heap's phase is marking, i.e. a Dijkstra insertion barrier called from generated code. Because collection is stop-the-world, the phase is never "marking" while the mutator executes, so the barrier does nothing at runtime but still costs a call per managed store.

- **Keep**: the codegen knowledge of which stores are managed (`ManagedReferenceFact` and the pointer-map offsets in aggregate plans), because that is the input to any future barrier.
- **Simplify**: for the STW v0.5 design, emit no barrier calls at all (or keep the helper symbol for ABI stability and have ISLE not emit calls unless a runtime flag says the collector is incremental). Remove the runtime-phase test from the hot path.
- **Defer**: incremental marking. If adopted later, the requirements are: (a) an inlined single-flag test with an out-of-line slow path, (b) both shades or a deletion barrier with re-scan of root stacks that ran, (c) allocate-black during the window, (d) a written argument for why root stacks can be black after one scan, mirroring proposal 17503 but for explicit root stacks (stores into rooted slots are stack writes and need no barrier only if the slot's old value is shaded on overwrite or the fiber's root stack is rescanned).
- **Drop**: the per-P write buffer and the memory-ordering constraints; a single-threaded runtime can shade directly.
- **Why**: a barrier that never fires is pure cost; removing it is a measurable mutator win, and reintroducing it is a contained codegen change because the managed-store knowledge stays.

Related: [07 Marking](07-marking-green-tea.md) (what "shade" does), [06 Roots](06-roots-and-stack-maps.md) (why stacks are the hard case).

## References

- `runtime/mbarrier.go:5-120` (design comment, memory ordering, stack writes)
- `runtime/mwbbuf.go:5-80` (buffer design, `wbBufEntries`)
- `runtime/mbitmap.go:388-500` (`bulkBarrierPreWrite`, `bulkBarrierPreWriteSrcOnly`)
- `runtime/mgc.go:29-47` (barrier enable in the mark phase), `:1371` (disable at termination)
- Proposal 17503: https://github.com/golang/proposal/blob/master/design/17503-eliminate-rescan.md
- Dijkstra et al. 1978 (cited in `runtime/mgc.go:15-19`)
- Beskid: `Runtime.Mem.Gc.Collection` (`GcWriteBarrier`)
