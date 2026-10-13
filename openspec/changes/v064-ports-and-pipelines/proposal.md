## Why

0.6.3 gives fork-join only: an isolate receives its inputs at spawn and returns one result. Long-lived isolates and streaming work need messages. This change adds typed ports between isolates and pipelines built on them, and the second ORCA step so that `Shared` values cross ports by pointer. Evidence: docs/research/2026-10-13-isolate-parallelism-sota.md, docs/research/2026-10-13-isolate-compiler-requirements.md and docs/research/2026-10-13-pony-semantics-for-beskid.md; rulings 6 (amended), 11, 13 and D7, D10, D11, D13 in docs/reports/2026-10-04-v06-decisions.md are locked inputs.

## What Changes

- **Runtime.** Ports as a native bounded ring (capacity 64 by default, ruling 11) plus the existing cross-thread owner mailbox (`external_wait.h`) for wake-ups, received and sent cooperatively through `External.bd` so a waiting fiber does not block its isolate. `Shared` values cross by pointer; `Copied` (and, in 0.6.4, `Moved`) values cross through a native transit record built by the `Transit.bd` descriptor walk. Close is idempotent and drains. Builtins `__port_create`, `__port_send`, `__port_receive`, `__port_close`.
- **ORCA reference counting (step 2).** The owner keeps a local count table (LRC) whose entries protect sent objects from its sweep; in 0.6.4 every entry is immutable and is a traced root (ORCA `markimmut`); the mutable, shallow-marked case arrives with hand-over in 0.6.5. Sending increments (or, when forwarding a foreign object, inflates the sender's foreign count and posts an INC), the receiver records foreign counts, and the receiver's collector converts the foreign entries it did not reach into one DEC per owner, posted to the owner mailbox. Causality (D10): every INC and DEC for owner `P` travels through `P`'s FIFO mailbox, an INC is posted before the dependent port slot is published, and port rings are not merged into the mailbox.
- **Heap retention and adoption (D7, D11).** A joined isolate whose heap is still referenced by a third isolate is retained (no mutator, no collector, mailbox drained by its scope) and its result is copied; at scope exit every retained heap is adopted into the parent, which closes the residual leak. There is no cycle detector: isolates are scope-owned, and cross-heap object cycles are reclaimed by successive collections.
- **Corelib.** `Port<T>` (`[Immutable]` identity handle, Shared, D13) created by `s.Port<T>()` with `Send(move T)` (owning per instantiation: `move` for Moved, plain for Shared and Copied), `Receive`, `TryReceive`, `Close`, bounded back-pressure and `PortError`; `s.Isolate(body)` for a long-lived isolate serving ports it captured; the fluent pipeline `s.Source(...).Stage(...).Ordered().Sink(...)` with stage output ports handed to the next stage.
- **Language.** `memory-and-references` "Locals mut and assignment" admits a `move` parameter over a `Transferable`-bounded type parameter, judged per instantiation at the call.
- **Spec.** `channels-and-synchronization` D-EXEC-RT-0016 now states that channels connect fibers of one isolate and ports are the inter-isolate data path; the isolates capabilities gain ports, long-lived isolates, pipelines, counting, retention and the no-detector statement.

## Capabilities

### Modified Capabilities
- `core-library--concurrency--isolates-and-parallel`, `execution--runtime--isolates-and-transit`, `execution--runtime--memory-and-gc-runtime-contract`, `execution--runtime--channels-and-synchronization`, `language-meta--memory-model--memory-and-references`.

## Impact

Beskid runtime and C host (owner mailbox growth, atomics in the ring), corelib `Core.Parallel`, OpenSpec concurrency and runtime capabilities. Target release: 0.6.4. Depends on 0.6.3.

## Compatibility, Migration and Reversion

No users exist. Channels are unchanged inside an isolate and cannot cross one.
