# Networking v0.5 Rulings

**Status:** Recommended rulings for the five open items in
`docs/superpowers/plans/2026-09-22-future-ready-networking-hardening.md`,
section "Rulings needed before further work". This document is not normative.
OpenSpec text proposed here must land in the named change directories before
any observable behavior changes.

**Inputs inspected (read-only):** `openspec/changes/beskid-v0-5-foundations`,
`beskid-v0-5-networking`, `beskid-v0-5-http`; the design and plan documents;
and the worktree `.worktrees/compiler-f6-native-descriptor-contract` at
`corelib/packages/{network,http,foundation/src/Core/IO}`,
`runtime/beskid/src/Runtime/Network/**`, `runtime_manifest.bsol`
(`status "BeskidNetworkStatus"`), and `crates/beskid_abi/assembly/common/network.h`
(`BeskidNetworkError`).

## Summary

| Item | Ruling | When | Owner decision required |
| --- | --- | --- | --- |
| 1. Transport cause erasure | Add a Foundation-owned cause payload: `IoError::ReadFailed(TransferFailure cause)` and `WriteFailed(TransferFailure cause)`; `HttpError::Transport(TransferFailure cause)` | v0.5 now | Yes. This is the one item the owner must rule on personally. |
| 2. Exhaustion reported as `NetworkDown` | Add `NetworkError::ResourceExhausted()` as public status 18; move internal `Pending` to 19 | v0.5 now | No. Convention-fit. |
| 3. `Host` enforcement | Server rejects missing, duplicate, or malformed `Host` with `HttpError::MissingHost()` or `HttpError::InvalidHost()`; client serializer requires exactly one `Host` | v0.5 now | No. Convention-fit. |
| 4. Unframed response bodies | Implement the RFC 9112 6.3 no-body rules (HEAD, 1xx, 204, 304) through a typed `MessageRole`; reject close-delimited bodies with `HttpError::CloseDelimitedBody()`; reject interim 1xx with `HttpError::InterimResponse()` | v0.5 now (rules); close-delimited reads deferred to 0.6 | No. Convention-fit. |
| 5. Deadlines | Defer to a new change `add-network-deadline-policy-0-6`; record the API shape now so v0.5 does not block it | Deferred (0.6) | No. Convention-fit. |

Recommended order of work: 2, 3, 4, then 1 after the owner rules; 5 after
the v0.5 evidence gate. Items 2 to 4 are independent of item 1. Item 4
depends on item 3 only for shared test fixtures.

---

## 1. Transport cause erasure in `IoError` and `HttpError::Transport`

### Problem in the code

`TcpStream.Read` maps every negative runtime status (`Cancelled` 13,
`TimedOut` 12, `Closed` 14, `Busy` 15, `ConnectionReset` 5, and all others) to
`IoError::ReadFailed()`; `Write` does the same with `WriteFailed()`
(`corelib/packages/network/src/Network/Tcp/TcpStream.bd`, lines 21 to 35).
`Http.Wire.ReadMessage` then maps any `IoError` other than `UnexpectedEof` to
`HttpError::Transport()`. A caller cannot distinguish "I was cancelled" from
"the peer sent RST" from "another fiber holds the read direction".

RFC 9293 section 3.6 requires that the application be told whether the
connection closed normally or was aborted (MUST-12). Orderly close is already
distinguishable (`Read` returns `Ok(0)`), but reset, cancellation, timeout, and
local close are not. TLS 1.3 (close_notify versus truncation), HTTP/2 (GOAWAY
versus RST), and WebSocket (close frame versus abort) all need this
distinction, and so does HTTP/1.1 keep-alive retry logic.

### Options considered

| Option | Shape | Assessment |
| --- | --- | --- |
| A. Flat variants | Add `Cancelled()`, `TimedOut()`, `Closed()`, `PeerReset()`, `Busy()` beside `ReadFailed()` | Rust `std::io::ErrorKind` precedent. Breaks the operation-specific wording in `BSP-REQ-D15E92AB4C76`, `BSP-REQ-410CB8F5E97A`, and `BSP-REQ-4E7D12C9B6A0` ("maps to `ReadFailed`"). Three networking requirements must be rewritten. |
| B. Cause payload | `ReadFailed(TransferFailure cause)`, `WriteFailed(TransferFailure cause)` | Keeps every existing "maps to that method's `IoError`" sentence true. Adds one Foundation enum. Existing payload precedent: `UnexpectedEof(i64 completed)`, `FiberError::Cancelled(i64, i64)`. |
| C. Side channel | `TcpStream.LastFailure()` | Stateful, racy with the one-read/one-write policy. Rejected. |
| D. Reuse `NetworkError` as payload | `ReadFailed(NetworkError)` | Makes Foundation depend on Network. Rejected by the package layering. |

### Recommended ruling

Adopt option B in v0.5. Do not defer: after v0.5 ships, adding a payload
changes constructor and match arity of a public Foundation enum, which is a
breaking change. Before v0.5 it is a pre-release edit with two production
call sites.

### Public contract shape

In `corelib/packages/foundation/src/Core/IO/`:

