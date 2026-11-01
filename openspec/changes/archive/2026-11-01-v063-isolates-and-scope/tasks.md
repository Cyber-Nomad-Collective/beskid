## 1. Spec
- [x] 1.1 New capabilities `core-library--concurrency--isolates-and-parallel` and `execution--runtime--isolates-and-transit`; deltas to `memory-and-gc-runtime-contract`, `panic-io-and-syscalls`, `fibers-and-spawn`, `memory-and-references`, `core-threading`. Regenerate `openspec/catalog.json`.
- [x] 1.2 Re-check diagnostic and marker names against the 0.6.1 shared vocabulary (2026-10-13; no new code needed).

## 2. Runtime: isolate lifecycle (`execution--runtime--isolates-and-transit`)
- [x] 2.1 Isolate creation on a second thread: `thread_create` + `IsolateCreate` (heap, callbacks, thread attach, scheduler, `ExternalInit`, limits; no pool, no composition); `IsolateDestroy`; TLS-only heap resolution audit. (implemented on v06x/runtime 5ccfcdce; verified by gate 3 on Linux x64)
- [x] 2.2 Isolate main fiber and panic outcome: entry in a fiber, `panicked` outcome, message copy-out before heap release, detached-fiber panic ends the isolate, traps stay fatal. (implemented on v06x/runtime 5ccfcdce; verified by gate 3 on Linux x64)
- [x] 2.3 Isolate cancellation slot: atomic store + owner mailbox wake, atomic load at `ApplyPendingCancels` safepoints, cancels the main fiber, idempotent. (implemented on v06x/runtime 5ccfcdce; verified by gate 3 on Linux x64)
- [x] 2.4 Composition injection fails closed inside isolates. (implemented on v06x/runtime 5ccfcdce; verified by gate 3 on Linux x64)
- [x] 2.5 `BESKID_HEAP_MAX` per isolate heap; `BESKID_ISOLATES_MAX` parse and bound, defaulting to `HostProcessorCount()` (0.6.1). (implemented on v06x/runtime 5ccfcdce; verified by gate 3 on Linux x64)
- [x] 2.6 `Transit.bd` descriptor-driven copy: visited table, cycles, arrays, UTF-8 views, bitwise scalars, fail-closed refusals, destination-only writes. (implemented on v06x/runtime 5ccfcdce; verified by gate 3 on Linux x64)
- [x] 2.7 `__isolate_spawn`, `__isolate_join`, `__isolate_join_message`, `__isolate_join_finish` builtins; `-1` at the bound; cooperative join park. (implemented on v06x/runtime 5ccfcdce; verified by gate 3 on Linux x64)
- [x] 2.8 Scoped sharing: scope-frame root handles for `Shared` captures, release at join, child treats parent pointers as foreign leaves. (implemented on v06x/runtime 5ccfcdce; verified by gate 3 on Linux x64)

## 3. Runtime: GC (`memory-and-gc-runtime-contract`)
- [x] 3.1 Foreign reference table (`Runtime/Mem/Gc/Foreign.bd`): record and epoch-stamp during marking, drop unstamped entries, native memory, no writes to the owner heap. (implemented on v06x/runtime 5ccfcdce; verified by gate 3 on Linux x64)
- [x] 3.2 Heap adoption at join: region relink, owner-map update, live-byte transfer, table merge, `Copied` result copy, discard on failure or cancellation, cap accounting. (implemented on v06x/runtime 5ccfcdce; verified by gate 3 on Linux x64)

## 4. Runtime: panic and threading deltas
- [x] 4.1 Panic containment ladder (fiber, isolate, process) per the modified D-EXEC-RT-0008. (implemented on v06x/runtime 5ccfcdce; verified by gate 3 on Linux x64)
- [x] 4.2 Isolate threads joined at process shutdown; `Core.Threading` keeps only `Yield`. (implemented on v06x/runtime 5ccfcdce; verified by gate 3 on Linux x64)

## 5. Corelib `Core.Parallel` (`core-library--concurrency--isolates-and-parallel`)
- [x] 5.1 Package and `Isolate` handle (`Current`, `Main`, equality, `[Immutable]`). (implemented on v06x/par corelib 1487f95; verified by gate 3 on Linux x64)
- [x] 5.2 `Parallel.Scope` / `ScopeWith`, join-on-every-exit, `TaskError::Joined` after scope exit, `Scope` declared `[NeverTransferable]`. (implemented on v06x/par corelib 1487f95; verified by gate 3 on Linux x64)
- [x] 5.3 `Scope.Spawn` / `Scope.SpawnTry` as generic methods called `s.Spawn(body)`, `Task<T>.Join`, `TaskFailure`, capture passing per class, elision at the bound. (implemented on v06x/par corelib 1487f95; verified by gate 3 on Linux x64)
- [x] 5.4 Structured failure: sibling cancellation, failures in spawn order, `Scope.Cancel`, `Parallel.IsCancelled`, tolerated failures as values. (implemented on v06x/par corelib 1487f95; verified by gate 3 on Linux x64)
- [x] 5.5 Nested scopes, `ScopeOptions { workers, serial }`, serial elision. (implemented on v06x/par corelib 1487f95; verified by gate 3 on Linux x64)
- [x] 5.6 `ReadOnlyArray<T>` with `Freeze(move T[])`, `Count`, `Get`, `TryGet`. (implemented on v06x/par corelib 1487f95; verified by gate 3 on Linux x64)

## 6. Language deltas
- [x] 6.1 Fibers and `spawn` isolate-local; `Fiber`, `Channel`, `Mutex`, `WaitGroup`, `Hub` are `[NeverTransferable]` (E1236 at a capture, E1610 at the bound). (implemented on v06x/lang d46d87a8, corelib df4c6e2; verified by gate 3 on Linux x64)
- [x] 6.2 Cross-isolate sharing rules in `memory-and-references` (Shared by pointer, Moved consumed, Copied deep copy). (spec delta in this change)

## 7. Evidence
- [ ] 7.1 Linux, macOS and Windows tests for every scenario above: fork-join, panic and cancellation across isolates, copies of each transfer class, cycles and shared substructure in transit, GC under load in several heaps, adoption, nested scopes at `BESKID_ISOLATES_MAX=2`, serial elision at `1`.
- [ ] 7.2 Savina-style fork-join benchmark (Imam and Sarkar, AGERE 2014) under `corelib/beskid_corelib/tests`.
