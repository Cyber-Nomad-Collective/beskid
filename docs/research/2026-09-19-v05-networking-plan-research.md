# v0.5 networking: current-state research and closure plan

**Date:** 2026-09-19  
**Scope:** CYB-61 / `beskid-v0-5-networking`, after CYB-60 Foundations.  
**Authority:** checked-in `openspec/specs` is normative once a change lands;
`openspec/changes/beskid-v0-5-networking` is the proposed delta. This note is
implementation planning, not a substitute for accepting that delta.

## Decision summary

Networking should begin only when Foundations has a green, cross-target proof
of generic resource transport, owner-routed completion, monotonic deadlines,
one-winner waits, `Disposable`, and `Core.IO`. CYB-61 must add **one** socket
lifecycle, rather than adapting the current blocking syscall seam or creating
a Rust-side reactor:

```text
Network public operation
  -> manifest-generated private builtin
  -> Runtime.Network socket table + operation record
  -> platform adapter (epoll | kqueue | IOCP)
  -> Foundation owner-scheduler inbound command
  -> Foundation atomic terminal winner
  -> one fiber resume and idempotent deregistration
```

This sequence preserves the proposed requirement that neither raw descriptors
nor platform error codes cross into public Beskid values. It also makes late
kernel events harmless: a queued event must prove the `(slot, generation)` and
operation registration are still current before it can compete for the shared
terminal transition.

## Codebase facts