```beskid
/// Portable reason for a failed transfer. Never a native code.
/// @tier(standard)
pub enum TransferFailure {
    Unspecified(),   // any failure not listed below
    Busy(),          // same-direction operation already pending
    Closed(),        // local close, stale handle, or write after ShutdownWrite
    Cancelled(),     // caller cancellation won the wait
    TimedOut(),      // deadline or native transport timeout won the wait
    PeerReset(),     // peer abort (RST); RFC 9293 MUST-12
    PeerAborted(),   // local stack aborted the connection (ECONNABORTED)
}

pub enum IoError {
    InvalidRange(),
    UnexpectedEof(i64 completed),
    NoProgress(),
    ReadFailed(TransferFailure cause),
    WriteFailed(TransferFailure cause),
    CloseFailed(),
}
```

`CloseFailed()` stays payload-free: close is idempotent and the caller's next
action does not depend on the cause. `FromDisposeError` continues to return
`CloseFailed()`.

Network mapping (`TcpStream.bd`, private helper in `Network.Internal`):

| Runtime status | `TransferFailure` |
| --- | --- |
| 15 `Busy` | `Busy` |
| 14 `Closed`, 10 `NotConnected` | `Closed` |
| 13 `Cancelled` | `Cancelled` |
| 12 `TimedOut` | `TimedOut` |
| 5 `ConnectionReset` | `PeerReset` |
| 3 `ConnectionAborted` | `PeerAborted` |
| all other statuses | `Unspecified` |

`Core.IO.Read` and `Write` invariant failures (`completed < 0` or
`completed > count`) return `ReadFailed(TransferFailure::Unspecified)` and
`WriteFailed(TransferFailure::Unspecified)`.

HTTP (`corelib/packages/http/src/Http/Errors.bd`):

```beskid
Transport(TransferFailure cause),
```

`Http.Wire`, `Http.Client`, and `Http.Server` map `IoError::ReadFailed(c)` and
`WriteFailed(c)` to `Transport(c)`; `InvalidRange` and `NoProgress` map to
`Transport(TransferFailure::Unspecified)`; `UnexpectedEof(_)` keeps mapping to
`HttpError::UnexpectedEof()`.

### OpenSpec text

**File:** `openspec/changes/beskid-v0-5-foundations/specs/core-library--concurrency--concurrency-package/spec.md`,
requirement `BSP-REQ-F25A4DF4DEA0`. Replace the `IoError` declaration block
with the one above (plus `TransferFailure`) and add this paragraph:

> `IoError::ReadFailed` and `IoError::WriteFailed` SHALL carry exactly one
> `TransferFailure` cause. `TransferFailure` SHALL be a closed, payload-free
> enum containing `Unspecified`, `Busy`, `Closed`, `Cancelled`, `TimedOut`,
> `PeerReset`, and `PeerAborted`. A transport MUST map each failure to exactly
> one cause before it reaches a caller and MUST use `Unspecified` for every
> failure that no other cause describes. A cause MUST NOT carry a native
> error code, descriptor, or platform constant. `ReadExact` and `WriteAll`
> MUST propagate the cause unchanged.

Scenario to add:

> #### Scenario: Peer reset is distinguishable from orderly close
> - **GIVEN** a stream whose peer aborts the connection while a read is pending
> - **WHEN** the read completes
> - **THEN** it returns `IoError::ReadFailed(TransferFailure::PeerReset())`, while a peer that half-closes instead returns `Result::Ok(0)`

**File:** `openspec/changes/beskid-v0-5-networking/specs/core-library--networking--network-tcp/spec.md`,
`BSP-REQ-D15E92AB4C76` and `BSP-REQ-410CB8F5E97A`. Change "map to
`ReadFailed`, `WriteFailed`" to "map to `ReadFailed(cause)`,
`WriteFailed(cause)` with the Foundation `TransferFailure` cause table", and
change the second-read scenario THEN to
"`IoError::ReadFailed(TransferFailure::Busy())`".

**File:** `openspec/changes/beskid-v0-5-http/specs/core-library--networking--http/spec.md`.
Add to "One transport path":

> `HttpError::Transport` SHALL carry the Foundation `TransferFailure` cause
> received from `Core.IO` and MUST NOT add an HTTP-specific transport cause.

### Affected files and fixtures

- `corelib/packages/foundation/src/Core/IO/IoError.bd` (payload), new
  `TransferFailure.bd`, `IO.bd` (two invariant sites, `pub mod` line).
- `corelib/packages/network/src/Network/Tcp/TcpStream.bd`,
  `Network/Internal.bd` (new `TransferCause(i64 status)` helper).
- `corelib/packages/http/src/Http/Errors.bd`, `Wire.bd`, `Client.bd`,
  `Server.bd`.
- Tests: `corelib_tests/src/network/TcpTests.bd` uses `Result::Error(_)` only;
  no change. Add `network_tcp_second_read_reports_busy_cause` and
  `network_tcp_peer_reset_is_not_eof`. `corelib_tests/src/http/CodecTests.bd`
  `IsError` does not list `Transport`; no change. Any `IsError` extension must
  match `HttpError::Transport(_)`.
- Docs: `corelib/packages/network/README.md` "TCP" section;
  `corelib/beskid_corelib/docs/Core/IO.md` if present.
- Compiler capability check before implementation: confirm the front end
  accepts an enum-typed payload in a corelib package enum (`Option<AddressFamily>`
  and `Result<T, HttpError>` already nest enums; a direct enum payload should
  typecheck, but the nested-generic fix noted in the plan's coordination gate
  shows this area is fresh).

