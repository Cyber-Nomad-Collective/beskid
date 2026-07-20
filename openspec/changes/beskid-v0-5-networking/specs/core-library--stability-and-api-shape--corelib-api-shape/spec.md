## ADDED Requirements

### Requirement: Network streams consume Foundation Core.IO and Disposable contracts
`Network.Tcp.TcpStream` SHALL implement the `Core.IO.Stream` and `Core.Disposable`
contracts introduced by `beskid-v0-5-foundations`; `TcpListener` and `UdpSocket`
SHALL implement `Core.Disposable`. Network code MUST use the Foundation partial
transfer, EOF, no-progress, idempotent-close, scoped `use`, and resource
transport rules and MUST NOT define competing versions of those contracts.
The `Core.IO.Stream` methods retain Foundation `IoError`; socket lifecycle and
policy operations retain `NetworkError`. Implementing `Stream` MUST NOT change
the Foundation method signatures to return `NetworkError`.

**Stable ID:** `BSP-REQ-4E7D12C9B6A0`

#### Scenario: TCP partial writes use Core.IO
- **GIVEN** a TCP stream whose native write accepts only part of a buffer
- **WHEN** a caller invokes Foundation `WriteAll` through the stream
- **THEN** the existing Core.IO contract completes the transfer or returns its typed error
