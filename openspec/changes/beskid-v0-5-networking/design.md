## Context

Networking is the only v0.5 owner of Internet socket lifecycle and readiness.
It consumes, but does not redefine, the Foundation contracts for owner-routed
external completion, one terminal wait winner, monotonic deadlines,
`Disposable`, `Core.IO`, and resource transport through `Channel<T>`.

## Decisions

### One implementation path per construct

| Construct | Canonical v0.5 path | Deleted or prohibited path |
| --- | --- | --- |
| Native socket identity | Opaque `(slot, generation)` runtime handle validated by the socket table | Public fd/SOCKET/HANDLE field, integer cast, or descriptor constructor |
| Runtime operation | Canonical Beskid runtime operation record -> one atomic terminal winner -> owner scheduler command | Rust `beskid_runtime` scheduler/reactor, per-builtin callback loops, or direct worker-thread fiber resume |
| Readiness backend | Manifest-authorized platform intrinsics for `epoll` on Linux, `kqueue` on macOS, and IOCP on Windows behind one Beskid runtime reactor contract | Production polling fallback, target-specific public API, or a second Rust runtime lifecycle |
| Stream transfer | `TcpStream` implements Foundation `Core.IO.Stream` | Socket-specific `ReadExact`/`WriteAll` loop |
| Resource cleanup | `use` / `Disposable.Dispose` -> idempotent close -> handle generation invalidation | Finalizer-only close or caller-owned raw descriptor close |
| Resolver completion | Blocking-pool job -> owner-routed completion -> result discard after cancellation | Caller-thread blocking lookup, DNS cache, or public resolver handle |

### Operation and ownership model

The socket table owns each native socket while its generation is current. A
public `TcpStream`, `TcpListener`, or `UdpSocket` owns one opaque handle, and
an operation borrows that handle only after validating both slot and generation.
Close is idempotent: its first successful transition invalidates the current
generation, unregisters pending work, and releases the native socket; later
close calls observe closed state. Late readiness for an invalid generation is
discarded.

An operation has exactly one terminal outcome: success, typed network error,
cancellation, an explicitly configured deadline expiry, or close. The operation
uses the Foundation atomic winner and owner scheduler completion path. v0.5 has
no ambient deadline accessor: the first networking API that offers time limits
MUST add a typed public deadline policy and pass its absolute deadline to the
Foundation wait registration. Until then, networking registers unbounded waits
and still shares cancellation, readiness, and close through the same winner.
DNS may not interrupt an
underlying host resolver; after caller cancellation it discards the eventual
result while retaining Foundation external-wait accounting until the job exits.

TCP permits one pending read and one pending write per stream, and one pending
accept per listener. UDP permits one pending receive and one pending send per
socket. A competing non-stream operation returns `NetworkError::Busy`; a
competing `Core.IO.Stream.Read` or `Write` maps through that fixed method's
operation-specific `IoError`. Neither case registers a second wait. These
policies make resource ownership and terminal cleanup deterministic.

The lifecycle, socket table, operation state, and reactor coordination live in
canonical Beskid runtime modules under
`compiler/runtime/beskid/src/Runtime/Network/**`. Platform-specific system calls
remain narrow manifest-authorized host intrinsics. They MUST NOT own scheduler
state, resume fibers directly, or introduce a Rust `beskid_runtime` reactor.

### Public API boundary

