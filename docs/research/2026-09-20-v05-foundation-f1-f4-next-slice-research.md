# v0.5 Foundation F1–F4: next closure slice research

Date: 2026-09-20  
Scope: the current `compiler-v05-foundations-runtime` worktree at
`09b8cb5c`, the proposed `beskid-v0-5-foundations` OpenSpec change, and the
focused local evidence recorded below. This is a research record, not a claim
that the whole Foundation release gate is complete.

## Decision

Implement **F3 acceptance hardening for an actually disposable opaque
resource**, then run the cross-platform Foundation evidence gate. Do not start
a new ABI, fiber, channel, or scheduler implementation slice.

F1–F4 already have one canonical implementation route and focused local proof.
The smallest remaining dependency-correct code gap in those four areas is that
the channel fixture's alleged `OwnedResource` is an `i64` wrapper, not a
`Disposable`. It therefore cannot establish the required ownership invariant:
channel transfer does not implicitly dispose a resource during enqueue, claim,
cancellation, close, or drain. The new fixture must reuse the canonical
`Core.Disposable` contract and existing traced ABI/channel path; it must not
add a resource side channel, duplicate disposal logic in `Channel`, or add a
compatibility transport.

The following scheduler/timer code is already implemented and has native
proof; a public `Sleep`/timeout API is not yet a justified next implementation
task because no such corelib surface is specified. Keep its design decision
separate from the resource-ownership proof.

## Normative and plan baseline

| Slice | Required contract | Current authority | Conclusion |
| --- | --- | --- | --- |
| F1 | One traced root-preserving ABI value for generic fiber/channel transport. | `BSP-REQ-075328D8F9ED` and `BSP-REQ-D00CFBE68D28`; change task 3.1–3.2. | Implemented; retain it as the only transport. |
| F2 | Bindable `spawn`, typed handle, transferable captures, and consuming lifecycle. | `BSP-REQ-075328D8F9ED`, `BSP-REQ-EBF704693274`, `BSP-REQ-8CE166C9D003`; task 2.1–2.3 and 3.1. | Implemented and locally exercised; no replacement slice. |
| F3 | Channel values/receipt use the traced representation; one commit point; close drains; parked operations unlock. | `BSP-REQ-D00CFBE68D28`, `BSP-REQ-6D7DDA9E739B`, `BSP-REQ-3B24A87BD7B8`, `BSP-REQ-987344126476`; task 3.2. | Canonical path exists. The required opaque *disposable* resource evidence is still missing. |
| F4 | Owner-routed completion, active wait accounting, monotonic generation-tagged timers, and one winner. | `BSP-REQ-B206035816D3`, `BSP-REQ-6CF93216D4C9`, `BSP-REQ-52284EABE5E1`, `BSP-REQ-896BA6C917E9`, `BSP-REQ-A371B8519429`; task 3.3–3.4. | Canonical path and native race proof exist. Public timer API remains a separately specified surface decision. |

All 22 work items in the proposed change's `tasks.md` remain unchecked at the
time of research. That checklist state prevents source presence or a focused
test from being treated as full Foundation acceptance; it does not invalidate
the completed canonical implementations below.

## Codebase facts

| Fact | Primary evidence | Consequence |
| --- | --- | --- |
| ABI value layout is a single manifest-defined record; fiber records embed result and capture slots. | `compiler/runtime_manifest.bsol:1362-1402` | F1 has one shape shared through the ABI; a new channel/resource record would create prohibited drift. |
| ABI slots register a GC root at initialization, move by rooting destination before clearing source, and clear exactly once. | `compiler/runtime/beskid/src/Runtime/Mem/AbiValue.bd:41-96` | All ownership fixtures must move through `AbiValue*`, never copy scalar payload bits. |
| Fiber allocation roots capture environments and terminal completion roots the typed result; cleanup clears both slots. | `compiler/runtime/beskid/src/Runtime/Fiber/Scheduler/Core.bd:230-250,540-591` | F2 correctly depends on F1's one record rather than an unrooted capture/result path. |
| `Fiber<T>.Join` consumes the runtime result through `__fiber_join_value<T>`; `Detach` and `Cancel` preserve their established signatures. | `compiler/corelib/packages/concurrency/src/Concurrency/Fiber.bd:5-44` | Do not change the closed `FiberError` or handle API while hardening F3 evidence. |
| Generation-bound query facts classify transferable captures and reject stack references; source tests cover that distinction. | `compiler/crates/beskid_queries/src/semantic_contract/closures_spawn.rs:186-273`; `compiler/crates/beskid_queries/tests/semantic_facts/closures_and_spawn.rs:722-781` | F2 has the required semantic authority; a second type-checker capture policy would violate the repository's query authority convention. |
| A channel moves a traced slot under its lock, records Sender-to-Channel ownership, moves a claim into the exclusive receipt, and restores an unresolved receipt on terminal cleanup. | `compiler/runtime/beskid/src/Runtime/Sync/Channel.bd:97-227,229-287` | F3 already has one commit/receipt route. The missing proof must exercise it, not redesign it. |
| The public channel facade already documents pre-/post-commit ownership and maps generic values through `ChannelValue<T>`. | `compiler/corelib/packages/concurrency/src/Concurrency/Channel.bd:12-73` | A disposable resource should be transported as an ordinary `T`; no `Channel<Disposable>` special API is warranted. |
| The channel source fixture calls its type `OwnedResource`, but defines only `i64 token`; it has no `Dispose` method or observable disposal count. | `compiler/crates/beskid_engine/tests/fixtures/channel_value_transfer.bd:12-16,48-69`; `channel_receipt_value_transfer.bd:18-22,38-71` | This is insufficient for the OpenSpec resource scenario. It proves typed aggregate transport, not resource non-disposal. |
| The canonical disposable contract already exists and the accepted IO fixture demonstrates a concrete `TestStream` implementation. | `compiler/corelib/packages/foundation/src/Core/Disposable.bd:4-8`; `compiler/crates/beskid_engine/tests/fixtures/foundation_io.bd:67-90` | Reuse this contract in a Foundation-local channel fixture. Do not place lifecycle behavior in Core.IO or the channel runtime. |
| Owner state accepts inbound commands, registrations carry owner/fiber/generation, `ExternalTryComplete` is the sole claim/count-down/wake path, and timers use a deadline heap. | `compiler/runtime/beskid/src/Runtime/Fiber/Scheduler/External.bd:1-175,177-237` | F4's intended one-route model is implemented: external sources post, only the owner claims and wakes. |
| The scheduler pumps commands and timers before choosing a runnable fiber, and waits on the owner only while external work is active. | `compiler/runtime/beskid/src/Runtime/Fiber/Scheduler/Loop.bd:4-79` | No separate worker-local completion loop should be added. |
| The native fixture covers cross-thread posts, all ordered winner pairs, stale generation, timer cancellation/order, sibling progress, cancellation, and shutdown. | `compiler/crates/beskid_engine/tests/fixtures/external_wait.c:29-120,192-292`; `external_wait_native.rs:12-105` | F4 lacks neither a timer heap nor a race fixture. Its remaining release gap is matrix evidence, not a second implementation. |

