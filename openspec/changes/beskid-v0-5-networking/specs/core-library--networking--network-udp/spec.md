## ADDED Requirements

### Requirement: UDP preserves datagram boundaries and source metadata
`Network.Udp` SHALL expose typed `Bind`, optional `Connect`, `ReceiveFrom`,
`SendTo`, connected `Receive` and `Send`, `LocalAddress`, `PeerAddress`, and
`Close` operations. Each receive MUST return exactly one `Datagram` preserving
the native datagram boundary and source `SocketAddress`; it MUST set truncation
status when a supplied receive buffer cannot contain the full datagram. UDP
MUST NOT implement Foundation `Core.IO.Stream` and MUST NOT merge, split, or
silently discard datagram boundaries.

**Stable ID:** `BSP-REQ-74F9B2C8A6D0`

#### Scenario: Truncated receive remains one datagram
- **GIVEN** a UDP datagram larger than the caller's receive buffer
- **WHEN** `ReceiveFrom` completes
- **THEN** it returns one `Datagram` with the available payload, original source address, and truncation status set

### Requirement: UDP has one receive and one send in flight
A `UdpSocket` SHALL permit at most one pending receive and one pending send,
which MAY proceed concurrently with each other. A competing same-direction
operation MUST return `NetworkError::Busy` without registering a second wait.
Cancellation, deadline, readiness, and close MUST use the shared Foundation
one-winner lifecycle and MUST preserve the ownership of caller-provided send
payload until a successful send completes.

**Stable ID:** `BSP-REQ-2A5DC9E7F4B3`

#### Scenario: Competing send is rejected without payload loss
- **GIVEN** a UDP socket with one pending send
- **WHEN** a second fiber attempts `SendTo` with its own payload
- **THEN** the second call returns `NetworkError::Busy`, retains its payload ownership, and creates no second reactor wait
