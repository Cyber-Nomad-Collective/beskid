# 12. Out-of-memory handling and diagnostics

Part of the [span GC component reference](README.md). Previous: [11 Finalization](11-finalization-and-weak-refs.md). Next: [13 Debugging and verification](13-debugging-and-verification.md).

## Purpose

Define what happens when the heap cannot grow: which failures are fatal, which are reported to the program, what state is recorded so the failure is diagnosable, and how a soft limit keeps the collector ahead of the hard one.

## Data structures

Go has no OOM record beyond what it prints: the request size and `heapFree + heapReleased + heapInUse` from the pacer (`runtime/mheap.go:1575-1580`). Diagnostics in steady state come from `memstats`/`runtime/metrics` and `GODEBUG=gctrace=1` (`runtime/mgc.go:1577-1600`), whose per-cycle line carries: cycle number, seconds since start, GC CPU percent, wall-clock and CPU time for sweep termination, mark, and mark termination (with assist/background/idle split), heap size at start, at end, and live after marking, the goal, stack and globals scan sizes, and P count.

Beskid's current heap state (`Runtime.Mem.Gc.State`) records `failure_reason` (`HEAP_FAILURE_CAP_REACHED`, `SYSTEM_ALLOCATE_FAILED`, `REQUEST_LARGER_THAN_CAP`), `failure_request_bytes`, a 64-byte `diagnostic` buffer, `cap_bytes`, `committed_bytes`, `live_bytes`, `live_count`, `collection_count`, `collection_threshold`, and `gc_phase` (with `GC_PHASE_FAILED`).

## Algorithm

```
Go:
    mheap.grow(npages) -> sysAlloc fails ->
        print("runtime: out of memory: cannot allocate ", ask, "-byte block (", inUse, " in use)")
        return false                                            # runtime/mheap.go:1575-1580
    mheap.allocSpan -> nil -> mcentral.grow -> nil -> mcache.refill: throw("out of memory")   # mcache.go:222
    mcache.allocLarge -> nil -> throw("out of memory")
    metadata allocation failures throw immediately:
        "out of memory allocating heap arena map" / "... heap arena metadata" / "... allArenas"   # malloc.go:866-896
    throw = fatal runtime error with traceback; not recoverable by Go code

Beskid (Runtime.Mem.Gc.Allocation, "Decision 3"):
    GcAlloc(size): try current span/region; else collect; else grow (respecting cap and region schedule);
        else record failure_reason + request bytes + diagnostic; gc_phase = FAILED; typed exhaustion trap
```

The soft limit is the mechanism that keeps a program from reaching the hard failure: Go's memory-limit heap goal ([10](10-pacing-and-growth.md)) lowers the goal as mapped memory approaches `GOMEMLIMIT`, with a CPU cap of roughly 50% so a program near the limit does not spend all its time collecting (GC guide, "Memory limit").

## Invariants

- Go: a failed heap growth after a full GC is fatal; there is deliberately no allocation-failure return to Go code.
- Go: metadata (arena map, `heapArena` records) is allocated before the pages it describes, so a span never exists without its lookup entries.
- Beskid: `GcAlloc` never returns null for a valid request; failure is a typed trap with a recorded reason (`Runtime.Mem.Gc.Allocation` header comment).

## Concurrency notes

Go's OOM print and throw happen under `mheap_.lock` on the system stack; the throw stops the world. For Beskid's single thread the record-then-trap sequence needs no synchronization, but the record must be written before the trap so the host can read it.

## How Go does it

As above. Go leans on the soft memory limit for graceful degradation and on `debug.SetMemoryLimit`, `debug.SetGCPercent`, and `runtime/metrics` (`/gc/heap/goal:bytes`, `/memory/classes/*`) for observability. There is no per-allocation failure path because a Go program that cannot allocate cannot make progress anyway.

## Alternatives in other collectors

- **BDWGC**: `GC_malloc` returns NULL on failure after retrying a collection, and `GC_oom_fn` can be set to a handler; heap growth is bounded by `GC_set_max_heap_size`.
- **JVM**: `OutOfMemoryError` is a catchable exception, thrown after a full GC fails to free enough; heap bounded by `-Xmx`.
- **.NET**: `OutOfMemoryException`, similar; `GCHeapHardLimit` bounds the heap.
- **Typed trap to a host** (Beskid today): the runtime records the reason and traps; the embedding host decides. This is closest to the JVM model in information content without unwinding semantics inside the language.

## Beskid adaptation

- **Keep**: the typed exhaustion contract and the recorded reason. It is strictly more useful than Go's opaque throw for a runtime with a host and a defined ABI.
- **Simplify**: extend the diagnostic record with the span-level facts an operator needs to distinguish fragmentation from exhaustion: spans in use per size class, pages in use, largest free page run, live bytes after the last cycle, current trigger and goal, cycles run, and whether the failing request was small or large. Keep the record fixed-size (extend the 64-byte buffer to a versioned struct in `runtime_manifest.bsol`).
- **Add**: the soft goal from [10](10-pacing-and-growth.md) so the collector runs earlier as the cap approaches; a "collect and retry once" step before trapping for large requests, which Go does implicitly through `reclaim` before `grow`.
- **Drop**: nothing; there is no Go machinery here worth porting beyond the print format.
- **Why**: OOM is a support problem; the value is in the record, not the mechanism.

Related: [01 Address space](01-address-space-and-pages.md) (`grow`), [13 Debugging](13-debugging-and-verification.md) (trace lines).

## References

- `runtime/mheap.go:1553-1640` (`grow`)
- `runtime/malloc.go:741-900` (`sysAlloc`, metadata OOM throws)
- `runtime/mcache.go:222` (`refill` OOM throw), `:242` (`allocLarge`)
- `runtime/mgc.go:1577-1600` (`gctrace` format)
- GC guide, "Memory limit"; "A note about virtual memory"
- Beskid: `Runtime.Mem.Gc.State` (failure fields, `HEAP_FAILURE_*`), `Runtime.Mem.Gc.Allocation` (Decision 3), `compiler/runtime_manifest.bsol`