## Focused evidence run

The following commands were run from
`/Users/mikserek/Projects/beskid/compiler-v05-foundations-runtime` on the
local macOS host. These tests build the canonical runtime, then exercise JIT,
AOT, and native-kit paths where named:

| Command | Result | What it establishes |
| --- | --- | --- |
| `cargo test -p beskid_queries --test semantic_facts closures_and_spawn -- --nocapture` | 26 passed | F2 generation-safe spawn/capture/lifecycle semantic facts. |
| `cargo test -p beskid_engine --test fiber_value_transfer -- --nocapture` | 4 passed, 54.29 s | F1/F2/F3 typed values and cancellation through JIT, AOT, and native kit. |
| `cargo test -p beskid_engine --test external_wait_native -- --nocapture` | 1 passed, 93.30 s | F4 owner-wake/timer winner evidence through AOT, native kit, and JIT. |

The local linker emitted existing macOS deployment-target warnings from
Tree-sitter/Ring object files; each named test completed successfully. These
host results do **not** prove Linux and Windows runtime-kit behavior. The
available remote hosts currently lack the LLVM/clang components required to
stage native kits, so that is an environment/evidence blocker rather than a
reason to weaken the runtime design.

## Recommended next slice: F3 disposable-resource acceptance

### Scope

1. Replace the fixture-only scalar `OwnedResource` test double with a
   Foundation-local concrete type that implements `Core.Disposable` and has a
   visible, deterministic dispose counter.
2. Add fixtures covering the existing channel boundaries: queued then closed
   and drained; sender cancellation before commit; cancellation after commit;
   receiver claim followed by cancellation/terminal cleanup; and ordinary
   receive transfer.
3. Assert exactly one ownership move to the receiving fixture and **zero
   implicit `Dispose` calls** from channel enqueue, close, claim, cancellation,
   or receipt recovery. An explicit consumer `Dispose` should be the only
   event that increments the counter.
4. Execute that same fixture via the existing JIT/AOT/native-kit harness.
   Keep the existing GC collections at ownership edges.

### Explicit non-goals

- No change to `BeskidAbiValue`, `Channel`, `Fiber`, ABI manifest services, or
  scheduler implementation unless the new acceptance test exposes a concrete
  defect.
- No `Channel`-specific disposal protocol, resource pointer service, scalar
  fallback, or Core.IO duplication.
- No public `Sleep`, timeout, or timer facade until an OpenSpec/corelib design
  gives it an API and error/cancellation contract. The internal
  `ExternalSleepUntil` is not a substitute public surface.

### Why this precedes a public timer surface

F3 directly depends only on the already landed F1 record and F2's receiver
cleanup, and it closes an explicitly assigned OpenSpec evidence hole without
altering public behavior. A timer facade would introduce a new public contract
and needs its own design decisions around return type, cancellation ownership,
and composability. Starting it first would broaden scope while leaving the
required channel resource proof indirect.

After this fixture is accepted, make the next work **F7 Foundation acceptance**:
run strict OpenSpec validation, parser/semantic/codegen/corelib suites, and the
same runtime fixtures on macOS, Linux, and Windows native kits. Record each
missing tool as a failed readiness condition, never as a skipped success.

## Sources

- `openspec/changes/beskid-v0-5-foundations/{proposal.md,design.md,tasks.md}`
- `openspec/changes/beskid-v0-5-foundations/specs/`
- `compiler/runtime_manifest.bsol`
- `compiler/runtime/beskid/src/Runtime/{Mem/AbiValue.bd,Fiber/Scheduler/External.bd,Fiber/Scheduler/Loop.bd,Sync/Channel.bd}`
- `compiler/crates/beskid_engine/tests/{fiber_value_transfer.rs,external_wait_native.rs,fixtures/}`
