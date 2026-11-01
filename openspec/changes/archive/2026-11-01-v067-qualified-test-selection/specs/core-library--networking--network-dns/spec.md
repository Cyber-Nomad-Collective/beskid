## MODIFIED Requirements

### Requirement: DNS resolves typed addresses without a cache
`Network.Dns.Resolve` SHALL accept a host name, port, and optional
`AddressFamily` filter and SHALL return every resolver result that matches the
filter as `SocketAddress` values. It MUST preserve resolver result order, map a
missing host to `NetworkError::HostNotFound`, and MUST NOT add a process,
package, or implicit resolver cache. DNS operations MUST expose no resolver
handle or platform result structure. A missing host SHALL include every
resolver answer that gives the name no usable address: an unknown name
(`EAI_NONAME`), a known name without address records (`EAI_NODATA`, and
`WSANO_DATA` on Windows), and a name without an address of the requested family
(`EAI_ADDRFAMILY`). A resolver that cannot answer (`EAI_AGAIN`, `EAI_FAIL`)
SHALL map to `NetworkError::NetworkDown`.

**Stable ID:** `BSP-REQ-29D8A7C6E340`

#### Scenario: Family-filtered resolution returns all matching addresses
- **GIVEN** a host with IPv4 and IPv6 resolver results
- **WHEN** the caller resolves it with the IPv6 family filter
- **THEN** the result contains every IPv6 `SocketAddress` in resolver order and no IPv4 address

#### Scenario: A name without address records is not found
- **GIVEN** a resolver that answers `EAI_NODATA` for a host name
- **WHEN** the caller resolves that name
- **THEN** the caller receives `NetworkError::HostNotFound`, not `NetworkError::NetworkDown`
