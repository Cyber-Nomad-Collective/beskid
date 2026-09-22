# Network protocol and corelib candidates after v0.5

**Date:** 2026-09-22  
**Scope:** a dependency-ordered candidate catalog for the networking workstream. This is research, not a normative OpenSpec change.

## Decision

Do **not** expand CYB-61/v0.5. Its proposed normative scope is Internet
TCP/UDP plus DNS resolution, and explicitly excludes TLS, every HTTP version,
QUIC, WebSocket, Unix/raw sockets, multicast, proxies, and DNS caching
([proposal](../../openspec/changes/beskid-v0-5-networking/proposal.md),
[Network.Types delta](../../openspec/changes/beskid-v0-5-networking/specs/core-library--networking--network-types/spec.md)).
That boundary is sound: each excluded protocol needs a distinct lifecycle,
security, framing, multiplexing, or policy contract beyond a socket facade.

## What belongs in the common core first

| Candidate | Layer / basis | Recommended shape | Priority |
| --- | --- | --- | --- |
| `Network.Types` address values | Internet/network | Keep the proposed opaque `IpAddress::{V4,V6}`, bounded port, `SocketAddress`, and family values. TCP itself describes IPv4 and IPv6 as its standard lower-layer IP versions ([RFC 9293, §3.9.2](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.9.2)). | v0.5 |
| network prefixes | Internet/network | Add an immutable `IpNetwork`/CIDR value only when a caller needs subnet membership, route configuration, or allow/deny policy. It is address mathematics, not a raw-IP API ([RFC 4632](https://www.rfc-editor.org/rfc/rfc4632.html)). Keep IPv6 zones out of the portable default; scoped literals are local-interface identifiers and must never silently cross a trust boundary ([RFC 6874](https://www.rfc-editor.org/rfc/rfc6874.html)). | next networking slice |
| DNS resolution | application over UDP/TCP | Keep `Resolve(host, port, family?)` as an OS resolver facade; do **not** expose a DNS wire client, cache, retry policy, or resolver configuration yet. DNS specifies both UDP and TCP transport and requires retry/reordering policy for UDP ([RFC 1035, §4.2](https://www.rfc-editor.org/rfc/rfc1035.html#section-4.2)). | v0.5 |
| dual-stack connection policy | above resolver / TCP client | Later add one `ConnectHost` policy which races the ordered IPv6/IPv4 answers, cancels losing attempts, and preserves typed attempts/errors. It belongs above TCP, not in `IpAddress`: Happy Eyeballs explicitly sorts and races addresses ([RFC 8305, §§4–5](https://www.rfc-editor.org/rfc/rfc8305.html#section-4)). | next networking slice |
| URI parser and formatter | application-neutral identifiers | Add a pure `Core.Uri` (or `Network.Uri`) value/parser with raw/parsed components, strict percent encoding, resolution, and no implicit network access. URI generic syntax is protocol-independent and includes scheme, authority, path, query, and fragment ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986.html)). Keep IDNA/IRI conversion out until its security policy is specified. | next networking slice |
| reusable framing/codecs | presentation/session-like | Build only generic byte primitives: bounded length-prefix codecs, line parsing with limits, ASCII validation, and incremental reader/writer adapters over the already planned `Core.IO`. Do not create an abstract `Protocol` or OSI service hierarchy. | next networking slice |

`Core.IO` remains the one byte-stream contract. TCP streams should implement it;
datagrams should not. New protocols must reuse the same partial-transfer, EOF,
close, deadline, cancellation, and disposal semantics instead of inventing
parallel loops.

## Protocol candidates, in dependency order

| Protocol family | Minimum prerequisite | Inclusion recommendation | Why it is not a v0.5 socket add-on |
| --- | --- | --- | --- |
| TLS 1.3 | TCP, DNS/URI hostname policy, certificate/crypto provider, secure key storage and verification policy | First post-v0.5 transport decorator: `TlsClient` / `TlsServer` wrapping `Core.IO.Stream`, with safe defaults and no insecure opt-out by default. | TLS authenticates peers and protects records; it is a security boundary, not byte framing ([RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html)). |
| HTTP semantics + HTTP/1.1 | TLS/URI, bounded HTTP text parser, headers/body streaming, cancellation/timeouts | First HTTP release: one request/response model grounded in HTTP semantics ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)) plus an HTTP/1.1 transport ([RFC 9112](https://www.rfc-editor.org/rfc/rfc9112.html)). Start with client/server correctness, explicit body disposal, and no pooling/proxy/cookie policy until separately specified. | Request routing, headers, message framing, body lifetime, redirects and authentication are application semantics. |
| HTTP/2 | TLS/ALPN, HTTP semantics, HPACK, multiplexing scheduler, flow control | Separate implementation behind the same HTTP request/response facade; do not leak HTTP/2 frames or streams as the common HTTP API. | HTTP/2 has binary framing, header compression, per-stream state and flow control ([RFC 9113](https://www.rfc-editor.org/rfc/rfc9113.html)). |
| WebSocket | HTTP/1.1 upgrade or extended CONNECT, optional TLS, framed message API | Add after HTTP: a `WebSocket` resource with bounded text/binary messages, ping/pong, close handshake, and explicit subprotocol/extensions policy. | It is an independent TCP-based protocol whose HTTP relationship is the opening upgrade handshake; it also requires masking and message framing ([RFC 6455, §§1.7, 5](https://www.rfc-editor.org/rfc/rfc6455.html#section-1.7)). |
| QUIC | UDP, TLS 1.3, loss recovery/congestion control, packet protection, connection migration and stream scheduler | A major dedicated transport release, not a `UdpSocket` helper. Expose a QUIC connection and bidirectional/unidirectional streams only after bounded resource and cancellation rules are proven. | QUIC is UDP-based, multiplexed, and secure; version 1 incorporates TLS handshaking ([RFC 9000](https://www.rfc-editor.org/rfc/rfc9000.html)). |
| HTTP/3 | QUIC plus HTTP semantics and QPACK | Implement only after QUIC; preserve the HTTP facade while providing HTTP/3 transport selection separately. | HTTP/3 relies on QUIC and its TLS handshake; it differs from HTTP/2 where QUIC differs from TCP ([RFC 9114, §§1–3.2](https://www.rfc-editor.org/rfc/rfc9114.html#section-3.2)). |
| DNS wire client / DNS-over-TLS / DNS-over-HTTPS | UDP/TCP/TLS/HTTP policy, cache and trust model | Defer. Keep v0.5 resolver-only. A wire client needs EDNS, truncation/TCP fallback, DNSSEC and caching decisions; encrypted DNS adds TLS or HTTP semantics. | DNS transport behavior is not a simple datagram call ([RFC 1035, §4.2](https://www.rfc-editor.org/rfc/rfc1035.html#section-4.2)). |
| mDNS + DNS-SD | multicast configuration, DNS wire client, local-network privacy policy | Optional LAN-discovery package only. | Multicast and DNS caching are v0.5 exclusions; discovery needs service-name and local-link semantics ([RFC 6762](https://www.rfc-editor.org/rfc/rfc6762.html), [RFC 6763](https://www.rfc-editor.org/rfc/rfc6763.html)). |
| ICMP/ICMPv6 diagnostics | privileged/raw OS capability and explicit capability model | Defer; expose no raw packet or privileged diagnostic API in the portable core. | ICMP is an IP control/error protocol, not an ordinary TCP/UDP application transport ([ICMP RFC 792](https://www.rfc-editor.org/rfc/rfc792.html), [ICMPv6 RFC 4443](https://www.rfc-editor.org/rfc/rfc4443.html)). |
| NTP | UDP and a clock-discipline/security policy | Small, optional client package—not a general `Network` primitive. | NTP is an application protocol with time-synchronization semantics ([RFC 5905](https://www.rfc-editor.org/rfc/rfc5905.html)). |
| SMTP, IMAP, SSH, MQTT, SIP, NTP, FTP and similar application protocols | TLS/URI where applicable, dedicated authentication/state/data model | **Libraries, not corelib.** Offer their shared primitives (TCP/UDP, TLS, URI, codecs, HTTP) first; each gets its own package and OpenSpec change when a product need exists. | Their authentication, authorization, command and message semantics are domain-specific rather than cross-cutting runtime services. |

## OSI research result: use it as a map, not as an API hierarchy

The OSI labels are useful for checking dependencies but should not determine
package boundaries. Beskid can own portable values and protocols from the
Internet/application layers; physical and link layers belong to the operating
system or a specialist native library. In particular, do **not** add public
Ethernet, ARP, IP-packet, routing-table, interface, raw-socket, or generic
``Layer<N>`` APIs to corelib. They would contradict CYB-61's no-raw-platform
escape rule and make the cross-target runtime responsible for host network
administration.

The durable corelib boundary is therefore:

```text
Core.Bytes / Core.Encoding / Core.IO / Disposable
        ↓
Network.Types + DNS resolver + TCP stream / UDP datagram
        ↓
URI + bounded generic codecs + dual-stack connection policy
        ↓
TLS → HTTP/1.1 → HTTP/2 or WebSocket
UDP + TLS → QUIC → HTTP/3
        ↓
domain protocol packages (SMTP, SSH, MQTT, …)
```

## Acceptance rules for every addition

1. Add an OpenSpec change before observable behavior changes; retain one
   socket/reactor lifecycle and generated manifest ABI boundary.
2. Each resource implements `Disposable`; each byte stream uses `Core.IO`.
   UDP/QUIC messages and datagrams must not pretend to be TCP streams.
3. Define bounded parsing, buffering, header/message limits, cancellation,
   deadline and close behavior before exposing a protocol type.
4. Treat certificate trust, hostname verification, ALPN, proxy routing,
   cookies, redirects, compression and pooling as explicit policies—not
   implicit global defaults.
5. Prove Linux epoll, macOS kqueue and Windows IOCP behavior at the transport
   layer before elevating a protocol facade.

## Sources

All external claims above use primary protocol specifications published by the
IETF/RFC Editor: [TCP RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html),
[DNS RFC 1035](https://www.rfc-editor.org/rfc/rfc1035.html),
[Happy Eyeballs RFC 8305](https://www.rfc-editor.org/rfc/rfc8305.html),
[URI RFC 3986](https://www.rfc-editor.org/rfc/rfc3986.html),
[TLS 1.3 RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html),
[HTTP Semantics RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html),
[HTTP/1.1 RFC 9112](https://www.rfc-editor.org/rfc/rfc9112.html),
[HTTP/2 RFC 9113](https://www.rfc-editor.org/rfc/rfc9113.html),
[WebSocket RFC 6455](https://www.rfc-editor.org/rfc/rfc6455.html),
[QUIC RFC 9000](https://www.rfc-editor.org/rfc/rfc9000.html), and
[HTTP/3 RFC 9114](https://www.rfc-editor.org/rfc/rfc9114.html).
