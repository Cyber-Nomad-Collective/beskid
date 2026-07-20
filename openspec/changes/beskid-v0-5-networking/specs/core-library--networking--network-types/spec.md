## ADDED Requirements

### Requirement: Network.Types exposes portable typed addresses and options
`Network.Types` SHALL expose `IpAddress::V4`, `IpAddress::V6`, `SocketAddress`,
`AddressFamily::{V4,V6}`, `SocketOptions`, and `Datagram` as typed,
language-owned values. `SocketAddress` MUST contain exactly an `IpAddress` and a
port in the inclusive range 0 through 65535; a bind operation MAY use port zero
only to request an OS-selected port. `Datagram` MUST contain payload, source
address, and truncation status. These public values, their fields, and their
constructors MUST NOT contain or accept OS descriptors, readiness flags,
errno/WSA codes, or platform constants.

**Stable ID:** `BSP-REQ-17C4F8A02D65`

#### Scenario: A typed IPv6 endpoint has no descriptor
- **GIVEN** a caller constructs an IPv6 `SocketAddress` with port 443
- **WHEN** the caller inspects the public value
- **THEN** it contains only the IPv6 address and port and no native socket identifier or platform constant

### Requirement: v0.5 networking scope excludes non-Internet transport features
The public v0.5 Network package MUST exclude TLS, HTTP/1.1 or later protocols,
HTTP client pooling, proxies, QUIC, WebSocket, Unix-domain sockets, raw sockets,
multicast configuration, DNS caching, transparent compression, multipart
streaming, async iterators, channel `select`, and every descriptor escape hatch.
Unsupported requests MUST fail with a typed `NetworkError::Unsupported` or be
absent from the public API; they MUST NOT expose a native fallback.

**Stable ID:** `BSP-REQ-93E6F1A8C57D`

#### Scenario: Raw socket API is unavailable
- **GIVEN** a caller using the v0.5 Network package
- **WHEN** it attempts to obtain a raw socket or native descriptor
- **THEN** no such public API exists
