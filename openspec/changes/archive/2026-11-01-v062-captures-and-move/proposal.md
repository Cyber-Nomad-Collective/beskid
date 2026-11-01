## Why

Isolates (0.6.3) must only receive values that can cross heaps, and from 0.6.5 they receive Moved graphs by pointer. 0.6.1 (`v061-attributes-and-isolate-prerequisites`) adds parameter attributes, marker contracts and `transfer_class`, but nothing yet constrains what a closure captures or ends a name's life when a value is handed over, and today's corelib lets two live `List<T>` values share one `T[]` (`List.bd:24-27`, `Storage.bd:10-15`). This change adds the language rules, with no new corelib API. By owner decision of 2026-10-13 it also makes the collector incremental: today `GcCollect` runs a whole mark and sweep inside the allocating call (`Runtime/Mem/Gc/Collection.bd:149-173`), so the pause grows with the live heap, and generated code emits no barrier for field stores (`beskid_isle/src/context/calls/collections.rs:286-289`). Evidence: docs/research/2026-10-13-isolate-parallelism-sota.md, docs/research/2026-10-13-isolate-compiler-requirements.md, docs/research/2026-10-13-pony-semantics-for-beskid.md (sections 2.2, 2.3, 3.1, 3.2) and the Pony rulings D1-D4 of 2026-10-13.

## What Changes

