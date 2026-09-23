# 10. Pacing, triggering, and heap growth

Part of the [span GC component reference](README.md). Previous: [09 Sweeping](09-sweeping.md). Next: [11 Finalization and weak references](11-finalization-and-weak-refs.md).

## Purpose

Decide when to start a cycle so that GC CPU time and peak memory stay in the intended ratio, and, for a concurrent collector, how much marking to do per unit of allocation so the cycle finishes before the heap goal is exceeded. Heap growth (mapping more memory) is a separate mechanism that pacing influences only through the goal.

## Data structures

`gcControllerState` (`runtime/mgcpacer.go:92-370`), selected fields:

| Field | Meaning |
|-------|---------|
| `gcPercent atomic.Int32` | GOGC; `-1` (off) is treated as 100000 in the goal |
| `memoryLimit atomic.Int64` | GOMEMLIMIT; `MaxInt64` means none |
| `heapMinimum uint64` | minimum heap at which to trigger: `defaultHeapMinimum` (4 MiB, or 512 KiB under `HeapMinimum512KiB`) scaled by GOGC/100 |
| `heapMarked` | live bytes at the last mark termination |
| `heapLive` | bytes considered live now (marked + allocated since; cached spans counted whole) |
| `heapScan`, `lastHeapScan`, `stackScan`, `globalsScan` | scannable bytes, the marginal cost driver |
| `gcPercentHeapGoal atomic.Uint64` | goal derived from GOGC |
| `runway atomic.Uint64` | bytes of allocation the cycle is expected to need |
| `consMark` | estimated ratio of allocation rate to scan rate, smoothed by a PI controller |
| `assistWorkPerByte`, `assistBytesPerWork`, `bgScanCredit` | assist accounting |
| CPU time counters per worker kind | for the memory-limit CPU cap and metrics |

Constants (`runtime/mgcpacer.go:16-76`, `:1170-1180`): `gcBackgroundUtilization = 0.25`; `gcGoalUtilization = gcBackgroundUtilization`; `gcCreditSlack = 2000`; `gcOverAssistWork = 64 KiB`; `memoryLimitHeapGoalHeadroomPercent = 3`, minimum 1 MiB; `triggerRatioDen = 64`, `minTriggerRatioNum = 45` (about 0.7), `maxTriggerRatioNum = 61` (about 0.95). `forcegcperiod = 2 minutes` (`runtime/proc.go:6476`).

## Algorithm

The model (GC guide): "Target heap memory = Live heap + (Live heap + GC roots) * GOGC / 100", where GC roots are goroutine stacks and global pointer data; "Doubling GOGC will double heap memory overheads and roughly halve GC CPU cost"; and "GC CPU time for cycle N = Fixed CPU time cost per cycle + average CPU time cost per byte * live heap memory found in cycle N". `runtime/mgc.go:108-115` restates it: at GOGC=100 with 4 MB in use, collect again at 8 MB.

```
heapGoal():                                                  # runtime/mgcpacer.go:993-1045
    goal = gcPercentHeapGoal      # heapMarked + (heapMarked + stackScan + globalsScan) * GOGC/100,
                                  # floored at heapMinimum
    if memoryLimit set: goal = min(goal, memoryLimitHeapGoal())
                                  # limit - (mapped non-heap memory) - max(3% of that, 1 MiB)
    minTrigger = at least the sweep distance (so the heap can be fully swept before the trigger)

trigger():                                                   # runtime/mgcpacer.go, trigger
    if heapMarked >= goal: return (goal, goal)               # degenerate: back-to-back cycles
    minTrigger = max(minTrigger, heapMarked + 45/64 * (goal - heapMarked))
    maxTrigger = heapMarked + 61/64 * (goal - heapMarked); or goal - 4 MiB for large heaps
    trigger = goal - runway; clamp to [minTrigger, maxTrigger]
    throw if trigger > goal

gcTrigger.test():                                            # runtime/mgc.go, gcTrigger
    gcTriggerHeap:  heapLive >= trigger                      # evaluated at span refill (04)
    gcTriggerTime:  now - lastGC > forcegcperiod             # 2 minutes, from sysmon
    gcTriggerCycle: runtime.GC() asked for cycle n

commit() at mark termination (gcControllerCommit):
    measure this cycle: scan work done, allocation during the cycle, CPU utilization
    consMark = smooth(allocation bytes per CPU-second / scan bytes per CPU-second)   # PI controller
    runway = consMark * (heapScan + stackScan + globalsScan) * (1 - utilization) / utilization  (bounded)
    recompute gcPercentHeapGoal and the trigger for the next cycle
```

**Assists** (`deductAssistCredit` in `mallocgc`; `gcAssistAlloc`, `runtime/mgcmark.go:499-700`): during a cycle each allocating goroutine owes `assistWorkPerByte * bytes`; it first steals background credit (`bgScanCredit`, flushed by workers via `gcFlushBgCredit`), else marks itself (`gcDrainN`), else parks until credit appears. `gcOverAssistWork` prepays 64 KiB of future allocation to amortize. The guide: cumulative assist time above about 5% "indicates that the application is likely out-pacing the GC". Proposal 44167 set the background target to 25% "eliminating GC assists in the steady-state" by making the pacer aim for zero assists.