### Migration impact

Every `IoError::ReadFailed` or `WriteFailed` constructor or pattern without a
payload fails to compile. `rg -n "IoError::(Read|Write)Failed" corelib` in the
worktree returns two production sites (`TcpStream.bd`) and two in `IO.bd`. No
test source constructs them.

### Risk

Medium. The edit is small, but it reopens the Foundation delta that the
networking and HTTP evidence gates depend on (`BSP-REQ-F25A4DF4DEA0`,
`BSP-REQ-0A5892A2DB9C`). If CYB-60 has already been accepted, the Foundation
change needs a second acceptance pass for the `Core.IO` cells. This is the
reason the owner must rule personally: the release program treats the
Foundation gate as closed before networking starts, and this ruling re-opens
one requirement in it.

### Sources

- RFC 9293, section 3.6: "the local application MUST be informed whether it closed normally or was aborted (MUST-12)"; section 3.5.3 reset processing.
- Rust `std::io::ErrorKind`: `ConnectionReset`, `ConnectionAborted`, `TimedOut`, `Interrupted`, `UnexpectedEof`, `WriteZero`; `io::Error::raw_os_error()` keeps the OS code separately (Beskid does not).
- Go `net`: `net.Error.Timeout()`, `net.ErrClosed`, `net.OpError.Err`; `io.EOF` versus `io.ErrUnexpectedEOF`.
- .NET `HttpRequestError` (.NET 8+): `ConnectionError`, `ResponseEnded`, `InvalidResponse`; `SocketError.ConnectionReset` 10054, `ConnectionAborted` 10053, `OperationAborted` 995, `Shutdown` 10058.
- Swift NIO `NIOCore.ChannelError`: `.eof`, `.ioOnClosedChannel`, `.alreadyClosed`, `.outputClosed`, `.inputClosed`, `.connectTimeout`; `NIOCore.IOError` wraps `errnoCode`.
- Zig `std.http.Client`: `ConnectionResetByPeer`, `UnexpectedEndOfStream`, `HttpChunkTruncated` as distinct error tags.

---

## 2. Resource exhaustion surfaced as `NetworkDown`

### Problem in the code

`NETWORK_DOWN` (9) is returned for: the 256-slot table being full
(`NetworkAdoptLocked` returns 0 in `Sockets.bd` lines 44 and 79),
`SystemAllocate` failure for the request, buffer, address storage, or DNS
record (`Operations.bd` lines 124 and 127; `Sockets.bd` lines 9, 28, 158;
`Dns.bd` lines 69 and 80), reactor and IOCP allocation failures
(`network_iocp.h` lines 64, 100, 108, 112), and, in `BeskidNetworkError`,
the `default:` branch plus `ENETDOWN`, `ENETUNREACH`, and `EHOSTUNREACH`.
`EMFILE`, `ENFILE`, `ENOBUFS`, `ENOMEM`, `WSAEMFILE`, `WSAENOBUFS`, and
`WSA_NOT_ENOUGH_MEMORY` are not listed and fall to `default:`.

A caller that sees `NetworkDown` should back off or fail over; a caller that
sees exhaustion should close resources. Conflating them is a misleading
portable error. POSIX and Winsock keep the two families apart:
`EMFILE` "All file descriptors available to the process are currently open",
`ENFILE` "No more file descriptors are available for the system", `ENOBUFS`
"Insufficient resources were available in the system", `ENOMEM`
"Insufficient memory"; against `ENETDOWN`/`WSAENETDOWN` "Network is down" and
`WSAENETUNREACH` "Network is unreachable".

### Recommended ruling

v0.5 now. Add exactly one public variant, `NetworkError::ResourceExhausted()`,
appended after `Unsupported` so the declaration order stays the status order.
Move the internal `Pending` status from 18 to 19. `Pending` never reaches
corelib, so the renumber has no public effect, and it keeps the invariant
"statuses 1..N follow `NetworkError` declaration order; N+1 is native pending"
that `Table.bd`, `Internal.bd`, `README.md`, and `network.h` all document.
Do not keep 18 reserved and append at 19; that leaves a hole that every future
adapter must remember.

### Contract shape

`corelib/packages/network/src/Network/Errors.bd`: append `ResourceExhausted(),`
after `Unsupported(),`.

`runtime_manifest.bsol`, `status "BeskidNetworkStatus"`: insert
`{ name = ResourceExhausted, value = 18 }` and change `Pending` to `19`.

`crates/beskid_abi/assembly/common/network.h`: insert `NET_RESOURCE_EXHAUSTED`
before `NET_PENDING` in the enum (the enum is positional). Add to
`BeskidNetworkError`: `EMFILE`, `ENFILE`, `ENOBUFS`, `ENOMEM` (POSIX);
`WSAEMFILE`, `WSAENOBUFS`, `WSA_NOT_ENOUGH_MEMORY` (Windows); `EAI_MEMORY` in
the resolver job. Keep `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` on
`NET_NETWORK_DOWN`.

Runtime: every `return NETWORK_DOWN` / `-i64(NETWORK_DOWN)` that follows a
null `SystemAllocate`, a zero `NetworkAdoptLocked`, or a null
`network_dns_start` becomes `NETWORK_RESOURCE_EXHAUSTED` (new constant 18 in
`Table.bd`); `NETWORK_PENDING` becomes 19. `NetworkFinish` bound check
`status > NETWORK_UNSUPPORTED` becomes `status > NETWORK_RESOURCE_EXHAUSTED`.
`Internal.Error` adds `if status == 18_i64 { return NetworkError::ResourceExhausted; }`.

