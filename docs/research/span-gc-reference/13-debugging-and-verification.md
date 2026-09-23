# 13. Debugging and verification aids

Part of the [span GC component reference](README.md). Previous: [12 Out of memory](12-out-of-memory.md). Next: [90 Beskid minimum viable set](90-beskid-minimum-viable-set.md).

## Purpose

Make GC bugs fail loudly and early: a missed root, a wrong pointer map, a dangling pointer, a missing barrier, or a sweep that frees a live object should be caught by an assertion in a test run, not by silent corruption in production.

## Data structures

- `checkmarksMap` (`runtime/mcheckmark.go:22-30`): per arena, one bit per word, used as a shadow mark bitmap; enabled by `GODEBUG=gccheckmark=1`.
- `debug` (`runtime/runtime1.go:302-395`): GODEBUG knobs `gccheckmark`, `gcstoptheworld` (1 = STW mark, 2 = STW mark and sweep), `gctrace`, `invalidptr` (default 1), `clobberfree`, `sbrk` (trivial bump allocator, no GC), `scavtrace`, `checkfinalizers`, `cgocheck`, `allocfreetrace` (removed in favor of the tracer).
- `clobberdeadPtr` (compiler `-clobberdead`; `runtime/mbitmap.go:1370-1378` recognizes it in `findObject`).
- Constants that gate internal double-checking: `doubleCheckMalloc`, `doubleCheckGreenTea`, `_DebugGC`, `debugScanConservative`, `stackDebug`, `testSmallBuf`.
- Per-size-class scan statistics (`sizeClassScanStats`, `runtime/mgcmark_greenteagc.go:1103-1160`): spans and objects scanned on the dense and sparse paths, sparse single objects; dumped at `gctrace=2`.

## Algorithm

```
checkmark pass (runtime/mcheckmark.go; invoked from gcMarkTermination, runtime/mgc.go:1365):
    with the world stopped, after the real mark:
        startCheckmarks(): allocate/clear checkmarks bitmaps; useCheckmark = true
        re-run root marking and a full drain, but greyobject sets bits in checkmarks and
        throws if it finds an object that is reachable now but was not marked by the real pass
        endCheckmarks()
    (async preemption is disabled in this mode so the check scan is precise, runtime1.go:444-457)

invalid pointer check (runtime/mbitmap.go:1308-1400):
    findObject(p, refBase, refOff): if p lands in a free span, a manual span with invalidptr, or
        outside [base, limit): badPointer -> prints the referrer object (gcDumpObject), the span
        state, and throws "found bad pointer in Go heap"
    greyobject under gccheckmark: throw "marking free object" with dumps of base and obj

zombie check (runtime/mgcsweep.go, in sweep): any gcmarkBits &^ allocBits bit above freeindex ->
    reportZombies: prints the span and each zombie slot; throws "found pointer to free object"

clobber on free (GODEBUG=clobberfree=1, runtime/mgcsweep.go:960-980): fill each freed slot with 0xdeadbeef

clobber dead (compiler -clobberdead, plive.go:942-1104): after a variable's last use the compiler
    stores clobberdeadPtr into every pointer word of dead locals and args, so a stale stack slot
    cannot keep an object alive; the runtime crashes if such a pointer is dereferenced or scanned

gctrace=1 (runtime/mgc.go:1577-1600): one line per cycle:
    gc N @T.TTTs P%: STW+mark+STW ms clock, CPU split ms cpu, heapStart->heapEnd->live MB, goal MB,
    stacks MB, globals MB, P count   (fields verified in the print statement)
```

Other aids: `runtime/heapdump.go` (`debug.WriteHeapDump`) dumps every object with its type and pointer bits; the execution tracer records GC phase transitions, per-span sweep events (`trace.GCSweepSpan`), and object alloc/free when enabled; `runtime/metrics` exposes counters; `-live`/`-live=2` print stack maps at safe points ([06](06-roots-and-stack-maps.md)); race, msan, asan, and valgrind hooks annotate allocation and free; `GODEBUG=gcstoptheworld` bisects concurrency bugs; `GODEBUG=sbrk=1` rules the collector out entirely.