- **`[Captures(Bound: C)]`** on function-typed parameters (Spores, ECOOP 2014). At a call site the argument must be a lambda literal whose captures all satisfy `C`, checked through the existing `closure_captures` facts and `transfer_class`, or a function item; any other closure value is rejected (E1238). Mutable captures (E1235), rejected classes (E1236) and Moved captures without `move` (E1237) are diagnosed at the capture.
- **`move`.** A reserved keyword: the expression `move x` (consume an owning name), the parameter modifier `move T name` and the receiver modifier `move this` (D2). No `[Owned]` attribute.
- **The alias discipline (D1, full form).** Every Moved-class name is owning or borrowed. Stores, owning passes, returns, `let` aliases and `move` captures consume an owning name (use after move E1234, implicit alias E1242); borrows may read and mutate and may not escape (E1241); `move` on anything else is E1239. Branches are tracked per arm; a consume in a loop without revival is E1240.
- **Destructive read (D4).** `move x.f` for fields of `Option<T>`, `T[]` and `List<T>`, leaving the canonical empty value; `exchange(place, move v)` for every other field (E1243 otherwise). Assignment keeps its value.
- **Generalized affine analysis.** The branch-aware Fiber ownership analysis (`fiber_ownership.rs:171-303`) becomes `affine_ownership`, the single fact for Moved-class values, `move` and `Fiber`; Fiber behavior is unchanged except that use after move renders as E1234.
- **Corelib collections (D3).** Self-returning methods of `List`, `Stack`, `Queue`, `Set`, `Map`, `PriorityQueue`, `I64Map`, `StringMap` and `HashTable` take `move this`; read-only methods and `Array` functions keep borrowed receivers. Two live collection values no longer share storage.
- **ORCA preconditions.** `[Immutable]` (0.6.1) supplies deep immutability (`val`) and the alias discipline supplies external uniqueness (`iso`); the memory spec states both as the conditions under which later releases pass values by pointer (ORCA, Clebsch et al., OOPSLA 2017, https://doi.org/10.1145/3133896).
- **Tooling.** Grammar, syntax model and formatter for `move`, `exchange` and `[Captures]`; LSP hover (owning/borrowed, capture classes, bounds) and quick fixes that insert `move`.

### Incremental marking for the Beskid GC

- **Cycle.** Each heap runs its cycle on its own mutator thread, with no marker thread: mark start (barrier on, root snapshot shaded), bounded mark steps, mark termination (root rescan, barrier off), bounded sweep steps, idle. `gc_collect` still completes a whole cycle.
- **Pacing.** A cycle starts at `mark_trigger = threshold - threshold/4`; mark work is charged to allocation at span refills and large requests (debt = allocated bytes times scan estimate over runway, steps clamped to 32-256 KiB of tracing) and to every `FiberYield`; reaching the threshold completes the cycle before the heap grows. No `BESKID_GC_*` variable.
- **Barrier.** Hybrid Dijkstra-Yuasa barrier `beskid_rt_v5_gc_write_barrier(slot, value)`, called before the store, shading the old and the new value. Generated code guards every overwriting store of a GC-managed field or array element with an inline test of the process word `beskid_rt_v5_gc_barrier_active` and a cold-block call; the ISLE fact is `ManagedReferenceFact::GcManaged` on the assignment target. Root stores and initialization stores carry no barrier. `beskid_rt_v5_array_write_barrier` calls leave generated code.
- **Allocation and sweep.** Allocation in black during marking (mark and scanned bits, black large header after zeroing, which moves into `GcTryAlloc`); per-span sweep generations so that the allocator sweeps a span before it allocates from it; large objects traced in 8 KiB chunks through the span FIFO.
- **Isolate plan.** Per-heap cycle state and one process-wide barrier counter. The 0.6.3-0.6.5 ORCA rules hold; their deltas gain the incremental details (adopt black, foreign entries stamped at creation, shallow mark at send, receiver-side foreign work list).
- **Verification.** `gc_heap_set_incremental_stress`, a closure check at every termination in stress mode (trap 10), `gc_object_mark_state`, `gc_heap_force_barrier_skip`, `gc_cycle_start`, `gc_mark_step`, `gc_last_cycle_max_step_bytes`.

## Capabilities

### Modified Capabilities
- `language-meta--evaluation--lambdas-and-closures`: capture bounds, borrowing captures.
- `language-meta--memory-model--memory-and-references`: `move` modifiers and expression, owning and borrowed names, consuming uses, branch and loop rules, destructive read, ORCA preconditions.
- `language-meta--surface-syntax--lexical-and-syntax`: `move` keyword and productions.
- `language-meta--evaluation--fibers-and-spawn`: Fiber handles under the general analysis.
- `core-library--foundation-and-primitives--core-collections`: owning receivers.
- `compiler--semantic-pipeline--diagnostic-code-registry`: E1234–E1243, E1248 emitted.
- `tooling--lsp--intellisense-capabilities-and-behavior`, `tooling--formatter--verification-and-traceability`.
- `execution--runtime--memory-and-gc-runtime-contract`: D-EXEC-RT-0006 and the growth pacing requirement modified; "Span-queued marking and per-span sweep" replaced; incremental cycle, pacing, hybrid barrier, barrier emission, allocation and sweep during a cycle, roots, per-heap state and verification added.

Spec deltas are in `specs/`; grounding and open issues are in `design.md`.

## Impact

`beskid_queries` (legality, ownership, captures), grammar and syntax model, formatter, `beskid_lsp`, corelib collections and every corelib and Book example that reads a collection after a self-returning call. For the collector: `Runtime/Mem/Gc/*` (Marking, Collection, Allocation, Sweep, RootsHandles, State, Verify), `Runtime/Fiber/Scheduler/Core.bd` (`FiberYield`), `Runtime/Mem/AbiValue.bd`, `Runtime/Data/Utf8ViewRecord.bd`, `Runtime/Data/Collections.bd`, `Runtime/Bootstrap/Objects.bd`, `runtime_manifest.bsol` (`BeskidHeapState`), the ABI-v5 manifest and kit allowlist, the per-target platform support in `beskid_abi/assembly/`, and in `beskid_isle` the field and index store lowering, array literal lowering and root elision. Target release: 0.6.2. Depends on 0.6.1.

## Compatibility, Migration and Reversion

No users exist. `move` becomes a reserved word. Code that reads a collection value after `Push`, `Insert` or similar must rebind to the returned value. The Fiber-only use-after-move diagnostic is renumbered to E1234. Programs must be rebuilt with the 0.6.2 compiler: 0.6.1 lowering emits no field barrier and is unsafe under an incremental collector; canonical artifacts link the exact hash-verified runtime kit of the compiler, so no 0.6.1 artifact runs on the 0.6.2 runtime (see design, open issue 9). `gc_collect` keeps its meaning. Reversion of the collector part is the 0.6.1 `GcCollect` path with the barrier calls removed; no data format changes.