Related observation, not a ruling: the `default:` branch of
`BeskidNetworkError` still maps unknown native errors to `NetworkDown`. The
spec requires "exactly one applicable variant"; the release team should
decide whether unknown maps to `NetworkDown` (current) or `Unsupported`. Rust
uses `Uncategorized` for this case. Leaving it as-is is acceptable for v0.5
if the spec sentence below names it.

### OpenSpec text

**File:** `openspec/changes/beskid-v0-5-networking/specs/core-library--networking--network-errors/spec.md`,
`BSP-REQ-CAB59E0274D1`. Add `ResourceExhausted` to the MUST-include list and
append:

> `NetworkError::ResourceExhausted` SHALL be returned when the runtime socket
> table has no free slot, when a runtime or native allocation for a request,
> buffer, or resolver job fails, or when the host reports descriptor, buffer,
> or memory exhaustion. `NetworkError::NetworkDown` SHALL be reserved for a
> host report that the network, route, or host is unreachable, and for
> native failures that match no other variant. The two variants MUST NOT be
> substituted for one another.

Scenario:

> #### Scenario: Socket table exhaustion is not a network outage
> - **GIVEN** every runtime socket slot holds a live socket
> - **WHEN** a caller binds one more UDP socket
> - **THEN** it receives `NetworkError::ResourceExhausted` and, after one live socket closes, the next bind succeeds

**File:** `openspec/changes/beskid-v0-5-networking/specs/execution--abi-and-host--builtins-and-symbols/spec.md`,
`BSP-REQ-B094EDC16A72`. Append one sentence: "The manifest socket status
enumeration SHALL list every public `NetworkError` variant in declaration
order starting at 1, followed by exactly one internal pending status that
MUST NOT cross the runtime/corelib boundary."

### Affected files and fixtures

- `runtime_manifest.bsol`; regenerate `crates/beskid_abi/src/generated/abi_v5_contract.rs`
  and `include/abi-v5.json` through the existing generator (do not hand-edit).
- `crates/beskid_abi/assembly/common/network.h` (enum and mapping),
  `network_posix.h` and `x86_64-pc-windows-msvc/network_iocp.h` (allocation
  failure sites: lines listed above).
- `runtime/beskid/src/Runtime/Network/Table.bd`, `Operations.bd`,
  `Sockets.bd`, `Dns.bd`, `README.md` (status paragraph).
- `corelib/packages/network/src/Network/Errors.bd`, `Internal.bd`, `README.md`.
- New runtime test in `runtime/beskid/tests/runtime_semantics/src/NetworkNativeTests.bd`:
  open UDP sockets on loopback port 0 until `NetworkOpen` returns 18, assert
  the count is at most `NETWORK_SLOT_COUNT`, close one, assert the next open
  returns 0, then close all and assert `NetworkShutdown` reports 0 leaks. On
  macOS the default descriptor limit (256) may produce `EMFILE` before the
  table fills; both paths map to 18, so the assertion holds on every target.
- New corelib test `network_udp_exhaustion_is_typed` in `UdpTests.bd` with the
  same shape through the public API.
- Add a parity check that fails the build when `network.h`'s enum count
  differs from the manifest status count (a `_Static_assert(NET_PENDING == 19)`
  against a generated constant is sufficient if the generator emits
  `BESKID_NETWORK_STATUS_PENDING`; otherwise add one to the
  `runtime_bootstrap_contract` test).

### Migration impact

No existing test asserts status 9 or `NetworkDown`. `NetworkNativeTests`
asserts 14 (`Closed`) for a stale handle; unchanged. `IsError`-style helpers
in network tests match by variant name; unchanged.

### Risk

Low. All edits are inside the unreleased v0.5 manifest, runtime, and package.
The only hazard is a hand-edited enum in `network.h` drifting from the
manifest; the parity check closes it.

### Sources

- POSIX.1-2024 `socket()` ERRORS: `EMFILE`, `ENFILE`, `ENOBUFS`, `ENOMEM`.
- Winsock error codes: `WSAEMFILE` 10024, `WSAENOBUFS` 10055, `WSA_NOT_ENOUGH_MEMORY` 8, `WSAENETDOWN` 10050, `WSAENETUNREACH` 10051, `WSAEHOSTUNREACH` 10065.
- Rust `ErrorKind::OutOfMemory`, `NetworkDown`, `NetworkUnreachable`, `HostUnreachable` are four separate kinds.
- .NET `SocketError.TooManyOpenSockets` 10024, `NoBufferSpaceAvailable` 10055, `NetworkDown` 10050.

---

## 3. `Host` header enforcement (RFC 9112 section 3.2)

### Problem in the code

`Codec.ParseRequest` and `SerializeRequest` never inspect `Host`.
`Http.Server.Receive` accepts a request with zero or several `Host` lines.
RFC 9112 section 3.2: "A client MUST send a Host header field in all HTTP/1.1
request messages" and "A server MUST respond with a 400 (Bad Request) status
code to any HTTP/1.1 request message that lacks a Host header field and to
any request message that contains more than one Host header field line or a
Host header field with an invalid field value." Duplicate `Host` is a
request-smuggling vector when front and back ends pick different lines.

