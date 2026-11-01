## 1. Spec
- [x] 1.1 Deltas to `core-library--concurrency--isolates-and-parallel`, `execution--runtime--isolates-and-transit`, `execution--runtime--memory-and-gc-runtime-contract`, `language-meta--memory-model--memory-and-references` (modified "Locals mut and assignment" chained after 0.6.2); modified `channels-and-synchronization` D-EXEC-RT-0016. Regenerate `openspec/catalog.json`.
- [x] 1.2 Re-check names against the 0.6.1 shared vocabulary and the 0.6.2 `move`-parameter rules (2026-10-13; former open issues 1 and 5 closed in design.md).

## 2. Runtime: ports (`execution--runtime--isolates-and-transit`)
- [x] 2.1 Port ring: native bounded ring, atomic claim and publish, owner-mailbox wake-ups, FIFO per port, slot = ABI value + class tag, `Copied`/`Moved` through a native transit record built by the `Transit.bd` walk. (implemented on v06x/runtime 5ccfcdce, 4d581cb2; verified by gate 3 on Linux x64)
- [x] 2.2 Fiber-cooperative receive and send through `ExternalWaitRegister`/`ExternalWaitPark`; back-pressure; cancellation completes the wait with `EXTERNAL_CANCELLED`. (implemented on v06x/runtime 5ccfcdce, 4d581cb2; verified by gate 3 on Linux x64)
- [x] 2.3 Close and drain semantics; scope closes its ports after joining; ids never reused; no trap on closed ports. (implemented on v06x/runtime 5ccfcdce, 4d581cb2; verified by gate 3 on Linux x64)
- [x] 2.4 Builtins `__port_create`, `__port_send`, `__port_receive`, `__port_close` with status codes 0/1/2 and `-1` on allocator refusal. (implemented on v06x/runtime 5ccfcdce, 4d581cb2; verified by gate 3 on Linux x64)
- [x] 2.5 Long-lived isolate runtime support: spawn index for `Scope.Isolate`, close-ports-then-join, cancel on failure or `Scope.Cancel`. (implemented on v06x/runtime 5ccfcdce, 4d581cb2; verified by gate 3 on Linux x64)
- [x] 2.6 Causal count delivery: INC before slot publish, DEC after consumption and collection, owner mailbox FIFO, mailbox growth without trap. (implemented on v06x/runtime 5ccfcdce, 4d581cb2; verified by gate 3 on Linux x64)

## 3. Runtime: GC (`memory-and-gc-runtime-contract`)
- [x] 3.1 Owner LRC table: create/increment on send and INC, decrement on DEC and own-object receive, LRC>0 immutable entries traced before sweep, drop at zero. (implemented on v06x/runtime 5ccfcdce, 4d581cb2; verified by gate 3 on Linux x64)
- [x] 3.2 Receiver side: FRC increment at receive, inflate-and-INC on forward, epoch stamp during marking, one DEC per owner (resolved through the region-to-owner map) after marking, live-byte inflation for foreign entries. (implemented on v06x/runtime 5ccfcdce, 4d581cb2; verified by gate 3 on Linux x64)
- [x] 3.3 Heap retention after exit when a third isolate holds a count; mailbox drained at the scope's joins and exit; result copied; adoption of retained heaps at scope exit; cap accounting. (implemented on v06x/runtime 5ccfcdce, 4d581cb2; verified by gate 3 on Linux x64)
- [x] 3.4 No cycle detector; structural lifetime statement; cross-heap object cycles reclaimed by successive collections; residual-leak closure at scope exit. (implemented on v06x/runtime 5ccfcdce, 4d581cb2; verified by gate 3 on Linux x64)

## 4. Corelib `Core.Parallel` (`core-library--concurrency--isolates-and-parallel`)
- [x] 4.1 `Port<T>` handle (`[Immutable]`, Shared), `s.Port<T>()`, `s.PortWith<T>(capacity)`, `where T: Transferable` on the creating methods and as owner bound on `Port<T>`'s methods, closed by the scope. (implemented on v06x/par corelib 1487f95; verified by gate 3 on Linux x64)
- [x] 4.2 `Send(move T)`, `Receive`, `TryReceive`, `Close`, `PortError`, back-pressure and drain behavior; per-instantiation `move` rule for `move T` parameters in the affine analysis (E1242 for Moved without `move`, E1239 for `move` on Shared or Copied). (implemented on v06x/lang ff28bb88, v06x/par corelib 1487f95; compiler rule covered by the legality lane test; verified by gate 3 on Linux x64)
- [x] 4.3 `s.Isolate(body)` long-lived isolate with inbox pattern, `Isolate.Cancel`, failure as task failure. (implemented on v06x/par corelib 1487f95; verified by gate 3 on Linux x64)
- [x] 4.4 `s.Source`, `PipelineStage<T>.Stage`, `.Ordered`, `.Sink` with inferred `T` and `U`; port hand-off between stages; failure cancels stages. (implemented on v06x/par corelib 1487f95; verified by gate 3 on Linux x64)
- [x] 4.5 `Shared` values cross ports by pointer (same address, constant-time send, validity after owner drops or exits). (implemented on v06x/par corelib 1487f95; verified by gate 3 on Linux x64)

## 5. Channels delta
- [x] 5.1 Channels stay inside one isolate; ports are the only inter-isolate data path besides captures and results; happens-before for ports. (spec delta in this change)

## 6. Evidence
- [ ] 6.1 Linux, macOS and Windows tests for every scenario: FIFO and back-pressure, close and drain, cancelled waits, worker inbox, pipelines ordered and unordered, stage failure, count tables and DECs, forwarded INC-before-DEC, retention and adoption at scope exit, two-heap cycle.
- [ ] 6.2 Savina-style ping-pong benchmark across two isolates.
