## ADDED Requirements

### Requirement: TCP exposes typed listener and stream lifecycle
`Network.Tcp` SHALL expose typed `TcpListener.Bind`, `Accept`, `LocalAddress`,
`Close`, and `TcpStream.Connect`, `Read`, `Write`, `ShutdownWrite`,
`LocalAddress`, `PeerAddress`, `SocketOptions`, and `Close` operations. `Accept`
and `Connect` MUST return opaque resource values. `Read` MUST return EOF through
the Foundation Core.IO contract; `Write` MAY complete partially and `WriteAll`
MUST remain the Foundation operation; `ShutdownWrite` MUST preserve reading
until EOF, close, or another typed terminal error. `Read` and `Write` MUST use
the Foundation Core.IO signatures and `IoError` vocabulary; transport read,
write, and close failures map to `ReadFailed(cause)`, `WriteFailed(cause)`, and
`CloseFailed` respectively, with the Foundation `TransferFailure` cause table:
runtime `Busy` maps to `Busy`; `Closed` and `NotConnected` map to `Closed`;
`Cancelled` maps to `Cancelled`; `TimedOut` maps to `TimedOut`;
`ConnectionReset` maps to `PeerReset`; `ConnectionAborted` maps to
`PeerAborted`; every other status maps to `Unspecified`. Same-direction stream
contention is a read or write operation failure and therefore maps to that
method's corresponding `IoError` with cause `Busy`; it MUST NOT change the
fixed `Core.IO.Stream` method signatures. TCP construction,
addressing, options, shutdown, cancellation, explicit deadline policy, and
non-stream concurrency-policy failures MUST return `NetworkError`. v0.5 does
not invent an ambient deadline lookup: an operation has no deadline unless a
future typed public deadline policy supplies one. No operation may expose native
descriptors or constants.

**Stable ID:** `BSP-REQ-D15E92AB4C76`

#### Scenario: Half-close preserves reads
- **GIVEN** two connected TCP streams and one peer has data remaining to send
- **WHEN** the other peer invokes `ShutdownWrite`
- **THEN** that peer can still read the remaining data until EOF or a typed Network error

### Requirement: TCP has one accept, one read, and one write in flight
A `TcpListener` SHALL permit at most one pending `Accept`. A `TcpStream` SHALL
permit at most one pending read and one pending write, which MAY proceed
concurrently with each other. A competing `Accept` MUST return
`NetworkError::Busy`. A competing stream `Read` or `Write` MUST return its
operation-specific `IoError` (`ReadFailed(cause)` or `WriteFailed(cause)`)
carrying the Foundation `TransferFailure::Busy` cause, without registering
another reactor wait or consuming input. Cancellation, readiness, and close MUST obey the shared
Foundation one-winner lifecycle; a deadline participates only when supplied by
an explicit typed deadline policy.

**Stable ID:** `BSP-REQ-410CB8F5E97A`

#### Scenario: Second pending read is rejected
- **GIVEN** a TCP stream with one pending read
- **WHEN** a second fiber starts another read on that stream
- **THEN** the second operation returns `IoError::ReadFailed(TransferFailure::Busy())` and the first read remains the only registered read wait

### Requirement: TCP close transfers no duplicate resource ownership
`TcpStream` and `TcpListener` close SHALL be idempotent and SHALL integrate with
Foundation `use`, `Disposable`, and `Channel<TcpStream>` ownership rules. Close,
cancellation, or an explicitly configured deadline MUST leave a stream owned by exactly one party until
the successful close transition releases it; they MUST NOT duplicate a stream,
implicitly dispose a stream committed to a channel, or leak a pending operation.

**Stable ID:** `BSP-REQ-E6A31C7D095B`

#### Scenario: Scoped stream cleanup races an explicit deadline
- **GIVEN** a `use TcpStream` scope with a pending read governed by an explicit typed deadline policy
- **WHEN** scope exit and the configured deadline race
- **THEN** the read receives one terminal outcome and scoped disposal closes the stream at most once
