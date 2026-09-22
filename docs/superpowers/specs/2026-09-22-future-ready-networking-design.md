# Future-Ready Networking Design

**Status:** Proposed architecture for the v0.5 networking workstream and its
post-v0.5 protocol extensions. This document is not normative OpenSpec text.

## Intent

Deliver one portable networking foundation that can support DNS, TCP, UDP, and
HTTP/1.1 in v0.5, then TLS, HTTP/2, WebSocket, QUIC, and HTTP/3 without
introducing another scheduler, socket lifecycle, native ABI route, or public
platform handle.

Success means a new protocol is primarily a bounded protocol state machine
over existing typed transport resources. It does not need to know which native
backend delivered I/O, how a completion woke a fiber, or how a native socket is
represented.

## Established constraints

- CYB-61 depends on accepted CYB-60 Foundation evidence for `Core.IO`,
  `Disposable`, resource transport, owner-routed external completions,
  monotonic deadlines, and the one-winner terminal transition.
- The manifest and ABI generator are the sole authority for target native
  imports. A corelib-native service must pass the generic source/manifest/
  target-binding preflight. It must not use a handwritten import or a
  protocol-specific FFI exception.
- Linux uses epoll, macOS uses kqueue, and Windows uses IOCP. A deterministic
  fake adapter is permitted only in tests; polling is not a production
  fallback.
- Public values cannot expose a file descriptor, `SOCKET`, `HANDLE`, errno,
  WSA error, readiness bit, or platform constant.
- `Core.IO` owns byte-stream transfer rules. `Disposable` owns scoped cleanup.
  TCP and TLS are streams; UDP datagrams and QUIC datagrams are not streams.
- OpenSpec changes precede observable behavior changes. The checked-in
  networking and HTTP changes remain the v0.5 normative scope until replaced
  by accepted revisions.

## Architecture

### Ownership model

```text
Corelib protocol facade
  -> typed resource or pure codec
  -> Runtime.Network operation registry
  -> Foundation terminal winner and owner scheduler command
  -> manifest-generated native adapter
  -> epoll | kqueue | IOCP | blocking resolver work
```

`Runtime.Network` is the deep module at the transport seam. Its public-facing
implementation contract is limited to typed operations and outcomes; its
internal implementation owns opaque `(slot, generation)` handles, native
resource identity, operation registration, direction reservations, deadline
registration, cancellation, close, stale-event rejection, and leak auditing.

Only the owning scheduler executes the terminal winner transition that resumes
a fiber. Native adapters and resolver workers publish normalized completion
data to that scheduler; they do not mutate fiber state or execute Beskid code.

### Module boundaries

| Module | Owns | Must not own |
| --- | --- | --- |
| Foundation | Fiber scheduler, inbound owner commands, terminal winner, time, cancellation, `Core.IO`, `Disposable` | Socket identity, protocol framing, resolver policy |
| Runtime.Network | Handle table, socket lifecycle, operation registry, completion normalization, backend registration, diagnostics | HTTP/TLS/QUIC framing, a second scheduler, public native values |
| Native adapter | Narrow OS calls, event polling/submission, transient native buffers | Scheduler authority, public errors, protocol policy |
| Network corelib | Addresses, endpoints, DNS facade, TCP streams/listeners, UDP datagrams, portable errors | Raw descriptors, transfer retries, platform branches |
| Protocol package | Bounded parse/serialize/state machine and protocol-specific error model | Socket table, native import, duplicate close/wait machinery |

### Protocol-extension contract

A protocol package may consume `Core.IO.Stream`, typed network resources,
Foundation cancellation/deadline policy, and protocol-neutral codecs. It may
wrap a stream (for example, `TlsStream`) or multiplex a transport (for example,
HTTP/2 or QUIC), but it must preserve explicit ownership and disposal.

A protocol package must not:

- create or interpret native handles;
- add a direct platform call, polling loop, or native completion callback;
- duplicate `ReadExact`, `WriteAll`, cleanup lowering, terminal-winner logic,
  or generic cancellation delivery;
- silently choose trust stores, redirects, proxies, cookies, compression,
  pooling, address-family fallback, or cache policy.

Each such policy is a typed explicit configuration at the narrowest appropriate
protocol layer.

## Common core additions after the v0.5 transport baseline

1. Add immutable network-prefix/CIDR values only for real subnet matching or
   policy consumers; do not turn them into route-table or interface APIs.
2. Add a pure `Core.Uri` value with strict parsing, percent encoding,
   normalization, and relative-reference resolution. It performs no network
   access, DNS lookup, or implicit credential handling.
3. Add bounded reusable codecs: ASCII validation, line framing, length-prefix
   framing, byte cursors, and explicit size limits over `Core.IO`.