### Recommended ruling

v0.5 now. It is a bounded parser check with no transport impact.

- Server (`ParseRequest`): after header parsing and before framing, count
  `host` lines. Zero lines returns `HttpError::MissingHost()`. More than one
  line, or one line whose value fails the bounded grammar, returns
  `HttpError::InvalidHost()`. The check runs before `Framing` so a smuggling
  attempt is rejected before any body allocation.
- Client (`SerializeRequest`): the same rule, "strict on send" (RFC 9110
  section 2.5). The serializer does not invent a `Host`: it knows only a
  `SocketAddress`, not the name the caller resolved.
- The v0.5 server facade does not write the 400 response itself.
  `HttpServer.Receive` returns the typed error; the application responds with
  `Types.EmptyResponse(u16(400), "Bad Request")` and closes. The spec text
  below states this division so the RFC MUST is satisfied by the server as a
  whole.
- Bounded `Host` grammar for v0.5: empty value is permitted (RFC 9112
  section 3.2 requires an empty `Host` when the target URI has no authority);
  otherwise `uri-host [ ":" port ]` where `uri-host` is a bracketed IPv6
  literal or a run of `unreserved / sub-delims / pct-encoded` octets, and
  `port` is decimal in 0..65535. No whitespace, no control bytes, no second
  colon outside brackets. Absolute-form request targets are accepted as
  today; v0.5 does not compare the target authority with `Host` (Go ignores
  `Host` when the target is absolute-form; Beskid v0.5 only validates
  presence and syntax).
- `MessageEnd` does not check `Host`; it is a boundary function, not a
  validator.

### Contract shape

`Http.Errors`: add `MissingHost(), InvalidHost(),`.

`Http.Codec`: private `Result<unit,HttpError> HostField(Header[] headers)`
called from `RequestHead` (after `Headers`) and from `SerializeRequest`
(before `Serialize`).

### OpenSpec text

**File:** `openspec/changes/beskid-v0-5-http/specs/core-library--networking--http/spec.md`.
New requirement:

> ### Requirement: Exactly one Host field per request
> The `Http` core library SHALL require exactly one `Host` header field line
> in every parsed and every serialized HTTP/1.1 request. `ParseRequest` and
> `SerializeRequest` MUST return `HttpError::MissingHost` when no `Host`
> line is present and `HttpError::InvalidHost` when more than one line is
> present or the single value is not an empty value or a `uri-host`
> optionally followed by `":"` and a decimal port in 0..65535. The check
> MUST run before body framing and MUST NOT allocate a body. A v0.5 server
> application that receives either error MUST respond with status 400 and
> close the connection; `HttpServer.Receive` does not send that response.

Scenario:

> #### Scenario: duplicate Host is rejected before the body is read
> - **WHEN** a request contains two `Host` field lines and a `Content-Length` body
> - **THEN** `ParseRequest` returns `HttpError::InvalidHost` without returning any body octets

Note: the HTTP delta requirements had no `**Stable ID:**` lines before this
ruling landed. IDs were assigned on 2026-09-22 with the repository mint in
`scripts/openspec/build-catalog.ts` (`BSP-REQ-` plus the first 12 uppercase
hex digits of `sha256("<capability>#<requirement title>")`):
`BSP-REQ-7E14A36F9F29` (Bounded strict HTTP/1.1 framing),
`BSP-REQ-58182F687E87` (Unambiguous message framing),
`BSP-REQ-6CAA5AC6F4E3` (Exactly one Host field per request), and
`BSP-REQ-9E0DE26CF08F` (One transport path).

### Affected files and fixtures

- `corelib/packages/http/src/Http/Codec.bd`, `Errors.bd`; `README.md`.
- `corelib_tests/src/http/CodecTests.bd`: add `Host: t` to the four
  request fixtures that lack it (`ambiguous`, chunked valid and malformed,
  oversized body); add `MissingHost` and `InvalidHost` arms to `IsError`; add
  `http_request_requires_exactly_one_host`.
- `corelib_tests/src/http/SerializationTests.bd`:
  `http_serializer_rejects_caller_supplied_framing_header` builds `GET /`
  with only `Content-Length`; add a `Host` header or the test now fails with
  `MissingHost` instead of `AmbiguousFraming`. Add
  `http_serializer_requires_host`.
- `ExchangeTests.bd` already sends `Host: loopback.test`; unchanged.
- `MessageEnd` tests use requests without `Host`; unchanged because
  `MessageEnd` does not validate `Host`.

### Migration impact

Five fixtures need a `Host` line. No public signature changes.

### Risk

Low. The only behavioral surprise is for callers that built requests without
`Host`; they now get a typed error at serialization time instead of a 400
from a conforming server.

### Sources

- RFC 9112 section 3.2 (quoted above); RFC 9110 section 7.2 (`Host` field syntax `uri-host [ ":" port ]`); RFC 9110 section 2.5 ("be strict on send / tolerant on receive" is a general principle; section 3.2 of RFC 9112 makes rejection mandatory for the server).
- Go `net/http`: `readRequest` returns `badRequestError("missing required Host header")` for HTTP/1.1 without `Host`, `"too many Host headers"` for more than one, and `"malformed Host header"` when `httpguts.ValidHostHeader` fails.

