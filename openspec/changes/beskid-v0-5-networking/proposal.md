## Why

The v0.5 release needs a portable networking contract that is independent of
POSIX and Winsock details. The current standard has no public DNS, TCP, or UDP
surface and no socket lifecycle ABI. Letting individual corelib consumers bind
descriptors, error codes, or readiness loops would create incompatible public
APIs and duplicate completion paths.

CYB-61 delivers this change only after CYB-60 (`beskid-v0-5-foundations`) has
established generic resource transport, owner-routed external completions,
monotonic deadlines, scoped disposal, and Core.IO. CYB-62 HTTP depends on this
change and adds no alternate socket path.

## What Changes

- Define one internal, manifest-registered socket ABI using opaque,
  generation-tagged runtime handles and one reactor operation state.
- Define the `Network.Types` and `Network.Errors` public contracts, including
  portable addresses, options, and error variants that contain no descriptor,
  errno, Winsock code, or platform constant.
- Define cancellable, non-caching DNS resolution; TCP listeners and streams;
  UDP sockets and datagram boundaries; their ownership, deadline, and
  concurrency policies; and Linux/macOS/Windows conformance requirements.
- Require network resources to implement the Core.IO and `Disposable` contracts
  introduced by Foundations without redefining their transfer or cleanup rules.
- Exclude TLS, HTTP-family protocols, QUIC, WebSocket, socket classes outside
  Internet TCP/UDP, and all public raw-platform escape hatches from v0.5.

## Compatibility, migration, and rollout

- This is an additive v0.5 package. No legacy public socket package or native
  descriptor facade is retained; implementation code that reaches sockets
  through Core.Syscall or an OS-specific API MUST migrate to `Network`.
- The portable public API is identical on Linux, macOS, and Windows. Each
  target uses its required native readiness backend; a test-only fallback MUST
  NOT become a production backend.
- No legacy URL migration, catalog generation, site publication, or deployment
  occurs in this change. The HTTP release change owns release-wide catalog and
  delivery evidence after both prerequisites validate.

## Rollback

Before implementation this proposed delta can be abandoned without artifact
rollback. During implementation, rollback is one coordinated revert of the
manifest ABI, reactor, platform backends, and Network package; selectively
retaining public APIs or an old descriptor path is forbidden because it would
leave two lifecycle implementations.

## Impact

- Affected canonical capabilities: runtime builtin registry, fiber scheduler,
  corelib API shape, and the new Network Types, Errors, DNS, TCP, and UDP
  capabilities.
- Affected implementation surfaces: runtime manifest and ABI generator,
  canonical Beskid runtime modules under `compiler/runtime/beskid/src/Runtime/Network/**`,
  manifest-authorized platform intrinsics, scheduler command routing,
  `compiler/corelib/packages/network`, JIT/AOT/native runtime-kit tests, and
  three-target loopback conformance. This change MUST NOT revive a Rust
  `beskid_runtime` scheduler/reactor or legacy expression-lowering path.
- Dependency: `beskid-v0-5-foundations` (CYB-60) is an implementation and
  acceptance prerequisite. This change deliberately does not duplicate its
  `Fiber<T>`, channel, timer/deadline, cancellation-winner, `use`, or Core.IO
  requirements.