4. Add one dual-stack `ConnectHost` policy above DNS and TCP. It owns ordered
   IPv6/IPv4 racing and cancellation of losing attempts; `IpAddress` stays a
   value type.

These are protocol-neutral leverage points. An abstract OSI hierarchy,
Ethernet/raw-IP objects, routing tables, network-interface management, ARP,
or generic `Layer<N>` abstractions are excluded from portable corelib.

## Delivery order

### Stage A: establish the Foundation and native-import gates

Accept and prove CYB-60. Reconcile the release authority for Glue versus the
generic corelib-native-import preflight, then require the latter for every
network service on all supported targets. The network workstream cannot begin
until source-to-manifest-to-target binding identity is fail-closed.

### Stage B: build and prove the transport kernel

Implement `Runtime.Network` before public protocol operations. Test handle
generation reuse, stale notifications, duplicate close, close/readiness,
cancel/deadline, exactly-one resume, direction contention, and shutdown leak
audits with a fake adapter. Establish the target adapters only behind the
generated manifest contract.

### Stage C: complete v0.5 vertical slices

Add portable types and errors, then DNS, TCP, UDP, and HTTP/1.1. DNS uses the
Foundation blocking-pool external-work path and discards later results after
caller cancellation while retaining accounting until the worker exits. TCP
implements `Core.IO.Stream`; UDP preserves datagram boundaries and does not
implement `Stream`; HTTP/1.1 uses only `Core.IO` and Network TCP resources.

### Stage D: add protocol-neutral leverage

Add URI, codecs, optional CIDR, and dual-stack connect policy only after a
consumer makes each necessary. Each addition is pure or sits above the
transport seam, so it cannot widen the native ABI.

### Stage E: secure and multiplexed protocols

1. TLS 1.3 introduces a stream decorator plus explicit trust, hostname,
   certificate, and ALPN policies.
2. HTTP/2 adds binary framing, HPACK, stream state, flow control, and a
   multiplexing scheduler behind the same HTTP semantic facade.
3. WebSocket builds on the HTTP opening handshake and exposes bounded message
   framing, ping/pong, close, and explicit extension/subprotocol policy.
4. QUIC is a dedicated secure UDP transport with loss recovery, congestion
   control, migration, and streams. It is not a `UdpSocket` helper.
5. HTTP/3 follows QUIC and QPACK while retaining the common HTTP semantic
   facade.

DNS wire clients, encrypted DNS transports, mDNS/DNS-SD, NTP, SSH, MQTT, SMTP,
IMAP, SIP, FTP, gRPC, and similar protocols are optional packages with their
own OpenSpec contracts. ICMP, raw IP, Ethernet, routing, and network
administration are deliberately outside the portable corelib boundary.

## Acceptance model

Every stage supplies four kinds of proof:

1. **Shape:** Public API audits prove no native value or alternate lifecycle
   leaks through source, generated symbols, errors, or documentation.
2. **Lifecycle:** Deterministic race tests prove one winner, owner-only fiber
   resumption, stale-event discard, idempotent close, and leak reporting.
3. **Semantics:** Protocol fixtures prove bounded parsing, exact framing,
   failure mapping, cancellation, deadline, cleanup, and resource ownership.
4. **Portability:** JIT, AOT, and installed native-kit runs cover each
   available target. Linux epoll, macOS kqueue, and Windows IOCP are asserted;
   an unavailable target remains an explicit open evidence cell.

## Risks and decisions

| Risk | Decision |
| --- | --- |
| Protocol teams bypass Network for a convenient native call | Generated native-import preflight and API-shape audits reject it. |
| TLS, HTTP, or QUIC duplicates I/O policy | Core.IO and Foundation remain the only generic transfer, cleanup, and wait contracts. |
| A future protocol forces another runtime reactor | It must either use Runtime.Network or be proposed as a new transport with its own explicit accepted design; no implicit exception. |
| Platform behavior leaks into a public error | Adapters normalize outcomes before owner-scheduler delivery; public error unions stay portable and closed. |
| Scope expands v0.5 into an unfinished protocol catalog | Stages D and E are post-v0.5 changes; v0.5 remains DNS, TCP, UDP, and bounded HTTP/1.1. |

## Sources and related work

- `openspec/changes/beskid-v0-5-foundations/`
- `openspec/changes/beskid-v0-5-networking/`
- `openspec/changes/beskid-v0-5-http/`
- `openspec/changes/add-v05-corelib-native-import-preflight/`
- `docs/research/2026-09-19-v05-networking-plan-research.md`
- `docs/research/2026-09-22-v05-network-protocol-candidates.md`
- RFC 3986 (URI), RFC 8305 (Happy Eyeballs), RFC 8446 (TLS 1.3), RFC 9113
  (HTTP/2), RFC 6455 (WebSocket), RFC 9000 (QUIC), and RFC 9114 (HTTP/3).