---

## 4. Unframed response bodies and the no-body rules

### Problem in the code

`Codec.Framing` returns `-1` for a message with neither `Content-Length` nor
`Transfer-Encoding`; `Body` then requires zero trailing octets, and
`MessageEnd` reports the head end as the message end. This is correct for
requests (RFC 9112 section 6.3 item 7: "If this is a request message and none
of the above are true, then the message body length is zero"). It is wrong
for responses in two directions:

1. A `2xx` response without framing is close-delimited (item 8: "the message
   body length is determined by the number of octets received prior to the
   server closing the connection"). Today the client returns a `Response`
   with an empty body while the server is still sending the body, or fails
   with `TrailingBytes` if any body octets arrived in the same read. The
   empty-body case is a silent wrong answer.
2. A response to `HEAD`, or with status `1xx`, `204`, or `304`, "is always
   terminated by the first empty line after the header fields, regardless of
   the header fields present" (item 1). RFC 9110 section 8.6 permits
   `Content-Length` on `HEAD` and `304` responses. Today a `HEAD` response
   carrying `Content-Length: 1234` makes `MessageEnd` wait for 1234 octets
   that never arrive; the client hangs until the server closes, then reports
   `UnexpectedEof`.

### Recommended ruling

v0.5 now, fail closed:

- Implement item 1 (no-body rules) through a typed `MessageRole` passed to
  `MessageEnd`, `ParseResponse`, and `Wire.ReadMessage`. `Client.Send`
  derives the role from `request.method == "HEAD"`.
- Reject item 8 (close-delimited) with a new `HttpError::CloseDelimitedBody()`
  instead of returning an empty body. Close-delimited reading is deferred to
  a post-v0.5 change together with `Connection: close` handling, because it
  requires the reader to treat EOF as success and to bound the read by
  `maxBodyBytes` alone; the v0.5 bounded exchange contract ("one message,
  no retained bytes") does not cover it.
- Reject interim `1xx` responses with `HttpError::InterimResponse()`.
  RFC 9110 section 15.2 requires a client to be able to parse one or more
  `1xx` responses before the final response; the v0.5 reader owns exactly one
  message and retains no bytes, so it cannot continue to the final response.
  Returning the `1xx` `Response` to the caller would leave the final response
  unread on the stream. The bounded client documents this restriction; the
  post-v0.5 change that adds buffered continuation lifts it.
- Keep `TrailingBytes` for octets after a complete bodiless response.
- Keep item 7 for requests unchanged.
- `Framing` continues to reject `Content-Length` plus `Transfer-Encoding` as
  `AmbiguousFraming` before the no-body rule applies (item 3 of RFC 9112
  section 6.3 tolerates it; Beskid stays strict, matching the existing
  "Unambiguous message framing" requirement). For a no-body response a single
  syntactically valid `Content-Length` is validated and then ignored for
  framing.

### Contract shape

`Http.Types`:

```beskid
/// Which framing rules of RFC 9112 section 6.3 apply to a message.
pub enum MessageRole { Request(), Response(), HeadResponse(), }
```

`Http.Codec`:

- `pub Result<i64,HttpError> MessageEnd(u8[] bytes, Limits limits, MessageRole role)`
- `pub Result<Response,HttpError> ParseResponse(u8[] bytes, Limits limits, MessageRole role)`
  (`Request` role is rejected with `InvalidStatus`; only `Response` and
  `HeadResponse` are valid here)
- `ParseRequest` signature unchanged; it uses `MessageRole::Request` internally.
- Private `bool Bodiless(MessageRole role, i64 status)`: true when role is
  `HeadResponse`, or status is 100..199, 204, or 304.
- Body rule for `Response` roles when `Bodiless` is false and `Framing`
  returns `-1`: `Error(CloseDelimitedBody())`.
- `ParseResponse` returns `Error(InterimResponse())` for status 100..199
  after framing validation; `MessageEnd` still reports the head end for
  `1xx` so `Wire` reads exactly the head before the parser rejects it.

`Http.Wire`: `ReadMessage(TcpStream stream, Limits limits, MessageRole role)`.

`Http.Errors`: add `CloseDelimitedBody(), InterimResponse(),`.

`Http.Client.Send`: `MessageRole role = match request.method == "HEAD" { true => HeadResponse, false => Response }`.

`Http.Server.Receive`: passes `MessageRole::Request`.

### OpenSpec text

**File:** `openspec/changes/beskid-v0-5-http/specs/core-library--networking--http/spec.md`.
Modify "Unambiguous message framing" to add:

> A response to a `HEAD` request and any response with a `1xx`, `204`, or
> `304` status SHALL end at the first empty line after the header section.
> The library MUST validate but MUST NOT apply a `Content-Length` or
> `Transfer-Encoding` field in such a response to body framing. A request
> with neither field SHALL have a zero-length body. A response with neither
> field that is not bodiless by the rule above SHALL be rejected with
> `HttpError::CloseDelimitedBody`; the v0.5 bounded client does not read
> close-delimited bodies. A `1xx` response SHALL be rejected with
> `HttpError::InterimResponse`; the v0.5 bounded client does not consume
> interim responses. The caller SHALL state the message role
> (`Request`, `Response`, `HeadResponse`) when parsing or reading a message.

Scenario:

> #### Scenario: HEAD response with Content-Length has no body
> - **WHEN** a client sends `HEAD /` and receives `HTTP/1.1 200 OK` with `Content-Length: 1234` and no further octets
> - **THEN** `Client.Send` returns the response with an empty body without waiting for 1234 octets

Second scenario (recommended, same requirement):

> #### Scenario: close-delimited response is rejected
> - **WHEN** a client receives `HTTP/1.1 200 OK` with neither `Content-Length` nor `Transfer-Encoding`
> - **THEN** `Client.Send` returns `HttpError::CloseDelimitedBody` and returns no body octets

### Affected files and fixtures

- `corelib/packages/http/src/Http/Types.bd`, `Codec.bd`, `Wire.bd`,
  `Client.bd`, `Server.bd`, `Errors.bd`, `README.md`.
- `corelib_tests/src/http/CodecTests.bd`: every `MessageEnd` call gains a
  role argument (`MessageRole::Request` for the existing request fixtures);
  add `http_response_head_role_ignores_content_length`,
  `http_response_204_with_body_octets_is_trailing_bytes`,
  `http_unframed_2xx_response_is_close_delimited`, and
  `http_interim_response_is_rejected`.
- `corelib_tests/src/http/SerializationTests.bd`:
  `http_response_parser_requires_http11_status_and_exact_suffix` calls
  `ParseResponse(valid, limits)` twice; add `MessageRole::Response`. Its
  `204 ... x` suffix case still expects `TrailingBytes`; unchanged semantics.
- `corelib_tests/src/http/ExchangeTests.bd`: unchanged (POST with framed
  bodies). Add `http_exchange_head_returns_no_body` through loopback.
- Server side: `Respond` for a `HEAD` request stays the application's
  responsibility (send an empty body; the serializer emits
  `content-length: 0`, which RFC 9110 section 8.6 permits). Document it; no
  code change.

### Migration impact

Two public signatures gain a `MessageRole` parameter (`MessageEnd`,
`ParseResponse`, plus internal `Wire.ReadMessage`). Three test files need the
argument. No runtime or network change.

### Risk

Low to medium. The deferred close-delimited support means a v0.5 client
cannot talk to a server that sends HTTP/1.0-style unframed `200` bodies; this
is documented as a bounded-client restriction and fails with a typed error
rather than a wrong empty body.

### Sources

- RFC 9112 section 6.3 items 1, 3, 6, 7, 8 (quoted above); section 8 "Handling Incomplete Messages" ("A client that receives an incomplete response message ... MUST record the message as incomplete").
- RFC 9110 section 9.3.2 (`HEAD`: "the server MUST NOT send content in the response"), section 8.6 (`Content-Length` on `HEAD` and `304`), section 15.3.5 (`204` "terminated by the end of the header section"), section 15.2 (`1xx` handling).
- Zig `std.http.Client`: a response with neither framing field is read "until EOF" (close-delimited), which is the behavior Beskid defers.
- .NET `HttpRequestError.ResponseEnded` ("The response ended prematurely") is the analogue of Beskid's `UnexpectedEof`.

---

## 5. Deadlines and a typed deadline policy

### Problem in the code

Every wait registers `ExternalWaitRegister(..., -1)` (`Operations.bd` line 65,
`Dns.bd` line 71). The runtime already has `EXTERNAL_TIMEOUT` (4) and
`NETWORK_TIMED_OUT` (12); native `ETIMEDOUT` / `WSAETIMEDOUT` from keep-alive
or retransmission failure already reaches corelib as `TimedOut` on lifecycle
operations and, after item 1, as `TransferFailure::TimedOut` on stream
operations. What is missing is a caller-supplied deadline.

### Recommended ruling

Deferred to a new OpenSpec change `openspec/changes/add-network-deadline-policy-0-6/`
(naming follows `add-beskid-glue-0-4` and `extend-extern-import-extraction-glue-0-5`).
Do not add it to v0.5: the networking delta already states "an operation has
no deadline unless a future typed public deadline policy supplies one"
(`BSP-REQ-D15E92AB4C76`), Foundation deferred public absolute time
(`SleepUntil(Instant)`) until a clock-domain-safe deadline type exists
(`BSP-REQ-D613601481B2`), and a deadline policy without that type would
either expose raw nanosecond integers or invent a second time domain.

Record the target shape now so v0.5 does not block it:

- Foundation adds an opaque monotonic `Core.Time.Deadline` value with
  `Deadline.After(Duration) -> Result<Deadline, TimerError>` (checked
  addition, same validation as `Sleep`) and no public constructor from
  `Instant`. This is the same "checked or opaque monotonic domain" that the
  deferred `SleepUntil` needs; one type serves both.
- Network keeps the fixed `Core.IO.Stream` signatures and adopts the Go
  model of per-stream absolute deadlines:
  `TcpStream.SetDeadlines(TransferDeadlines policy) -> Result<unit, NetworkError>`
  with `pub type TransferDeadlines { pub Option<Deadline> read, pub Option<Deadline> write }`.
  An expired read deadline completes the pending read with
  `IoError::ReadFailed(TransferFailure::TimedOut)`; the stream stays usable
  for a new deadline. Lifecycle operations take an explicit optional
  deadline argument: `Connect(address, options, Option<Deadline>)`,
  `TcpListener.Accept(Option<Deadline>)`, `Dns.Resolve(..., Option<Deadline>)`,
  and the UDP receive and send variants. Expiry on those returns
  `NetworkError::TimedOut`.
- The runtime passes the absolute monotonic value to
  `ExternalWaitRegister` in place of `-1`; no second timer path, in line
  with `BSP-REQ-896BA6C917E9` and `BSP-REQ-F902B81D6E4C`.
- HTTP adds `Limits`-adjacent `ExchangeDeadlines { Option<Deadline> head, Option<Deadline> body }`
  only after the Network policy lands.

### OpenSpec text (for the deferred change, not for v0.5)

**File:** `openspec/changes/add-network-deadline-policy-0-6/specs/core-library--networking--network-tcp/spec.md`,
MODIFIED `BSP-REQ-D15E92AB4C76`:

> `TcpStream.SetDeadlines` SHALL accept a `TransferDeadlines` value whose
> `read` and `write` fields are optional opaque monotonic `Core.Time.Deadline`
> values. A pending or later read that reaches its deadline SHALL complete
> with `IoError::ReadFailed(TransferFailure::TimedOut)` exactly once through
> the Foundation one-winner transition; a write SHALL complete with
> `IoError::WriteFailed(TransferFailure::TimedOut)`. An absent deadline
> SHALL register an unbounded wait. Deadlines MUST be monotonic absolute
> values and MUST NOT be exposed or accepted as raw integers.

Scenario:

> #### Scenario: read deadline expires without closing the stream
> - **GIVEN** a stream with a read deadline in the past and a peer that sends nothing
> - **WHEN** the caller reads
> - **THEN** it receives `IoError::ReadFailed(TransferFailure::TimedOut)` once, and a later read after a new deadline can still receive peer data

### Affected files (deferred)

`Core/Time/Time.bd` (new `Deadline`), `Network/Tcp/TcpStream.bd`,
`TcpListener.bd`, `Udp/UdpSocket.bd`, `Dns.bd`, `Internal.bd`,
`Runtime/Network/Operations.bd`, `Dns.bd`, manifest services (deadline
parameter on `__network_read`/`__network_write`/`__network_accept`/
`__network_open`/`__network_dns_resolve` or a separate
`__network_set_deadlines` service), and new corelib and runtime race tests.

### v0.5 obligation

None beyond keeping `-1`. Confirm the v0.5 README sentence "This API revision
registers an unbounded deadline" stays. Item 1 must land first so that
`TransferFailure::TimedOut` exists when the deferred change arrives.

### Risk

None for v0.5. For 0.6, the main risk is choosing per-operation arguments
versus per-stream state; the per-stream model is recommended because the
`Core.IO.Stream` signatures are fixed by Foundation.

### Sources

- Go `net.Conn`: "A deadline is an absolute time after which I/O operations fail instead of blocking"; zero value means no deadline; `os.ErrDeadlineExceeded` with `Timeout() == true`; `SetReadDeadline` / `SetWriteDeadline` are per-direction.
- Rust `TcpStream::set_read_timeout(Option<Duration>)` / `set_write_timeout`, error `ErrorKind::TimedOut`.
- Swift NIO `ChannelError.connectTimeout(TimeAmount)` for connect; read/write timeouts are handler-level (`IdleStateHandler`).
- Foundation delta `BSP-REQ-D613601481B2` (absolute sleep deferred until a clock-domain-safe type exists) and `BSP-REQ-896BA6C917E9` (monotonic generation-tagged timers).

---

## Which item the owner must decide personally

**Item 1.** It changes the public Foundation `IoError` enum, which is the
Foundation gate (CYB-60) that networking and HTTP acceptance are built on,
and every future stream type (Fs, TLS, HTTP/2 framing) inherits it. The
alternative to deciding now is a breaking arity change after v0.5 ships. The
recommendation is to accept option B for v0.5, but the trade-off (re-opening
one accepted Foundation requirement versus a post-release break) is the
owner's call.

Items 2, 3, 4, and 5 are convention-fit rulings the release team can adopt:
each adds closed, payload-free typed variants or defers to a named future
change, exposes no native value, and updates OpenSpec before behavior.

## Cross-item notes

- `HttpError::Network()` (from `HttpServer.Bind`, `Accept`, `LocalAddress`)
  erases `NetworkError` in the same way item 1 describes for streams. It is
  out of the five items; the release team may apply the same pattern
  (`Network(NetworkError cause)`) in the item 1 change if the owner accepts
  option B, since `Http` already depends on `Network`.
- The HTTP delta now carries stable IDs (see the note under item 3). Item 3
  is `BSP-REQ-6CAA5AC6F4E3`; item 4 extends `BSP-REQ-58182F687E87`; the
  item 1 `Transport(cause)` sentence extends `BSP-REQ-9E0DE26CF08F`.
- Item 5 is recorded as a "Deferred to `add-network-deadline-policy-0-6`"
  section in `openspec/changes/beskid-v0-5-networking/design.md`, not as a
  change directory: a proposal-and-tasks-only change fails
  `openspec validate --strict` ("Change must have at least one delta"), and a
  real delta needs the Foundation `Core.Time.Deadline` requirement first.
- `corelib_tests/src/http/CodecTests.bd` `IsError` is the single place where
  new `HttpError` variants must be listed for assertions to be meaningful;
  extend it in the same change that adds each variant.