The public package is `Network.Types`, `Network.Errors`, `Network.Dns`,
`Network.Tcp`, and `Network.Udp`. Addresses, families, socket options, and
operation settings are language-owned typed values. No public function,
property, error payload, or enum variant exposes a POSIX descriptor, Winsock
`SOCKET`, Windows `HANDLE`, errno, WSA error, readiness bit, or platform
constant. Runtime builtin symbols are implementation anchors, not public APIs.
Core.IO stream methods preserve `IoError` and map transport read/write/close
failures, including same-direction stream contention, to its portable
operation-specific variants. `ReadFailed` and `WriteFailed` carry the Foundation
`TransferFailure` cause; a private `Network.Internal` helper maps each runtime
status to exactly one cause (`Busy`, `Closed`, `Cancelled`, `TimedOut`,
`PeerReset`, `PeerAborted`, otherwise `Unspecified`) so a caller can tell peer
reset, cancellation, timeout, local close, and contention apart without a
native code. Construction, addressing, options, shutdown,
cancellation, explicit deadline policy, and non-stream concurrency-policy
operations use `NetworkError`; the two error types MUST NOT silently substitute
for one another. `NetworkError::ResourceExhausted` (socket table full, runtime
or native allocation failure, host descriptor/buffer/memory exhaustion) is
distinct from `NetworkDown` (unreachable network, route, or host, and unknown
native failures); a caller backs off on the second and releases resources on
the first. The manifest status enumeration follows `NetworkError` declaration
order from 1, so `ResourceExhausted` is status 18 and the internal `Pending`
status moves to 19; no hole is reserved. Network also declares its explicit
scoped-cleanup conversion from `DisposeError` to `NetworkError::CleanupFailed`.

### Deferred to `add-network-deadline-policy-0-6`

Caller-supplied deadlines are not part of v0.5. Every v0.5 wait registers an
unbounded deadline, and the TCP delta already states that an operation has no
deadline unless a future typed public deadline policy supplies one
(`BSP-REQ-D15E92AB4C76`). Foundation deferred public absolute time until a
clock-domain-safe deadline type exists (`BSP-REQ-D613601481B2`); a deadline
policy without that type would expose raw nanosecond integers or invent a
second time domain. The deferral is recorded here rather than as a change
directory because a proposal-and-tasks-only change fails
`openspec validate --strict` ("Change must have at least one delta"), and a
real delta needs the Foundation `Core.Time.Deadline` requirement that does not
exist yet. The rulings document
(`docs/superpowers/specs/2026-09-22-networking-v05-rulings.md`, item 5) holds
the proposed SHALL text and scenario for the deferred change.

Target shape, recorded so v0.5 does not block it:

- Foundation adds an opaque monotonic `Core.Time.Deadline` with
  `Deadline.After(Duration) -> Result<Deadline, TimerError>` (checked
  addition, the same validation as `Sleep`) and no public constructor from
  `Instant`. The deferred `SleepUntil` uses the same type.
- Network keeps the fixed `Core.IO.Stream` signatures and adds per-stream
  absolute deadlines: `TcpStream.SetDeadlines(TransferDeadlines policy) ->
  Result<unit, NetworkError>` with
  `pub type TransferDeadlines { pub Option<Deadline> read, pub Option<Deadline> write }`.
  An expired read deadline completes the pending read with
  `IoError::ReadFailed(TransferFailure::TimedOut)`; the stream stays usable
  under a new deadline. Lifecycle operations take an explicit
  `Option<Deadline>` argument (`Connect`, `TcpListener.Accept`,
  `Dns.Resolve`, UDP send and receive) and return `NetworkError::TimedOut`
  on expiry.
- The runtime passes the absolute monotonic value to
  `ExternalWaitRegister` in place of `-1`; there is no second timer path
  (`BSP-REQ-896BA6C917E9`, `BSP-REQ-F902B81D6E4C`).
- HTTP adds `ExchangeDeadlines { Option<Deadline> head, Option<Deadline> body }`
  only after the Network policy lands.

v0.5 obligation: keep `-1` in every `ExternalWaitRegister` call, keep the
README sentence that this API revision registers an unbounded deadline, and
land `TransferFailure::TimedOut` (item 1) so the deferred change can use it.

### Security, observability, and source of truth

- Network parsing MUST use typed `IpAddress` and bounded port values; it MUST
  NOT reinterpret caller integers as native handles.
- Runtime conformance diagnostics MUST report handle slot/generation, owning
  scheduler, backend, operation kind, winner, and leak count; diagnostics MUST
  NOT expose a native descriptor value.
