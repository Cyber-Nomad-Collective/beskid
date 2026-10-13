## ADDED Requirements

### Requirement: Reactor has one portable contract and required native backends
The runtime SHALL route Internet socket readiness through one internal reactor
contract. Linux production builds MUST use epoll, macOS production builds MUST
use kqueue, and Windows production builds MUST use IOCP. A fallback MAY exist
only in tests and MUST NOT replace a required production backend. Backend
selection MUST NOT alter the public Network API or error vocabulary.

**Stable ID:** `BSP-REQ-5B97C4F1D3A8`

#### Scenario: Target backend is selected
- **GIVEN** a production runtime built for macOS
- **WHEN** it registers a TCP accept wait
- **THEN** the wait is registered through kqueue and exposes no kqueue detail to the caller

### Requirement: Socket operations share the Foundation terminal winner
Every socket readiness, DNS completion, cancellation, deadline expiry, and close SHALL settle through the Foundations change's owner-routed completion and atomic one-winner operation contract. A winning transition MUST resume the waiting fiber once and perform idempotent deregistration; every losing or stale transition MUST perform no user-visible completion. Networking MUST NOT add an alternate scheduler wake, timer, or cancellation path.

**Stable ID:** `BSP-REQ-F902B81D6E4C`

#### Scenario: Close races readiness
- **GIVEN** a fiber waiting to read from a TCP stream
- **WHEN** close and readiness race for the same operation
- **THEN** exactly one typed terminal outcome resumes the fiber and late readiness is discarded

### Requirement: Network shutdown is idempotent and leak-audited
Closing a network resource SHALL invalidate its active handle generation,
cancel or deregister its pending operations, and release its native socket at
most once. Debug and conformance modes MUST report each live network handle at
runtime shutdown and MUST fail the leak check. Runtime diagnostics MUST include
slot, generation, owner scheduler, backend, operation kind, and winner but
MUST NOT reveal a native descriptor.

**Stable ID:** `BSP-REQ-8A21D67C43FE`

#### Scenario: Duplicate close does not leak or double-close
- **GIVEN** a TCP stream with a pending read
- **WHEN** its owner invokes close twice
- **THEN** the socket is released once, the read receives one terminal outcome, and the leak check reports no live handle
