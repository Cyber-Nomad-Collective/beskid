# 11. Finalizers, cleanups, and weak references

Part of the [span GC component reference](README.md). Previous: [10 Pacing](10-pacing-and-growth.md). Next: [12 Out of memory](12-out-of-memory.md).

## Purpose

Let the program react to an object becoming unreachable (finalizer, cleanup) and hold references that do not keep an object alive (weak pointers for caches, interning, canonicalization). These hooks are the only case in which "once memory becomes unreachable, it stays unreachable" has an exception (GC guide), because a finalizer can resurrect its object.

## Data structures

**Specials** (`runtime/mheap.go`, `type special struct`): `next *special`, `offset uintptr` (byte offset within the span), `kind byte`. One sorted singly linked list per span under `mspan.speciallock`; `heapArena.pageSpecials` marks spans that have any. Kinds include finalizer (`specialfinalizer`: fn, nret, fint, ot), weak handle (`_KindSpecialWeakHandle = 3`, `runtime/mheap.go:1952`; holds a pointer to a heap-allocated `atomic.Uintptr` handle object), cleanup (`specialCleanup`), memory-profile record, reachability probe (`specialReachable`, for `runtime.KeepAlive`-style tests), pin counter, and a checkmark-debugging kind.

**Finalizer queue** (`runtime/mfinal.go:19-56`): `finBlock`s of 4 KiB in off-heap memory, each holding an array of `finalizer{fn, arg, nret, fint, ot}`; `allfin` (all blocks, a GC root scanned with `finptrmask`), `finq` (to run), `finc` (free blocks); a single goroutine `fing` runs finalizers sequentially. `SetFinalizer` semantics (`runtime/mfinal.go:372-431`): no guarantee to run before exit; may run as soon as the object is unreachable so `KeepAlive` is needed after the last use of a wrapped resource; zero-size objects and linker-allocated objects may never be finalized; tiny-allocator batching may prevent a finalizer from running; the single finalizer goroutine runs them one at a time.

**Cleanups** (`runtime/mcleanup.go:17-50`): `AddCleanup(ptr, cleanup, arg)` attaches a function that runs "some time after ptr is no longer reachable" on a separate goroutine; multiple cleanups per object are allowed; cleanups "may also run concurrently with one another (unlike finalizers)"; a cleanup runs only after any finalizer on the same object has run and the object became unreachable again; `arg` must not be `ptr`. Queued into `cleanupBlock`s, also GC roots.

**Weak pointers** (`weak.Pointer`, `runtime/mheap.go:2516-2640` `getOrAddWeakHandle`): the special points to a small heap object holding the target address; `Value()` reads it; the sweeper zeroes it when the target dies.

## Algorithm

```
SetFinalizer(obj, fn):                                 # runtime/mfinal.go
    span = spanOfHeap(obj); span.ensureSwept()          # never operate on an unswept span (09)
    addspecial(obj, &specialfinalizer{...}) inserted in offset order; set pageSpecials

marking (markrootSpans, runtime/mgcmark.go:393-497):   # roots (06)
    for each span with pageSpecials: for each special:
        finalizer: mark fn's closure; scan the object's contents (its referents survive) without marking the object
        weak handle: scan the handle word so the handle object survives
        (cleanups are scanned via the cleanup blocks root job)

sweeping (mspan.sweep, runtime/mgcsweep.go:520-600):   # (09)
    unmarked object with a finalizer special:
        set its mark bit (revive for exactly one cycle)
        queue all its finalizers (queuefinalizer) and clear its weak handles first
        ("Weak handles are cleared before finalization as specified by the weak package")
        the finalizer special is removed, so next cycle the object dies normally
    unmarked object without a finalizer:
        queue cleanups, clear weak handles, free profile specials; slot becomes free
    marked object: keep its specials (reachability probes are resolved and removed)

finalizer goroutine: wakes when the sweep is complete ("The finalizer goroutine is kicked off only
    when all spans are swept", runtime/mgc.go:103); runs finq entries one at a time
```

## Invariants

- A finalizer runs at most once per `SetFinalizer` call and only after a cycle in which the object was unreachable; the object is alive during the finalizer and can be resurrected.
- Weak handles are cleared before finalizers are queued and never observe a resurrected object through the old handle.
- Specials are always on swept spans when manipulated (`ensureSwept`).
- The finalizer's closure and arguments are roots (via `allfin`), so a finalizer never sees freed memory.

## Concurrency notes

`speciallock` per span guards the list; `finlock` guards the queue; `fing` synchronizes with the sweeper through `fingStatus`. `SetFinalizer(x, f)` "synchronizes before" `f(x)` in memory-model terms.

## How Go does it

As above. Cleanups (Go 1.24) exist because finalizers have problematic semantics (resurrection, serialization on one goroutine, no ordering, cycles never finalized); the `AddCleanup` documentation lists the constraints. Weak pointers (Go 1.24) are built on the same specials mechanism.

## Alternatives in other collectors

- **BDWGC**: `GC_register_finalizer` variants with "no order", "ignore self", and "unreachable" ordering options; finalization is topologically ordered by default (an object with a finalizer keeps its referents alive until it is finalized); disappearing links (`GC_general_register_disappearing_link`) are the weak-pointer mechanism, cleared during the mark phase.
- **JVM / .NET**: separate finalizer queue and f-reachable queue; weak, soft, and phantom references with a reference queue; resurrection allowed for finalizers (deprecated in Java 18).
- **Deterministic scoped cleanup** (RAII, Beskid's `scoped_cleanup` fixtures): release at scope exit; no GC involvement; the alternative that avoids resurrection semantics entirely.

## Beskid adaptation

Beskid has scoped cleanup (`compiler/crates/beskid_engine/tests/fixtures/scoped_cleanup*.bd`), a host handle table with generation tags (strong references from the host, a root table for [06](06-roots-and-stack-maps.md)), and no finalizers or weak references.

- **Keep**: nothing from this component is required for a correct collector. Reserve the `specials` pointer in the span record and the `pageSpecials` bit so the mechanism can be added without a layout change.
- **Simplify**: if a consumer appears, implement only "cleanup" semantics (run `f(arg)` after the object is freed, no resurrection, `arg` must not reference the object) and "weak handle" (cleared at sweep). Do not implement resurrecting finalizers.
- **Defer**: weak references until the corelib has an interning table or identity-keyed cache; cleanups until a resource type exists whose release is not scope-bound.
- **Why**: finalizers add a marking special case, a sweep special case, a revive path, and a queue that is itself a root; none of that is needed for v0.5 and deterministic scoped cleanup is the better model.

Related: [09 Sweeping](09-sweeping.md) (where specials are processed), [06 Roots](06-roots-and-stack-maps.md) (finalizer queue as a root).

## References

- `runtime/mheap.go` (`type special struct`; `addspecial`; `:1940-1960` special kinds; `:2516-2640` weak handles)
- `runtime/mfinal.go:19-60` (`finBlock`, `finalizer`, queue state), `:372-431` (`SetFinalizer` semantics)
- `runtime/mcleanup.go:17-60` (`AddCleanup` semantics)
- `runtime/mgcmark.go:221-330` (finalizer and cleanup roots), `:393-497` (`markrootSpans`)
- `runtime/mgcsweep.go:520-600` (specials in sweep)
- `runtime/mgc.go:103`
- GC guide, "Finalizers, cleanups, and weak pointers"
- BDWGC gcdescr.html and `gc.h` (finalization, disappearing links)
