# v0.5 Foundations: implementation plan and design research

## Decision

Foundation must be delivered as one vertically sliced runtime migration before
Networking starts. It is not safe to treat fibers, channels, timers, `use`, and
Core.IO as independent tickets: they all require a single ownership model for a
generic value that can outlive the producer, and Networking is explicitly
prohibited from adding an alternate completion, timeout, cleanup, or
partial-transfer path.

The release order should be: (1) settle the normative contradiction, (2) prove
the typed ABI-value/rooting seam, (3) migrate fibers and channels onto it, (4)
replace scheduler completion/timers, (5) lower scoped cleanup, (6) establish
Core.IO, and only then admit Networking. Each phase should land with its own
JIT, AOT, and native-runtime-kit evidence; there is no compatibility mode for
the scalar paths.

## Evidence and current state

| Area | Contract to close | Current implementation evidence | Consequence |
| --- | --- | --- | --- |
| Generic fiber result | `Fiber<T>` must keep result/captures rooted for its whole lifetime. | `BeskidFiberRecord.outcome_value` is `i64` and `__fiber_join_value` returns `i64` ([manifest](../../compiler/runtime_manifest.bsol#L476-L484), [layout](../../compiler/runtime_manifest.bsol#L1366-L1366)); `Fiber.Join` directly returns that scalar as `T` ([corelib](../../compiler/corelib/packages/concurrency/src/Concurrency/Fiber.bd#L15-L24)). | Aggregates, references, and resource handles cannot be represented safely. |
| Spawn lowering | Spawn must produce a `Fiber<T>` handle, never synchronously compute the child result. | ISLE allocates a closure environment and invokes `beskid_rt_v5_fiber_spawn_with_cancel_slot`, but discards its result and then calls the trampoline directly ([calls.rs](../../compiler/crates/beskid_isle/src/context/calls.rs#L524-L566)). | Current lowering has no usable typed handle/result ownership path. |
| Capture semantics | Heap-rooted captures are accepted; stack references are rejected. | The type checker rejects any lambda reference to an outer local ([spawn.rs](../../compiler/crates/beskid_analysis/src/types/checker/spawn.rs#L112-L174)), while generation-safe query facts and codegen capture-environment logic already exist ([closures_spawn.rs](../../compiler/crates/beskid_queries/src/semantic_contract/closures_spawn.rs#L315-L454), [calls.rs](../../compiler/crates/beskid_isle/src/context/calls.rs#L402-L439)). | The compiler is overly conservative and must connect semantic transfer classification to the existing rooted closure environment. |
| Channel transport | One traced ABI-value record must hold queued, parked, and delivered generic values. | The core channel entry points carry `i64` ([manifest](../../compiler/runtime_manifest.bsol#L1037-L1088)); runtime `Channel.bd` says it is an `i64` queue ([Channel.bd](../../compiler/runtime/beskid/src/Runtime/Sync/Channel.bd#L1-L12)) and has a separate pointer-handle Phase B path ([Channel.bd](../../compiler/runtime/beskid/src/Runtime/Sync/Channel.bd#L282-L338)). | Scalar and pointer values follow different ownership/GC paths; aggregates and opaque resources have neither a single representation nor a delivery guarantee. |
| Channel close/cancel | Commit ownership must be explicit; close rejects later sends but drains commits. | `ChannelClose` calls `ChannelDrain`, zeroing/de-rooting queued values ([Channel.bd](../../compiler/runtime/beskid/src/Runtime/Sync/Channel.bd#L199-L237)). Send retries a scalar after parking, so it has no stored pre-/post-commit value state ([Channel.bd](../../compiler/runtime/beskid/src/Runtime/Sync/Channel.bd#L110-L121)). | Directly violates close-after-drain and makes cancellation/resource ownership unprovable. |
| Scheduler completions | External worker completion must use owner-ID inbound command plus owner wake; external waits suppress false deadlock. | Syscalls park a fiber and register a worker request ([Syscalls.bd](../../compiler/runtime/beskid/src/Runtime/Io/Syscalls.bd#L42-L70)); the manifest worker request has no owner scheduler ID, wait generation, or terminal source ([manifest](../../compiler/runtime_manifest.bsol#L1349-L1351)). Current deferred wakes are a scheduler-local fixed queue ([Queue.bd](../../compiler/runtime/beskid/src/Runtime/Fiber/Scheduler/Queue.bd#L84-L116)). | There is no contract-bearing cross-scheduler handoff, no active external-wait accounting, and no race arbitration. |
| Timers | Absolute monotonic deadline + generation; exactly-one readiness/close/cancel/timeout winner. | `FiberNowMillis` exposes a monotonic clock ([Fiber.bd](../../compiler/runtime/beskid/src/Runtime/Fiber/Fiber.bd#L84-L90)), but no canonical timer registration/cancellation implementation appears in `Runtime/Fiber/`; scheduler layout has no timer fields ([manifest](../../compiler/runtime_manifest.bsol#L1369-L1369)). | Networking cannot reliably implement timeouts or distinguish a real deadlock from external I/O. |
| Scoped disposal | `use Type name = expression` must have lexical ownership and reverse, exactly-once Result-aware cleanup. | Parser reserves `use`, but the current task specifies a new scoped AST and semantic/lowering work ([tasks](../../openspec/changes/beskid-v0-5-foundations/tasks.md#L20-L28)); Foundation has no `Core/Disposable` or `Core/IO` directory. | There is no canonical resource lifetime or partial-transfer API to consume in Networking. |
| Core.IO / syscall typing | Core.IO owns transfer/EOF/no-progress/close; `ReadBytesWith` returns bytes. | No Foundation `Core/IO` or `Core/Disposable` package exists; `ReadBytesWith` is presently declared `Result<i64, SyscallError>` ([Syscall.bd](../../compiler/corelib/packages/foundation/src/Core/Syscall/Syscall.bd#L153-L155)). | Networking would otherwise grow a second, incompatible I/O contract. |

### Normative baseline and blocking decision

The proposed Foundation change is the immediate authority for this plan until it
is promoted. It requires a rooted bindable `spawn`, one traced channel record,
owner-routed completions, monotonic generation-tagged timers, scoped cleanup,
and Core.IO ([proposal](../../openspec/changes/beskid-v0-5-foundations/proposal.md#L3-L27)).

Before code work, resolve its explicit `FiberError` contradiction. The design
notes that the proposed narrow payloads conflict with the existing closed,
richer `FiberError` API and task 2.3's instruction not to change it
([design](../../openspec/changes/beskid-v0-5-foundations/design.md#L122-L153)).
Recommendation: retain the current rich fields, including diagnostic context;
make the required panic code `2` a value constraint rather than removing the
message field. This is source-compatible and supports the required scheduler
observability.

## Target architecture

### 1. One typed ABI-value descriptor and root discipline

Define an ABI-v5 `BeskidAbiValue` record with a tag, payload storage sufficient
for scalar/pointer/aggregate/opaque-handle forms, and descriptor/root metadata
needed to trace it. The concrete record fields should be defined once in
`compiler/runtime_manifest.bsol`, generated into the ABI contract, and consumed
by canonical `compiler/runtime/beskid` sources, generated ISLE facts, JIT, AOT,
and native-kit tests. Do not expose one builtin per payload kind.

The record needs four operations only: initialise from a typed value; trace or
write-barrier on replacement; move out on ownership transfer; clear/drop at the
current owner. A `FiberRecord` contains one result record and one capture-env
root; each channel queue cell, pending sender, and receive receipt contains the
same record. This removes both `i64` truncation and the pointer side channel.

The existing GC and capture components make this realistic: the runtime already
has root handles and external roots in its manifest, and codegen already
allocates and roots a closure environment. The missing work is to make the
rooted record live across the fiber/channel state transitions rather than only
inside a generated function.

### 2. Fiber state and spawn

Make the codegen `emit_spawn` result be a `Fiber<T>` value containing the
runtime-returned generation-safe fiber handle. The child trampoline writes one
typed result record and atomically changes its terminal state; it does not
return the child value into the spawning call frame. `Join` consumes the handle
at the language level, waits for the terminal state, moves the record into the
caller result, and clears the record exactly once. `Detach` consumes the same
join capability; `Cancel` changes a request flag only and remains idempotent.

Semantic work should split capture safety precisely:

- Preserve `StackReferenceEscapesSpawn` for references to caller stack slots.
- Allow a captured scalar, managed reference, aggregate, or opaque handle only
  when its ABI-value transfer plan is materialised into the rooted environment.
- Diagnose discarded non-detached fibers and uses after `Join`/`Detach`; keep
  the existing join-deadlock scope check as additional protection.

The source of truth is `spawn_legality_tracked` / closure facts in
`beskid_queries`, rather than a second ad-hoc type-checker capture walk. This
fits the repository's generation-bound semantic-facts policy and avoids drift.

### 3. Channel commit protocol

Represent each queued value as an ABI value plus ownership state. Under one
channel lock, a sender either (a) owns the uncommitted value, (b) atomically
commits it to a queue cell, or (c) learns the channel is closed. A cancelled
pre-commit sender retains the value; post-commit cancellation returns the
cancel status while the channel remains owner until exactly one receive moves
the record out. Close sets a durable closed bit, wakes waiters, and permits
drain; it never drains/disposes committed records simply because it closed.

The lock protects commit/queue/waiter registration only. Before parking, unlink
or mark the waiter and release the lock; after wake, reacquire and re-evaluate
state. This directly matches the Foundation requirement and avoids the current
bitset/fixed-table model becoming the accidental semantics.

Industry corroboration: Tokio documents buffered drain after close, and its
permit model treats capacity reservation as a distinct ownership boundary
([Tokio bounded mpsc source](https://docs.rs/tokio/latest/src/tokio/sync/mpsc/bounded.rs.html)).
Tokio also documents that cancelling `send` loses the message unless ownership
is preserved separately; Beskid's stronger contract therefore needs the
explicit pre-/post-commit state instead of retrying a raw argument
([Tokio Sender](https://docs.rs/tokio/latest/tokio/sync/mpsc/struct.Sender.html)).

### 4. Owner-routed completion and monotonic timer service

Add a stable scheduler ID and a thread-safe inbound command queue to the
canonical scheduler state. A submission records `{ownerSchedulerId, fiber
handle/generation, waitGeneration, operation}` before raising the
active-external-wait counter. An adapter completion only posts a command to that
owner queue and signals the owner wake primitive. The scheduler drains commands
on its own thread and invokes the one terminal-transition operation.

Make every terminal source call `try_complete(waitId, generation, source)`: I/O
readiness, close, cancellation, deadline and duplicate notification. Its
compare-and-set selects exactly one winner; only the winner removes adapter
registration, decrements external-wait accounting if applicable, and queues the
fiber. A stale generation is a no-op. Emit diagnostics containing owner ID,
wait generation, winner, and active count exactly as the design requires.

Timers use monotonic absolute deadlines, a min-heap (or timer wheel only after
the heap is correct), registration generation, and cancellation invalidation.
`FiberNowMillis` is a suitable public precursor but not a timer service. Rust's
`Instant` similarly uses platform monotonic clocks (including `CLOCK_MONOTONIC`,
`CLOCK_UPTIME_RAW`, and `QueryPerformanceCounter`) and warns that it is for
elapsed time rather than wall-time meaning ([Rust `Instant`](https://doc.rust-lang.org/nightly/std/time/struct.Instant.html)).

### 5. `use`, `Disposable`, and Core.IO

First add a distinct scoped-binding parse node while preserving `use
Package.Module;` imports. Semantic analysis resolves `Disposable.Dispose() ->
Result<unit, DisposeError>`, prohibits escape, requires a `Result<T,E>`
enclosing callable, and records one explicit cleanup conversion. Lowering must
use a single cleanup-region stack and produce reverse-order edges on fallthrough,
return, `?`, and structured exits. It must select the first reverse cleanup
failure over a pending `?` error without silently discarding either result.

Then add `Core.Disposable` and `Core.IO` as foundation contracts. `Reader`,
`Writer`, `Closer`, and `Stream` own all partial transfer policy; their helpers
must validate ranges before work, bypass zero-length transfer, treat EOF and
no-progress distinctly, and make close idempotent. Correct `ReadBytesWith` to
`Result<u8[], SyscallError>` in corelib, manifest/generated ABI, JIT and AOT at
the same time. Do not add networking-specific loop helpers.

## Delivery plan and acceptance gates

| Slice | Prerequisite | Exact seams | Demonstrable exit criteria |
| --- | --- | --- | --- |
| F0: baseline | Resolve `FiberError`; validate proposed change. | `openspec/changes/beskid-v0-5-foundations/{design,tasks}.md`; catalog only when the governing release change says so. | Strict OpenSpec validation; no unresolved contradictory closed API. |
| F1: ABI/root record | F0 | `runtime_manifest.bsol`; generated `beskid_abi`; `Runtime/Mem/*`, `Runtime/Fiber/*`, ISLE ABI facts. | JIT/AOT/native: queued `u8[]`, aggregate fiber result, and Foundation-local `OwnedResource` survive forced collection and transfer once. Remove scalar/pointer service families only after these pass. |
| F2: spawn/fiber | F1 | `beskid_analysis` parser/type diagnostics; `beskid_queries::closures_spawn`; `beskid_isle::context::calls`; codegen trampolines; `Runtime/Fiber`; concurrency corelib. | Bound `spawn` returns a joinable `Fiber<T>`; heap capture survives GC; stack capture fails; double Join and Join-after-Detach fail statically; cancel, panic code 2, and main shutdown pass in JIT/AOT/native. |
| F3: channels | F1 and F2's waiter primitive | `Runtime/Sync/Channel.bd`; manifest services; Concurrency `Channel*.bd`; channel fixtures. | Aggregate/resource queue matrix; cancellation on both sides of commit; close-after-drain; blocked sender resumes after receiver; no held lock while parked. |
| F4: scheduler/timers | F2 | `Runtime/Fiber/Scheduler/{Storage,Queue,Poll,Loop}.bd`, `Runtime/Io/Syscalls.bd`, manifest state/request layouts, target adapters. | Cross-thread owner wake; runnable sibling advances during external wait; no false deadlock; cancelled timer's late generation is ignored; repeated readiness/timeout/cancel/close race produces one resume. |
| F5: scoped lifetime | F0, F1 | parser/AST, semantic facts, generated ISLE control-flow lowering, `Core/Disposable`. | Parser ambiguity tests; non-disposable/non-Result/missing-or-ambiguous-conversion diagnostics; nested LIFO exactly-once cleanup on return, `?`, and exits; cleanup error precedence. |
| F6: Core.IO | F5 | `Core/IO`, `Core/Syscall`, Bytes/Encoding; manifest and ABI generation. | `ReadExact`/`WriteAll` partial, EOF, zero progress/range, idempotent-close, `ReadBytesWith` typing, strict codecs across JIT/AOT/native. |
| F7: release gate | F1–F6 | Corelib tests, analysis/codegen tests, runtime-kit tests, OpenSpec evidence matrix. | `just corelib`, `just compiler`, focused JIT/AOT/native Foundation examples, strict OpenSpec checks; only then open Networking implementation. |

## Test strategy

The present corelib tests are API smoke tests: Channel tests exercise `i64` and
idempotent close ([ChannelApiTests](../../compiler/corelib/beskid_corelib/tests/corelib_tests/src/concurrency/ChannelApiTests.bd#L7-L65)); Fiber tests use invalid handles only
([FiberHandleTests](../../compiler/corelib/beskid_corelib/tests/corelib_tests/src/concurrency/FiberHandleTests.bd#L7-L23)). Retain them but add semantic, runtime, JIT, AOT, and native tests named in the proposed evidence matrix
([design](../../openspec/changes/beskid-v0-5-foundations/design.md#L45-L116)).

The high-value race suite should be deterministic: use a test-only manual clock
and adapter completion barrier to arrange every pair of
`{ready, close, cancel, timeout, duplicate}`. Assert one terminal event, one
dequeue/transfer, one external-wait decrement, and zero stale-generation
effects. Run each matrix many times under native kits; a one-off happy-path
test will not establish correctness.

The implementation may use atomics for terminal selection, but it must specify
success/failure memory ordering alongside the transition. `compare_exchange`
has distinct success and failure ordering requirements
([Crossbeam Atomic documentation](https://docs.rs/crossbeam/latest/crossbeam/epoch/struct.Atomic.html)); that decision belongs in the runtime design, not implicit target code.

## Risks and controls

- **ABI drift:** Manifest, generated ABI JSON/header, corelib service declarations,
  canonical runtime source and codegen must change in one slice. Add a negative
  test that rejects remaining `__channel_*_ptr`, scalar `__channel_send`, and
  scalar `__fiber_join_value` as public transport paths.
- **GC unsoundness:** A root that is cleared before post-commit cancellation or
  before Join moves the result causes non-deterministic collection. Force a GC
  cycle at every ownership edge in the acceptance fixtures.
- **Lost or double completion:** Never expose direct `WakeEnqueue` to adapters;
  make the winner transition the only public scheduler completion entry.
- **Semantic/codegen drift:** Existing type-checker and Salsa capture paths are
  parallel partial authorities. Consolidate spawn legality in the queries and
  consume generated facts in lowering.
- **Unbounded default mismatch:** The public API calls default channels
  unbounded, while current runtime maps capacity 0 to a physical limit of 16
  ([Channel.bd](../../compiler/runtime/beskid/src/Runtime/Sync/Channel.bd#L34-L71)). Resolve this as part of the Channel contract: either implement actual dynamic
  unbounded storage with documented memory risk, or revise the public contract
  before release; do not silently retain a bounded fake-unbounded queue.
- **Scope expansion:** Keep native socket handles, DNS, TCP/UDP, and HTTP out of
  this work. The Foundation proposal explicitly reserves them for later
  changes.

## Sources

Primary repository sources are linked inline. External design references are
limited to official Rust/Tokio/Crossbeam documentation:

- [Rust `Instant`](https://doc.rust-lang.org/nightly/std/time/struct.Instant.html)
- [Tokio bounded mpsc source](https://docs.rs/tokio/latest/src/tokio/sync/mpsc/bounded.rs.html)
- [Tokio `Sender`](https://docs.rs/tokio/latest/tokio/sync/mpsc/struct.Sender.html)
- [Tokio runtime scheduling](https://docs.rs/tokio/latest/tokio/runtime/)
- [Crossbeam `Atomic`](https://docs.rs/crossbeam/latest/crossbeam/epoch/struct.Atomic.html)
