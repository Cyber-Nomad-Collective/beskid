## 1. Spec
- [ ] 1.1 New capabilities `core-library--concurrency--isolates-and-parallel` and `execution--runtime--isolates-and-transit`; deltas to `memory-and-gc-runtime-contract`, `panic-io-and-syscalls`, `fibers-and-spawn`, `memory-and-references`, `core-threading`. Regenerate `openspec/catalog.json`.
- [x] 1.2 Re-check diagnostic and marker names against the 0.6.1 shared vocabulary (2026-10-13; no new code needed).

## 2. Runtime: isolate lifecycle (`execution--runtime--isolates-and-transit`)
- [ ] 2.1 Isolate creation on a second thread: `thread_create` + `IsolateCreate` (heap, callbacks, thread attach, scheduler, `ExternalInit`, limits; no pool, no composition); `IsolateDestroy`; TLS-only heap resolution audit.
- [ ] 2.2 Isolate main fiber and panic outcome: entry in a fiber, `panicked` outcome, message copy-out before heap release, detached-fiber panic ends the isolate, traps stay fatal.
- [ ] 2.3 Isolate cancellation slot: atomic store + owner mailbox wake, atomic load at `ApplyPendingCancels` safepoints, cancels the main fiber, idempotent.
- [ ] 2.4 Composition injection fails closed inside isolates.
- [ ] 2.5 `BESKID_HEAP_MAX` per isolate heap; `BESKID_ISOLATES_MAX` parse and bound, defaulting to `HostProcessorCount()` (0.6.1).
- [ ] 2.6 `Transit.bd` descriptor-driven copy: visited table, cycles, arrays, UTF-8 views, bitwise scalars, fail-closed refusals, destination-only writes.
- [ ] 2.7 `__isolate_spawn`, `__isolate_join`, `__isolate_join_message`, `__isolate_join_finish` builtins; `-1` at the bound; cooperative join park.
- [ ] 2.8 Scoped sharing: scope-frame root handles for `Shared` captures, release at join, child treats parent pointers as foreign leaves.

## 3. Runtime: GC (`memory-and-gc-runtime-contract`)
- [ ] 3.1 Foreign reference table (`Runtime/Mem/Gc/Foreign.bd`): record and epoch-stamp during marking, drop unstamped entries, native memory, no writes to the owner heap.
- [ ] 3.2 Heap adoption at join: region relink, owner-map update, live-byte transfer, table merge, `Copied` result copy, discard on failure or cancellation, cap accounting.

## 4. Runtime: panic and threading deltas
- [ ] 4.1 Panic containment ladder (fiber, isolate, process) per the modified D-EXEC-RT-0008.
- [ ] 4.2 Isolate threads joined at process shutdown; `Core.Threading` keeps only `Yield`.

## 5. Corelib `Core.Parallel` (`core-library--concurrency--isolates-and-parallel`)
- [ ] 5.1 Package and `Isolate` handle (`Current`, `Main`, equality, `[Immutable]`).
- [ ] 5.2 `Parallel.Scope` / `ScopeWith`, join-on-every-exit, `TaskError::Joined` after scope exit, `Scope` declared `[NeverTransferable]`.
- [ ] 5.3 `Scope.Spawn` / `Scope.SpawnTry` as generic methods called `s.Spawn(body)`, `Task<T>.Join`, `TaskFailure`, capture passing per class, elision at the bound.
- [ ] 5.4 Structured failure: sibling cancellation, failures in spawn order, `Scope.Cancel`, `Parallel.IsCancelled`, tolerated failures as values.
- [ ] 5.5 Nested scopes, `ScopeOptions { workers, serial }`, serial elision.
- [ ] 5.6 `ReadOnlyArray<T>` with `Freeze(move T[])`, `Count`, `Get`, `TryGet`.

## 6. Language deltas
- [ ] 6.1 Fibers and `spawn` isolate-local; `Fiber`, `Channel`, `Mutex`, `WaitGroup`, `Hub` are `[NeverTransferable]` (E1236 at a capture, E1610 at the bound).
- [ ] 6.2 Cross-isolate sharing rules in `memory-and-references` (Shared by pointer, Moved consumed, Copied deep copy).

## 7. Evidence
- [ ] 7.1 Linux, macOS and Windows tests for every scenario above: fork-join, panic and cancellation across isolates, copies of each transfer class, cycles and shared substructure in transit, GC under load in several heaps, adoption, nested scopes at `BESKID_ISOLATES_MAX=2`, serial elision at `1`.
- [ ] 7.2 Savina-style fork-join benchmark (Imam and Sarkar, AGERE 2014) under `corelib/beskid_corelib/tests`.
