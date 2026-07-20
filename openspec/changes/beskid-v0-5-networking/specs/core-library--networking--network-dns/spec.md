## ADDED Requirements

### Requirement: DNS resolves typed addresses without a cache
`Network.Dns.Resolve` SHALL accept a host name, port, and optional
`AddressFamily` filter and SHALL return every resolver result that matches the
filter as `SocketAddress` values. It MUST preserve resolver result order, map a
missing host to `NetworkError::HostNotFound`, and MUST NOT add a process,
package, or implicit resolver cache. DNS operations MUST expose no resolver
handle or platform result structure.

**Stable ID:** `BSP-REQ-29D8A7C6E340`

#### Scenario: Family-filtered resolution returns all matching addresses
- **GIVEN** a host with IPv4 and IPv6 resolver results
- **WHEN** the caller resolves it with the IPv6 family filter
- **THEN** the result contains every IPv6 `SocketAddress` in resolver order and no IPv4 address

### Requirement: DNS cancellation cancels the Beskid wait and discards late results
DNS resolution SHALL run through the Foundation external-work path. When caller
cancellation, deadline, or close wins, the caller MUST receive the corresponding
typed terminal Network error exactly once. The implementation MUST retain
Foundation active-external-wait accounting until the host resolver job exits and
MUST discard its later result; it MUST NOT promise that the host resolver itself
is interrupted.

**Stable ID:** `BSP-REQ-6F03B4D9A82E`

#### Scenario: Cancelled resolver result is discarded
- **GIVEN** a resolver job that is still running after its caller cancels
- **WHEN** the host resolver later returns addresses
- **THEN** the caller remains cancelled, receives no second completion, and the result is discarded after accounting is released