| Area | Checked-in current state | Planning consequence |
| --- | --- | --- |
| Proposed networking contract | All 20 CYB-61 task boxes are unchecked. Its proposal says no public DNS/TCP/UDP API or socket lifecycle ABI exists. [Proposal](../../openspec/changes/beskid-v0-5-networking/proposal.md), [tasks](../../openspec/changes/beskid-v0-5-networking/tasks.md) | Treat Networking as new implementation work, not an integration of a hidden existing subsystem. |
| Canonical runtime | `compiler/runtime/beskid/src/Runtime/` has `Fiber`, `Sync`, `Io`, `Host`, `Mem`, and `PubSub`; there is no `Runtime/Network/` directory. `Runtime/Io/Syscalls.bd` has a tagged blocking-worker read/write seam. | Add a new canonical `Runtime/Network/**` implementation. Do not extend raw `SyscallRead`/`SyscallWrite` into a public socket API. |
| ABI route | `compiler/runtime_manifest.bsol` already generates corelib-service signatures such as `__fiber_spawn`, `__fiber_join_value`, `__channel_*`, plus target-bound host intrinsics. `beskid_manifest` validates that source and `beskid_abi` generates symbols/contracts. | Socket operations must be added to this one manifest-to-generated-ABI chain. Hand-written Cranelift imports and direct target entry points violate `BSP-REQ-B094EDC16A72`. |
| Existing scheduler evidence | `Runtime/Fiber/Scheduler/Poll.bd` already shows a generation-tagged task handle and a single terminal-claim/publish shape, but it is an in-place poll executor, not an external I/O reactor. | Reuse the Foundation final winner/owner-command abstraction, not this pre-Foundation implementation verbatim and not a parallel wake loop. |
| Public packages | `compiler/corelib/packages/` contains foundation, concurrency, runtime, console, interop, glue, etc.; there is no `network` package. Foundation presently lacks the CYB-60 `Core.IO`/`Disposable` contract promised by its unchecked tasks. | Create `corelib_network` only after the Foundation package exports those contracts. It depends on Foundation; it should not become a dependency of Foundation. |
| Platform target path | The manifest uses three platform bindings: `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, and `x86_64-pc-windows-msvc`; C platform objects live under `compiler/crates/beskid_abi/assembly/<target>/`. AOT/runtime-kit tests already exist in `beskid_aot`, `beskid_engine`, and `beskid_abi`. | Put the narrow native adapter implementations in the same target-object/runtime-kit path and test JIT, AOT, and installed native kits for all three targets. |
| Existing standard constraints | The runtime standard requires cooperative M:N fibers and parking on blocking syscalls; channels are the only cross-fiber data path. [fiber scheduler](../../openspec/specs/execution--runtime--fiber-scheduler-and-stacks/spec.md), [channels](../../openspec/specs/execution--runtime--channels-and-synchronization/spec.md) | Kernel/backend threads must publish native completion metadata to the owner scheduler; they must never resume a fiber or run generated Beskid code directly. |

### Exact missing or new implementation surfaces

These paths are absent today unless marked existing. Names below are a file
plan; final builtin names must be generated from the accepted manifest rather
than copied manually.

| Layer | New or changed surface | Responsibility |
| --- | --- | --- |
| Manifest and generated ABI | `compiler/runtime_manifest.bsol` (existing), `compiler/crates/beskid_manifest/**` (existing), `compiler/crates/beskid_abi/**` (existing) | Declare private socket creation/configuration/operation/close and platform-reactor intrinsics; generate one signature, symbol registry row, target import allowlist, header/audit, and runtime-kit parity data. |
| Canonical runtime | **new** `compiler/runtime/beskid/src/Runtime/Network/{Types,Handles,SocketTable,Operation,Reactor,Completion,Dns,Tcp,Udp,Diagnostics}.bd` | Own public-opaque-to-native mapping, generation validation, in-flight direction slots, native submission, deregistration, close, completion adaptation, and leak audit. Exact file split can vary, but these responsibilities must remain under one `Runtime.Network` owner. |
| Foundation integration | Foundation-owned scheduler command, timer, cancellation, blocking-pool, root/ABI-value mechanisms under `Runtime/Fiber/**`, `Runtime/Io/**`, manifest, codegen, and corelib Foundation | CYB-61 consumes these APIs only. It must not duplicate timer state, a worker-local wake queue, a partial-I/O helper, or resource channel transport. |
| Native adapter objects | **new or extended** `compiler/crates/beskid_abi/assembly/x86_64-unknown-linux-gnu/platform_host.c`, `.../aarch64-apple-darwin/platform_host.c`, `.../x86_64-pc-windows-msvc/platform_host.c` (or target-local companion source selected by the existing build) | Make only OS calls and native buffer/registration work. Return opaque event/completion data; retain no scheduler authority and expose no public ABI. |
| Public corelib | **new** `compiler/corelib/packages/network/{corelib_network.bproj,README.md,src/Network/{Types,Errors,Dns,Tcp,Udp}.bd}` | Supply portable types and facades only. `TcpStream` implements Foundation `Core.IO.Stream`; all resources implement Foundation `Core.Disposable`; UDP deliberately does not implement `Stream`. |
| Proof | **new focused fixtures** in runtime/corelib/manifest/ABI/JIT/AOT/runtime-kit test suites | Prove generation reuse, close/readiness/cancel/deadline races, resolver late-result discard, stream and datagram semantics, public API opacity, leak audits, and target backend selection. |

## Required design, reconciled with platform mechanics

### 1. Handle and lifecycle model

Represent an exposed resource as an opaque two-word conceptual key
`(slot, generation)`; it may be packed internally but must not become a public
integer constructor. A `SocketTable[slot]` owns the native socket only while
its generation matches and state is live. It also records kind, owner scheduler
ID, backend registration identity, one read/receive operation slot, one
write/send operation slot, and (for listeners) one accept slot.

Closing takes the single live-to-closing transition, first invalidates the
generation, removes native registration/cancels pending native work, settles
each operation through Foundation's one-winner transition, then releases the
native resource. Repeated close and late backend delivery see invalid state and
do no user-visible work. This directly implements
`BSP-REQ-3D4E0AE8B901`, `BSP-REQ-F902B81D6E4C`, and
`BSP-REQ-8A21D67C43FE`.

This is not optional defensive complexity. `epoll(7)` cautions that events may
remain after an fd is removed/closed if processing a previously collected
event batch; it recommends marking the associated structure removed while
processing cached events. [Linux epoll manual](https://man7.org/linux/man-pages/man7/epoll.7.html)
The proposed generation check is the portable form of that rule and also
protects reused table slots and delayed IOCP completion packets.

### 2. One operation state and one completion path

Every operation record must contain at least operation kind, resource
`(slot,generation)`, owner scheduler/fiber, direction reservation, Foundation
wait/winner registration, optional deadline registration, native submission
identity, and native buffer ownership. The only completion entry point:

1. validates socket generation and operation registration;
2. converts the native outcome to a typed intermediate result;
3. posts a Foundation owner-scheduler command and wakes that owner;
4. has the owner attempt the Foundation atomic terminal transition;
5. lets the winning transition deregister timer/native interest and release
   native staging buffers; losers release only their own transient data.

Readiness, completion, close, cancellation, and timeout are all competitors
for this transition. No adapter may resume the fiber, mutate Fiber state, or
publish a different terminal error itself. This is required by CYB-61's
`BSP-REQ-F902B81D6E4C` and avoids the worker-local completion defect CYB-60 is
explicitly intended to remove.

### 3. Native backends are adapters, not alternative runtimes

| Target | Adapter approach | Non-negotiable translation rule |
| --- | --- | --- |
| Linux | nonblocking Internet sockets registered with epoll; event payload identifies a runtime operation/handle generation, not a public fd | If edge-triggering is used, drain/retry until `EAGAIN` before parking/rearming. The Linux manual says edge-triggered use needs nonblocking descriptors and waiting only after `EAGAIN`; it also supports one-shot rearm. [epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html) |
| macOS | kqueue/kevent filters for read/write notifications; `udata` is native-private runtime correlation | Registration is replacement by `(ident, filter)`, events are coalesced, and close removes descriptor events. The adapter still validates runtime generation because returned batches can be stale relative to runtime state. [Apple kqueue(2)](https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man2/kqueue.2.html) |
| Windows | overlapped Winsock operations associated with one IOCP; an `OVERLAPPED`/completion context maps to the private operation record | IOCP queues completion packets FIFO but dequeue order can differ, and it supports network endpoints/`WSARecv`/`WSASend` variants. Therefore order is never an API guarantee and each packet must check operation/generation/winner state. [Microsoft IOCP](https://learn.microsoft.com/en-us/windows/win32/fileio/i-o-completion-ports) |

The selected backend must be manifest-authorized and ABI-audited. A production
polling fallback is prohibited; a deterministic fake adapter is acceptable only
for unit tests that force races. This respects the current target-specific
platform-object architecture and the CYB-61 scope.

### 4. DNS is external work, not reactor readiness

`Network.Dns.Resolve(host, port, family?)` submits a blocking-pool job through
the Foundation external-work API. It translates ordered resolver answers into
`SocketAddress` values, filters the requested family while preserving order,
maps absence to `HostNotFound`, and has no cache or public resolver handle.

`getaddrinfo` is intentionally not treated as cancellable I/O: host resolver
work can outlive the language caller. On cancel/deadline, the Foundation winner
settles the Beskid wait once, but active-external-wait accounting remains until
the job exits; its later result is discarded. This is the proposed
`BSP-REQ-6F03B4D9A82E`, and is safer than reporting cancellation while freeing
the worker-owned request too early. [getaddrinfo(3)](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html)

### 5. TCP and UDP public behavior

`Network.Types` defines only typed `IpAddress::{V4,V6}`, `SocketAddress`,
bounded ports, `AddressFamily`, options, and `Datagram`. `Network.Errors`
contains the closed portable union specified in CYB-61; native errno/WSA codes,
descriptors, and unbounded native text are mapped privately before corelib.

TCP must provide typed bind/listen/accept/connect/address/options/close and
stream read/write/half-close. A stream allows one pending read plus one pending
write; a listener allows one accept. Same-direction competitors return
`NetworkError::Busy` before registering an operation. `Read`/`Write` keep
Foundation `IoError` and partial-transfer semantics; `Core.IO.WriteAll`, not a
network-local helper, owns retrying a partial write. `ShutdownWrite` preserves
the read side.

UDP allows one receive plus one send and preserves exactly one native datagram
per receive, including source and truncation metadata. It supports bind,
optional connect, `ReceiveFrom`/`SendTo`, and connected send/receive but never
implements `Core.IO.Stream`. These details are requirements, not API design
preferences: [TCP delta](../../openspec/changes/beskid-v0-5-networking/specs/core-library--networking--network-tcp/spec.md),
[UDP delta](../../openspec/changes/beskid-v0-5-networking/specs/core-library--networking--network-udp/spec.md),
and [types/error deltas](../../openspec/changes/beskid-v0-5-networking/specs/core-library--networking--network-types/spec.md).

## Dependency-aware implementation plan

### Gate 0 — make Foundations an actual acceptance gate

Do not create socket code while these CYB-60 proof points are merely planned:

- generic traced ABI-value transport and `Channel<OwnedResource>`;
- rooted fibers/captures and owner-scheduler inbound commands plus a wake primitive;
- monotonic, generation-tagged timers and the shared atomic terminal winner;
- blocking-pool active-wait accounting;
- lexical `use`, `Disposable`, `Core.IO.Stream`, `IoError`, partial transfer, EOF, and idempotent close;
- cross-target JIT/AOT/native evidence.

The networking design imports all of these contracts and forbids replacing any
of them. Require CYB-60 strict OpenSpec validation and its named evidence
matrix to be green before starting Gate 1.

### Gate 1 — accept and constrain the networking contract

1. Run `openspec validate beskid-v0-5-networking --strict --no-interactive`.
2. Resolve API naming/signature details in the proposed delta before code;
   retain its stable IDs and scenarios.
3. Freeze the v0.5 exclusions: TLS, HTTP, QUIC, WebSocket, Unix/raw sockets,
   multicast, proxy/pooling, DNS cache, `select`, async iterators, and all
   descriptor escape hatches.
4. Add a release test plan keyed to each stable ID, including the target matrix
   before parallel feature implementation begins.

Exit criterion: one approved public surface and no remaining ambiguity about
Foundation ownership or v0.5 exclusions.

### Gate 2 — manifest and private native boundary first

1. Extend `runtime_manifest.bsol` with private, capability-scoped socket and
   reactor operations, each with three target bindings and explicit OS imports.
2. Extend manifest parsing/validation and generated ABI/symbol/header/audit
   outputs in the existing `beskid_manifest` and `beskid_abi` paths.
3. Add negative parity tests: an undeclared operation, handwritten import, or
   target-only public entrypoint fails before codegen/linking.
4. Establish only the minimum adapter operations required for socket create,
   configuration, bind/listen/connect/accept, read/write/datagram I/O,
   registration/deregistration, completion polling, and close. Keep native
   details private to target objects.

Exit criterion: a three-target runtime kit exports exactly the manifest
declared socket boundary, and no public corelib source is required yet.

### Gate 3 — implement lifecycle before public protocol operations

1. Introduce `Runtime.Network` socket-table, handle, operation, completion,
   and diagnostics modules.
2. Implement allocation/reuse, generation validation, idempotent close, native
   deregistration/cancellation, direction reservation, and shutdown leak audit.
3. Wire all adapter notifications into Foundation owner commands and terminal
   winner APIs; use a fake adapter to deterministically race notification,
   cancellation, deadline, and close.
4. Add tests for stale handles, stale event/completion batches, duplicate close,
   one-resume only, and shutdown reporting that includes logical diagnostic
   fields but never native descriptor values.

Exit criterion: `BSP-REQ-3D4E0AE8B901`, `BSP-REQ-F902B81D6E4C`, and
`BSP-REQ-8A21D67C43FE` pass at runtime level before DNS/TCP/UDP facades are
introduced.

### Gate 4 — ship vertical public slices in dependency order

1. Create `corelib_network`, portable types, closed errors, cleanup conversion,
   and API-shape rejection fixtures. No raw handle accessor exists.
2. Implement DNS on the Foundation blocking pool and prove family order,
   `HostNotFound`, cancellation/deadline result discard, and active-wait
   lifetime.
3. Implement TCP connect/listen/accept first, then stream read/write via
   `Core.IO.Stream`, half-close, addresses/options, one-accept and
   one-reader/one-writer exclusion, `use`, and `Channel<TcpStream>` ownership.
4. Implement UDP bind/optional connect, send/receive variants, source address,
   truncation, and one-send/one-receive exclusion. Explicitly reject treating
   UDP as a stream.
5. Delete/reject any proposed raw `Core.Syscall` socket route or per-socket
   blocking loop as each vertical slice becomes canonical.

Exit criterion: every public operation has one manifest path, one runtime
lifecycle, and one portable error/ownership vocabulary.

### Gate 5 — native conformance and release evidence

Run the same semantic scenarios as JIT, AOT, and installed native runtime-kit
programs. Linux must use epoll, macOS kqueue, Windows IOCP; record unavailable
machines as an environment limitation rather than substituting another backend.

| Requirement group | Mandatory proof |
| --- | --- |
| ABI/opacity | manifest registry parity, generated-symbol audit, public API shape contains no descriptor/native error/constant |
| Lifecycle/races | generation reuse, stale delivery, duplicate close, close-vs-readiness, cancel-vs-deadline, exactly one resume |
| DNS | ordered family filtering, no cache, late-result discard, active-wait stays until job exit |
| TCP | loopback connect/listen/accept, EOF, partial write through `WriteAll`, half-close, one read + one write, Busy competitor |
| UDP | loopback datagram boundary/source/truncation, connected and unconnected modes, Busy competitor retains send payload |
| Leak/observability | scoped cleanup, channel ownership, deliberate shutdown leak failure, logical diagnostic content/no native descriptor leakage |
| Portability | JIT + AOT + native kit on Linux, macOS, Windows with asserted selected backend |

Finally run CYB-61 strict OpenSpec validation and the repository OpenSpec
validator. The planned HTTP/release change—not CYB-61—owns release catalog
regeneration and final delivery evidence.

## Risks that should stop implementation, not be papered over

1. **Foundation is incomplete.** Networking cannot safely compensate with a
   custom timer, wake path, stream helper, or resource queue. That would create
   the duplicate lifecycle design the release explicitly rejects.
2. **Backend semantic leakage.** Readiness and completion systems have different
   delivery behavior. The public API must promise only the portable operation
   contract, never event ordering or readiness bits.
3. **Native buffer and cancellation lifetime.** IOCP can deliver after a close;
   DNS can return after caller cancellation. Stage native memory in an
   operation-owned record and release it only after the relevant backend/job
   ownership is gone.
4. **Tests that only compile.** A manifest audit or mocked reactor alone cannot
   establish kernel behavior. The mandatory three-platform loopback/race/leak
   matrix must be preserved.
5. **Scope creep to HTTP/TLS.** HTTP is CYB-62 and must consume Network rather
   than adding alternate sockets, pooling, or protocol loops here.

## Primary-source research references

- Checked-in [CYB-61 proposal](../../openspec/changes/beskid-v0-5-networking/proposal.md),
  [design](../../openspec/changes/beskid-v0-5-networking/design.md), and
  [tasks](../../openspec/changes/beskid-v0-5-networking/tasks.md).
- Checked-in CYB-61 requirement deltas for [builtins/reactor](../../openspec/changes/beskid-v0-5-networking/specs/execution--runtime--fiber-scheduler-and-stacks/spec.md),
  [DNS](../../openspec/changes/beskid-v0-5-networking/specs/core-library--networking--network-dns/spec.md),
  [TCP](../../openspec/changes/beskid-v0-5-networking/specs/core-library--networking--network-tcp/spec.md),
  and [UDP](../../openspec/changes/beskid-v0-5-networking/specs/core-library--networking--network-udp/spec.md).
- Checked-in [Foundation proposal](../../openspec/changes/beskid-v0-5-foundations/proposal.md)
  and [design](../../openspec/changes/beskid-v0-5-foundations/design.md).
- [Linux `epoll(7)` manual](https://man7.org/linux/man-pages/man7/epoll.7.html).
- [Apple `kqueue(2)` manual](https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man2/kqueue.2.html).
- [Microsoft I/O completion ports documentation](https://learn.microsoft.com/en-us/windows/win32/fileio/i-o-completion-ports).
- [Linux `getaddrinfo(3)` manual](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html).
