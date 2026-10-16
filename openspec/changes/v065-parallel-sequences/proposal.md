## Why

Fork-join (0.6.3) and ports (0.6.4) make parallel code possible; the fluent data-parallel surface makes it convenient. This change adds `.Parallel()` over collections with fused per-chunk loops and checked combiners, and completes ORCA with pointer hand-over of `Moved` graphs. Evidence: docs/research/2026-10-13-isolate-parallelism-sota.md, docs/research/2026-10-13-isolate-compiler-requirements.md and docs/research/2026-10-13-pony-semantics-for-beskid.md; rulings 6 (amended), 12 and D1, D7, D8, D9, D14 in docs/reports/2026-10-04-v06-decisions.md are locked inputs.

## What Changes

- **Corelib.** `ParallelSeq<T>` from `.Parallel()` on `List<T>` and `T[]`: the source is borrowed and passed by pointer under the scope root, operators are lazy methods called in the fluent form with type arguments inferred from the lambda result or combiner argument (0.6.1 method type inference, so `values.Parallel().Map((x) => x * x).Reduce(0_i64, SumI64 {})`), `Where`/`Map` fuse into one pass per chunk, `Chunk`/`MinChunk` bound chunk sizes, default splitting is lazy and adaptive with a heartbeat-derived floor, `Reduce` requires an `Associative<T>` combiner and `ReduceUnordered` an `Associative<T>` and `Commutative<T>` combiner (**E1610** otherwise), results are ordered by default, `ReduceUnordered` is the explicit opt-out, and one isolate gives serial deterministic execution (ruling 12). Shipped combiners: `SumI64`, `SumF64`, `MaxI64`, `MinI64`, `Concat`, `Count`.
- **ORCA hand-over (step 3, completes ORCA; D8, D9).** Moved values (`move` captures, `Port.Send(move x)`, pipeline records, `ParallelSeq` output chunks) cross by pointer: the graph stays in the sender's heap. At send the sender traces the graph and gives every owned object a count entry (immutable sub-objects are leaves); at receive the receiver traces it and records foreign entries (entering mutable objects only). The receiver's collector traces through foreign mutable objects and stops at foreign immutable ones, keeps all state in its own table, reads owner metadata with atomic loads and never writes the owner heap. The owner's collector traces immutable counted entries and shallow-marks mutable ones through the span mark and scanned bitmaps (large objects: header black), never reading a field another isolate may write. The former task 2.4 ("which collector traces a handed-over mutable graph") is answered by D8 and D9 and recorded in design.md.
- **Adoption in every case (D7).** A completed task's heap is adopted at join even when a sibling holds counts into it: local entries transfer to the parent, the region-to-owner map is updated and the child's mailbox is drained; holders resolve owners through the map, so no id forwarding is needed. The 0.6.4 retention fallback remains only until the scope's own join of an isolate that exited while siblings run.
- **Combiner contracts.** `Associative<T>` and `Commutative<T>` as marker contracts on combiner types (no compiler change); the markers are declarations, not proofs.
- **Cost table (D14).** Published honestly: Shared O(1) plus O(roots) at receive; Moved O(1) transfer plus O(objects) tracing at send and at receive; Copied O(size); task results O(1) for Shared and Moved by adoption.
- **Spec.** Parallel sequences, ordering and determinism, the cost table, hand-over at send and receive, the owner and receiver collector rules, adoption in every case, and the memory-model statement that Moved values keep their identity under the `iso` and `val` preconditions.

## Capabilities

### Modified Capabilities
- `core-library--concurrency--isolates-and-parallel`, `execution--runtime--isolates-and-transit`, `execution--runtime--memory-and-gc-runtime-contract`, `language-meta--memory-model--memory-and-references`.

## Impact

Corelib `Core.Parallel`, Beskid runtime GC (`Marking.bd`, `Foreign.bd`, adoption), OpenSpec concurrency, runtime and memory capabilities. Target release: 0.6.5. Depends on 0.6.3 and 0.6.4 (ports, counts, causal mailbox).

## Compatibility, Migration and Reversion

No users exist. The 0.6.4 behavior of copying Moved values through ports is removed; the static rules do not change.