The assertion density in the runtime is itself a verification aid: `mspan.sweep: bad span state`, `swept cached span`, `refill of span with free space remaining`, `span has no free space`, `produced a trigger greater than the heap goal`, `sweep increased allocation count`, `g already scanned`, `missing stackmap`, `bad symbol table`, `gcDrain phase incorrect`, `noscan object in scanSpan`, `failed putFast after drain`, `spanQueue.destroy during the mark phase`.

## Invariants (what the aids check)

- Every reachable object is marked (checkmark).
- Every pointer the marker follows lands in an allocated slot of an in-use span (invalidptr, zombie check).
- Nothing in a freed slot is read afterwards (clobberfree).
- Stack slots the compiler considers dead really are dead (clobberdead).
- Span state transitions follow the protocol (throws).

## Concurrency notes

Checkmark runs during STW so it is immune to barrier bugs and therefore detects them. Clobberfree runs in the sweeper under its span ownership. Trace and metrics readers use atomics or STW snapshots.

## How Go does it

As above. The Green Tea `doubleCheckGreenTea` constant guards layout assertions (object pointer alignment, marks equal scans at sweep) that are off in release builds; `debug.gctrace > 1` enables the per-class statistics without a rebuild.

## Alternatives in other collectors

- **BDWGC**: `GC_DEBUG` builds add object headers with allocation site and a guard word, `GC_debug_malloc` checks for smashed objects, `GC_dump` prints heap statistics; `GC_find_leak` mode reports unreachable objects instead of freeing them.
- **MMTk / Immix**: a "sanity GC" that re-marks the heap with a simple collector after each real collection and compares live sets, the same idea as checkmark.
- **HotSpot**: `-XX:+VerifyBeforeGC/-XX:+VerifyAfterGC` walks the heap checking oop validity and card table consistency.
- **Poisoning and quarantine** (ASAN-style): keep freed memory out of reuse for a while and trap on access.

## Beskid adaptation

Beskid has a 64-byte diagnostic buffer, a `GC_PHASE_FAILED` state, and descriptor validation (`ValidateTypeDescriptor`) during marking, which already acts as a cheap invalid-pointer check.

- **Keep**: descriptor validation at every dereference in test mode; the typed failure record.
- **Add (minimum set for v0.5)**:
  1. A heap verifier under a test flag, run after every cycle: for every in-use span, `marks ⊆ alloc`, `allocCount == popcount(alloc)`, `freeindex` consistent, `limit` inside the span; for every allocated object, every pointer field resolves via `findObject` to an allocated slot; every root-stack, handle-table, and global-root entry resolves too.
  2. Poisoning of freed slots and of the first words of freed spans with a recognizable pattern, behind a runtime flag.
  3. A stress mode "collect at every N-th allocation" (Go's `heapMinimum = 0` behavior via `GOGC=0`) to shake out missing roots in the engine and codegen tests.
  4. A per-cycle trace line: live bytes and objects, spans and pages in use, spans freed, pause time.
- **Defer**: checkmark-style double marking (only useful once marking is incremental and a barrier exists); heap dumps.
- **Drop**: sanitizer integration, tracer integration beyond the trace line.
- **Why**: the verifier plus stress mode catch the two bug classes a new precise collector will have (missed roots, wrong descriptors) at test time; everything else is tooling for concurrency.

Related: [03 Spans](03-spans.md) (invariants the verifier checks), [07 Marking](07-marking-green-tea.md), [09 Sweeping](09-sweeping.md).

## References

- `runtime/mcheckmark.go:5-60`
- `runtime/runtime1.go:302-460` (GODEBUG variables and defaults)
- `runtime/mbitmap.go:1308-1400` (`badPointer`, `findObject`)
- `runtime/mgcmark.go:1639-1660` (`greyobject` checks), `gcDumpObject`
- `runtime/mgcsweep.go` (zombies, `clobberfree` at 973)
- `cmd/compile/internal/liveness/plive.go:942-1104` (clobberdead), `:7-13` (`-live`)
- `runtime/mgc.go:1365` (checkmark invocation), `:1577-1600` (`gctrace`)
- `runtime/mgcmark_greenteagc.go:1103-1160` (scan statistics)
- `runtime/heapdump.go`
- BDWGC gcdescr.html and debugging documentation
