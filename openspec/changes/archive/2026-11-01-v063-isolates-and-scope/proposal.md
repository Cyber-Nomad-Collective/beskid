## Why

With transfer classes (0.6.1) and the capture and move rules (0.6.2) in place, Beskid can run user code on a second core. This change delivers the smallest coherent parallel surface: fork-join over isolates with copied, shared and moved values. Evidence: docs/research/2026-10-13-isolate-parallelism-sota.md, docs/research/2026-10-13-isolate-compiler-requirements.md and docs/research/2026-10-13-pony-semantics-for-beskid.md; rulings 1-13 and D1-D14 in docs/reports/2026-10-04-v06-decisions.md are locked inputs.

## What Changes

- **Runtime (Beskid).**
  - A second runtime instance on its own thread through `IsolateCreate`, with the isolate entry running in a fiber so that a panic becomes a join outcome whose message is copied out before the heap is released; a cancellation slot per isolate read at the fiber safepoints; composition injection inside an isolate fails closed.
  - `BESKID_HEAP_MAX` applies per isolate heap; `BESKID_ISOLATES_MAX` bounds live isolates, defaulting to the host logical processor count from the 0.6.1 `host_processor_count` intrinsic (ruling 9). Nested scopes draw from the same pool (ruling 10); a spawn at the bound runs inline instead of blocking.
  - `Transit.bd`: descriptor-driven deep copy between heaps (Erlang style) for `Copied` captures and results, with a visited table for sharing and cycles, string payload copies and fail-closed refusal of unknown descriptors. In 0.6.3 `Moved` captures also travel through it; the sender's binding is dead, so the copy is observationally a move.
  - Builtins `__isolate_spawn`, `__isolate_join`, `__isolate_join_message`, `__isolate_join_finish`.
- **Scoped sharing (ORCA step 1, ruling 6 amended).** `Shared` captures of a `Parallel.Scope` task are passed by pointer, not copied. The scope frame roots them in the parent heap until the task is joined, so structure bounds their lifetime and no reference counts are needed. A child's collector treats parent pointers as foreign leaves (already true, `Marking.bd:110-119`) and records each foreign reference it meets during marking in the foreign reference table (`Runtime/Mem/Gc/Foreign.bd`), which 0.6.4 turns into counts.
- **Heap adoption at join (D7).** A completed task's heap regions are adopted into the parent heap: regions relink into the parent chain, the region-to-owner map is updated, tables merge. In 0.6.3 no third isolate can hold a pointer into a child heap, so the merge is always a rename and `Shared` and `Moved` results cost no copy. `Copied` results are copied. Failed and cancelled heaps are discarded whole.
- **Corelib `Core.Parallel`.** `Isolate`, `Scope`, `Task<T>`, `TaskError`, `TaskFailure`, `ParallelError`, `ScopeOptions`, `ReadOnlyArray<T>` with `Freeze(move T[])` (D5, ruling 7). `Parallel.Scope` fork-join over the isolate pool; the methods `s.Spawn(body)` and `s.SpawnTry(body)` take a `[Captures(Bound: Transferable)]` lambda and infer the task's result type from it (0.6.1 method type inference); `Scope` is `[NeverTransferable]`; a failed task cancels its siblings and the scope reports every failure in spawn order (ruling 8); serial elision at `BESKID_ISOLATES_MAX=1` or `ScopeOptions { serial: true }`.
- **Spec.** New capabilities `core-library--concurrency--isolates-and-parallel` and `execution--runtime--isolates-and-transit`; `memory-and-gc-runtime-contract` gains foreign-reference recording and heap adoption; `panic-io-and-syscalls` gains the panic containment ladder; `fibers-and-spawn` states that fibers and `spawn` stay inside one isolate; `memory-and-references` gains sharing across isolates; `core-threading` states that isolate threads are runtime-owned.

## Capabilities

### New Capabilities
- `core-library--concurrency--isolates-and-parallel`
- `execution--runtime--isolates-and-transit`

### Modified Capabilities
- `execution--runtime--memory-and-gc-runtime-contract`, `execution--runtime--panic-io-and-syscalls`, `language-meta--evaluation--fibers-and-spawn`, `language-meta--memory-model--memory-and-references`, `core-library--concurrency--core-threading`.

## Impact

Beskid runtime and C host (three targets), corelib `Core.Parallel`, OpenSpec concurrency, runtime and memory capabilities. Target release: 0.6.3. Depends on 0.6.2.

## Compatibility, Migration and Reversion

No users exist. Fibers and channels are unchanged inside an isolate. A panic inside an isolate no longer terminates the process; a panic in the main isolate still does.