**Memory limit** (guide, "Memory limit"): a soft limit on `Sys - HeapReleased`; the runtime "makes no guarantees that it will maintain this memory limit under all circumstances"; to avoid death spirals "the GC sets an upper limit on the amount of CPU time it can use over some time window... roughly 50%, with a 2 * GOMAXPROCS CPU-second window". The limit also drives the scavenger to return memory.

**Heap growth**: `mheap.grow` maps more arena space whenever the page allocator cannot satisfy a request after `reclaim` ([01](01-address-space-and-pages.md), [09](09-sweeping.md)); it is not gated by pacing.

## Invariants

- `heapMarked <= trigger < goal`; the trigger sits 70-95% of the way from live to goal (`runtime/mgcpacer.go:1170-1180`).
- The goal includes stacks and globals since Go 1.18 (proposal 44167), so root-heavy programs get proportional runway.
- `heapLive` overestimates between cycles (whole cached spans count) because underestimates cost memory (`runtime/mcache.go` refill comment, issue 53738).
- GOGC=off with a memory limit still collects when the limit-derived goal is reached.

## Concurrency notes

Pacer fields are atomics updated from allocation paths with slack (`gcCreditSlack`, `gcAssistTimeSlack`, `maxStackScanSlack`) to limit contention; `gcControllerCommit` runs during STW; `enlistWorker` wakes background workers when work appears.

## How Go does it

As above; the design history is in proposal 44167 (Go 1.18 pacer) and https://golang.org/s/go15gcpacing (Go 1.5). Key decisions: optimize for zero assists at 25% background utilization; measure the cons/mark ratio rather than predicting it; include non-heap scan work in the goal; treat the memory limit as a second goal with a CPU cap.

## Alternatives in other collectors

- **BDWGC**: collects when allocation since the last GC exceeds a fraction of the heap (`GC_free_space_divisor`, default 3: collect after allocating heap/3), grows the heap when a collection frees less than a threshold; no concurrency pacing.
- **Immix / MMTk**: a fixed or dynamically tuned heap size triggers a collection when the allocator cannot find a block; MMTk's default is "collect when the heap is full".
- **Generational collectors**: nursery size fixed; young collections when the nursery fills; old-generation triggers similar to GOGC.
- **Fixed-ratio STW** (many simple runtimes): `next = live * factor`, floored; this is exactly Go's rule without runway and assists.

## Beskid adaptation

Today (`Runtime.Mem.Gc.State`): `collection_threshold` starting at 512 KiB (`HEAP_MIN_THRESHOLD`), region sizes doubling from 1 MiB to 64 MiB, a hard cap (`HEAP_DEFAULT_CAP` = 1 GiB), and typed exhaustion reasons; the threshold policy is "Decision 2 of the growable-heap design".

- **Keep**: a GOGC-style rule: `trigger = max(minHeap, liveAfterLastGC * (1 + GOGC/100))` where `live` includes root-stack and global bytes if they are significant; evaluate at span refill and at large allocations, not per object; a periodic trigger only if the runtime has an idle loop. Keep the hard cap as the out-of-memory boundary ([12](12-out-of-memory.md)).
- **Simplify**: add a soft goal near the cap: `goal = min(GOGC goal, cap - non-heap mapped - headroom)`, so the collector runs more often before hitting the cap instead of trapping. No CPU limiter is needed because the collector is STW.
- **Drop**: assists, background utilization, `consMark`, runway, the PI controller, CPU-time accounting. They exist only to finish a concurrent cycle on time.
- **Why**: the GOGC rule is the whole cost model for a STW collector; everything else is concurrency control.

Related: [04 Allocation](04-allocation.md) (where the trigger is tested), [12 Out of memory](12-out-of-memory.md).

## References

- `runtime/mgcpacer.go:16-76` (constants), `:82-370` (`gcControllerState`), `:371` (`init`), `:993-1045` (`heapGoal`, `heapGoalInternal`), `:1047` (`memoryLimitHeapGoal`), `trigger`, `:1170-1180` (trigger ratio constants)
- `runtime/mgc.go:108-115` (GC rate), `gcTrigger`, `gcControllerCommit`
- `runtime/mgcmark.go:499-700` (`gcAssistAlloc`), `gcFlushBgCredit`
- `runtime/proc.go:6476` (`forcegcperiod`)
- `runtime/mcache.go:160-240` (`heapLive` overestimate)
- GC guide: https://go.dev/doc/gc-guide (GOGC, memory limit, cost model, assists)
- Proposal 44167: https://github.com/golang/proposal/blob/master/design/44167-gc-pacer-redesign.md
- Beskid: `Runtime.Mem.Gc.State` (thresholds, cap), `Runtime.Mem.Gc.Collection`
