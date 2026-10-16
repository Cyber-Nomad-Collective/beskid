## 1. Spec
- [x] 1.1 Deltas to `core-library--concurrency--isolates-and-parallel`, `execution--runtime--isolates-and-transit`, `execution--runtime--memory-and-gc-runtime-contract`, `language-meta--memory-model--memory-and-references`. Regenerate `openspec/catalog.json`.
- [x] 1.2 Re-check names against the 0.6.1 shared vocabulary and resolve open issues 1 and 5 of design.md against the 0.6.1 and 0.6.2 deltas (2026-10-13; issue 2 narrowed and kept open).

## 2. Runtime: hand-over (`execution--runtime--isolates-and-transit`)
- [ ] 2.1 Send walk: local entries per owned object, immutable leaves, enter mutable only, foreign objects decrement or inflate-and-INC before publish; `Transit.bd` agrees with the tracer on `TYPE_DESCRIPTOR_IMMUTABLE` leaves. (implemented on v06x/runtime 4d581cb2; awaiting gate)
- [ ] 2.2 Receive walk: foreign entries per object, enter mutable only, own-object decrement; receiver's write barrier covers stores into foreign mutable parents; no allocation in owner regions. (implemented on v06x/runtime 4d581cb2; awaiting gate)
- [ ] 2.3 `ParallelSeq` source by pointer under the scope root, output chunks as Moved results; pipeline Moved records by hand-over; remove the 0.6.4 Moved-through-transit-record path. (implemented on v06x/runtime 4d581cb2; awaiting gate)

## 3. Runtime: GC (`memory-and-gc-runtime-contract`)
- [ ] 3.1 Owner pass before sweep: trace immutable entries, shallow-mark mutable entries (span mark+scanned bits, large-object black), never read counted mutable fields, drop zero entries. (implemented on v06x/runtime 4d581cb2; awaiting gate)
- [ ] 3.2 Receiver marking: trace through foreign mutable, stop at foreign immutable, atomic loads of owner metadata, state only in the receiver's table, defensive first-discovery INC. (implemented on v06x/runtime 4d581cb2; awaiting gate)
- [ ] 3.3 Adoption in every case: region relink, map update, local-table transfer and merge, foreign-entry cancellation and append, mailbox drain after map update; retention only until the scope's join. (implemented on v06x/runtime 4d581cb2; awaiting gate)

## 4. Corelib `Core.Parallel` (`core-library--concurrency--isolates-and-parallel`)
- [ ] 4.1 `ParallelSeq<T>`, `Parallel.Of`, `Parallel.OfArray`, `List<T>.Parallel()` with the owner bound `where T: Transferable`, borrowed source, lazy operators as methods with inferred type arguments, terminals open a scope. (implemented on v06x/par corelib 1487f95; awaiting gate)
- [ ] 4.2 Fused per-chunk evaluation of `Where`/`Map`; `[Captures(Bound: Transferable)]` lambdas; partials adopted; `Collect` single concatenation. (implemented on v06x/par corelib 1487f95; awaiting gate)
- [ ] 4.3 `Chunk`, `MinChunk`, lazy adaptive splitting with heartbeat floor; one chunk on one isolate. (implemented on v06x/par corelib 1487f95; awaiting gate)
- [ ] 4.4 `Associative<T>`, `Commutative<T>`, `Reduce`, `ReduceUnordered`, shipped combiners (`SumI64`, `SumF64`, `MaxI64`, `MinI64`, `Concat`, `Count`), E1610 on missing contract. (implemented on v06x/par corelib 1487f95; awaiting gate)
- [ ] 4.5 Order preserved by default; determinism statement; serial execution at `BESKID_ISOLATES_MAX=1`. (implemented on v06x/par corelib 1487f95; awaiting gate)
- [ ] 4.6 Publish the cost table in the `Core.Parallel` documentation. (implemented on v06x/par corelib 4fe4b03; awaiting gate)

## 5. Language delta
- [ ] 5.1 `memory-and-references`: Moved values handed over by pointer, with the `iso` and `val` preconditions and the one-writer rule.

## 6. Evidence
- [ ] 6.1 Linux, macOS and Windows tests for every scenario: ordering, determinism of `Reduce` across isolate counts, rejected non-associative and non-commutative combiners, chunk bounds, hand-over without copy, owner shallow marking, receiver tracing through mutable graphs, no owner-heap writes, adoption with live third-party counts, three-generation adoption.
- [ ] 6.2 Data-parallel benchmarks against the serial loop and Savina fork-join; measure hand-over against copying and record the heartbeat quantum.