- Debug and conformance modes MUST report a leaked live network handle at
  shutdown and MUST fail their leak check.
- `openspec/specs` becomes the sole normative authority after this change is
  applied. This change directory is proposed delta material; `catalog.json`
  remains derived and is intentionally untouched here.

### Platform matrix

| Target | Required backend | Required evidence |
| --- | --- | --- |
| Linux | epoll | JIT, AOT, and native loopback TCP/UDP plus stale-event and leak tests |
| macOS | kqueue | JIT, AOT, and native loopback TCP/UDP plus stale-event and leak tests |
| Windows | IOCP | JIT, AOT, and native loopback TCP/UDP plus stale-completion and leak tests |

### Evidence matrix

Evidence targets are implementation anchors, not additional normative behavior.
`R` is runtime, `C` is corelib, `J` is JIT, `A` is AOT, and `N` is native
runtime-kit evidence.

| Stable requirement ID | R | C | J | A | N |
| --- | --- | --- | --- | --- | --- |
| BSP-REQ-3D4E0AE8B901 | handle generation/close tests | opaque API shape fixture | ABI smoke | ABI smoke | symbol audit |
| BSP-REQ-B094EDC16A72 | manifest registry parity | - | import-resolution fixture | link fixture | runtime-kit symbol smoke |
| BSP-REQ-5B97C4F1D3A8 | epoll/kqueue/IOCP contract tests | - | target loopback | target loopback | three-backend smoke |
| BSP-REQ-F902B81D6E4C | readiness/close/cancel/deadline race | cancellation fixture | race fixture | race fixture | one-resume smoke |
| BSP-REQ-8A21D67C43FE | socket leak audit | `use` cleanup fixture | loopback cleanup | loopback cleanup | shutdown leak smoke |
| BSP-REQ-17C4F8A02D65 | - | types API-shape test | typecheck fixture | typecheck fixture | public-symbol audit |
| BSP-REQ-CAB59E0274D1 | native-to-error mapping | every variant fixture | error parity | error parity | cross-target mapping smoke |
| BSP-REQ-29D8A7C6E340 | resolver result-discard test | DNS family/result tests | resolver fixture | resolver fixture | platform resolver smoke |
| BSP-REQ-6F03B4D9A82E | active-wait resolver test | DNS cancellation test | cancellation fixture | cancellation fixture | shutdown resolver smoke |
| BSP-REQ-D15E92AB4C76 | TCP loopback lifecycle | TCP API/EOF/half-close tests | TCP loopback | TCP loopback | native loopback |
| BSP-REQ-410CB8F5E97A | competing-operation test | TCP concurrency tests | race fixture | race fixture | one-reader/one-writer smoke |
| BSP-REQ-E6A31C7D095B | close/deadline race | TCP `use` cleanup test | cleanup fixture | cleanup fixture | close race smoke |
| BSP-REQ-74F9B2C8A6D0 | UDP loopback/truncation test | datagram-boundary tests | UDP loopback | UDP loopback | native datagram smoke |
| BSP-REQ-2A5DC9E7F4B3 | competing-operation test | UDP concurrency tests | race fixture | race fixture | one-send/one-receive smoke |
| BSP-REQ-93E6F1A8C57D | feature audit | public API audit | package fixture | package fixture | target matrix audit |

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Stale readiness reaches a reused socket | Validate `(slot, generation)` before every operation and discard stale events. |
| A timer, close, or readiness event resumes a fiber twice | Reuse the Foundation one-winner transition; race it in all backends. |
| A platform detail leaks into user code | Make typed Network values the only public API and audit symbols, fields, errors, and docs. |
| DNS cancellation claims more than host resolvers provide | Cancel the Beskid wait and discard the eventual result; retain external-wait accounting until job exit. |
| Production fallback hides a backend defect | Restrict fallback to tests and require platform-native backend evidence. |
