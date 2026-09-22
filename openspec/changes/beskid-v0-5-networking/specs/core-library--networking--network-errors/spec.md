## ADDED Requirements

### Requirement: Network.Errors is a closed portable error union
`Network.Errors.NetworkError` SHALL be the sole public networking failure
union. It MUST include `AddressInUse`, `AddressNotAvailable`,
`ConnectionAborted`, `ConnectionRefused`, `ConnectionReset`, `HostNotFound`,
`InvalidAddress`, `MessageTooLarge`, `NetworkDown`, `NotConnected`,
`PermissionDenied`, `TimedOut`, `Cancelled`, `Closed`, `Busy`, `CleanupFailed`,
`Unsupported`, and `ResourceExhausted`.
Native errors MUST be mapped to exactly one applicable variant before reaching
corelib. A public Network error MUST NOT carry an errno, WSA code, OS descriptor,
platform constant, or unbounded native error text. `Network` SHALL declare the
explicit cleanup conversion from Foundation `DisposeError` to
`NetworkError::CleanupFailed` for callables returning `Result<T, NetworkError>`;
this MUST NOT create a general implicit conversion.

`NetworkError::ResourceExhausted` SHALL be returned when the runtime socket
table has no free slot, when a runtime or native allocation for a request,
buffer, or resolver job fails, or when the host reports descriptor, buffer,
or memory exhaustion. `NetworkError::NetworkDown` SHALL be reserved for a
host report that the network, route, or host is unreachable, and for
native failures that match no other variant. The two variants MUST NOT be
substituted for one another.

**Stable ID:** `BSP-REQ-CAB59E0274D1`

#### Scenario: Connection refusal has no WSA or errno payload
- **GIVEN** a native connect attempt that the peer refuses
- **WHEN** the runtime completes the Beskid operation
- **THEN** the caller receives `NetworkError::ConnectionRefused` with no native error code or descriptor

#### Scenario: Scoped cleanup maps to the portable network union
- **GIVEN** a network resource whose scoped `Dispose` returns `DisposeError::Failed`
- **WHEN** it exits a callable returning `Result<T, NetworkError>`
- **THEN** the explicit cleanup conversion returns `NetworkError::CleanupFailed` without native error detail

#### Scenario: Socket table exhaustion is not a network outage
- **GIVEN** every runtime socket slot holds a live socket
- **WHEN** a caller binds one more UDP socket
- **THEN** it receives `NetworkError::ResourceExhausted` and, after one live socket closes, the next bind succeeds
