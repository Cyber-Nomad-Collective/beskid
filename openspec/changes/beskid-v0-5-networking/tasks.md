## 1. Validate the normative baseline

- [ ] 1.1 Run `openspec validate beskid-v0-5-networking --strict --no-interactive` and correct every change-layout, requirement, stable-ID, and scenario error before implementation.
- [ ] 1.2 Confirm that CYB-60 / `beskid-v0-5-foundations` is accepted and its owner-routed completion, one-winner deadline, `Disposable`, Core.IO, and generic resource-channel evidence is green before introducing networking code.

## 2. Introduce the portable contracts

- [ ] 2.1 Add manifest-generated private socket builtin operations and their one opaque generation-tagged handle representation in `compiler/runtime_manifest.bsol`, `compiler/crates/beskid_manifest`, and `compiler/crates/beskid_abi`; add registry-parity and public-symbol audits.
- [ ] 2.2 Add one reactor contract, socket table, and operation state under `compiler/runtime/beskid/src/Runtime/Network/**`; expose only the narrow manifest-authorized `epoll`, `kqueue`, and IOCP platform intrinsics required by those Beskid modules. Add generation reuse, stale readiness/completion, idempotent close, and leak tests; do not add a Rust `beskid_runtime` scheduler/reactor.
- [ ] 2.3 Add the `network` corelib package and `Network.Types`, `Network.Errors`, `Network.Dns`, `Network.Tcp`, and `Network.Udp` typed public surfaces; preserve `IoError` on Foundation Stream methods, use `NetworkError` on socket lifecycle/policy operations, declare the explicit `DisposeError -> NetworkError::CleanupFailed` conversion, and add API-shape tests proving no descriptor, native constant, or native error code is public.
- [ ] 2.4 Bind `TcpStream` to the existing Foundation `Core.IO.Stream` and all network resources to the existing `Disposable` contract; do not add another partial-transfer or cleanup abstraction.
- [ ] 2.5 Add `NetworkError::ResourceExhausted()` after `Unsupported()` in `compiler/corelib/packages/network/src/Network/Errors.bd` and map runtime status 18 to it in `Network/Internal.bd`. In `compiler/runtime_manifest.bsol` `status "BeskidNetworkStatus"`, insert `ResourceExhausted = 18` and move `Pending` to 19; regenerate `crates/beskid_abi/src/generated/abi_v5_contract.rs` and `include/abi-v5.json` through the existing generator. In `crates/beskid_abi/assembly/common/network.h`, insert `NET_RESOURCE_EXHAUSTED` before `NET_PENDING` and map `EMFILE`, `ENFILE`, `ENOBUFS`, `ENOMEM`, `WSAEMFILE`, `WSAENOBUFS`, `WSA_NOT_ENOUGH_MEMORY`, and resolver `EAI_MEMORY` to it; keep `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH`, and the `default:` branch on `NET_NETWORK_DOWN`. In `compiler/runtime/beskid/src/Runtime/Network/{Table,Operations,Sockets,Dns}.bd`, return `NETWORK_RESOURCE_EXHAUSTED` (18) after a null `SystemAllocate`, a zero `NetworkAdoptLocked`, or a null `network_dns_start`; set `NETWORK_PENDING` to 19 and raise the `NetworkFinish` bound check to `NETWORK_RESOURCE_EXHAUSTED`. Add a build-time parity check between the `network.h` enum count and the manifest status count (`BSP-REQ-CAB59E0274D1`, `BSP-REQ-B094EDC16A72`).
- [ ] 2.6 After Foundation task 2.8 lands `Core.IO.TransferFailure`, add the private `TransferCause(i64 status)` helper in `Network/Internal.bd` and make `TcpStream.Read`/`Write` in `Network/Tcp/TcpStream.bd` return `IoError::ReadFailed(cause)` / `WriteFailed(cause)` per the `BSP-REQ-D15E92AB4C76` cause table (`Busy` 15 -> `Busy`; `Closed` 14 and `NotConnected` 10 -> `Closed`; `Cancelled` 13 -> `Cancelled`; `TimedOut` 12 -> `TimedOut`; `ConnectionReset` 5 -> `PeerReset`; `ConnectionAborted` 3 -> `PeerAborted`; all others -> `Unspecified`). Same-direction contention returns cause `Busy` (`BSP-REQ-410CB8F5E97A`). Update the `corelib/packages/network/README.md` TCP section.

## 3. Migrate runtime ownership and completion paths

- [ ] 3.1 Route socket readiness, DNS completion, cancellation, deadline expiry, and close through the Foundation owner-scheduler command queue and one-winner operation transition.
- [ ] 3.2 Implement non-caching resolver jobs in the blocking pool, preserve active-external-wait accounting until each job exits, and discard a cancelled caller's later resolver result.
- [ ] 3.3 Implement TCP bind/listen/accept/connect/read/write/half-close/address/options with one-reader/one-writer and one-accept policies; verify partial transfer through Core.IO.
- [ ] 3.4 Implement UDP bind, optional connect, receive-from, send-to, connected send/receive, source address, truncation metadata, and one-send/one-receive policy without making UDP a Stream.

## 4. Delete superseded paths

- [ ] 4.1 Delete or reject every Core.Syscall, raw descriptor, errno/WSA mapping, and target-specific public socket route once `Network` is available; do not retain a compatibility descriptor facade.
- [ ] 4.2 Delete any per-socket blocking readiness loop, worker-local wake path, and production fallback backend after the canonical reactor tests pass.

## 5. Verify networking evidence

- [ ] 5.1 Run focused runtime handle/reactor/race/leak tests, corelib DNS/TCP/UDP tests, and JIT/AOT/native loopback suites on every locally available target.
- [ ] 5.1a Add the resource-exhaustion evidence: a runtime test in `compiler/runtime/beskid/tests/runtime_semantics/src/NetworkNativeTests.bd` that opens loopback UDP sockets on port 0 until `NetworkOpen` returns 18, asserts the count is at most `NETWORK_SLOT_COUNT`, closes one, asserts the next open returns 0, then closes all and asserts `NetworkShutdown` reports 0 leaks (on macOS `EMFILE` may arrive before the table fills; both paths map to 18); and the corelib test `network_udp_exhaustion_is_typed` in `UdpTests.bd` through the public API.
- [ ] 5.1b Add the transfer-cause evidence in `corelib_tests/src/network/TcpTests.bd`: `network_tcp_second_read_reports_busy_cause` and `network_tcp_peer_reset_is_not_eof` (peer abort returns `ReadFailed(TransferFailure::PeerReset())`; peer half-close returns `Ok(0)`).
- [ ] 5.2 Run required Linux epoll, macOS kqueue, and Windows IOCP target conformance tests; record unavailable targets and their exact environment limitation on CYB-61 rather than weakening the matrix.
- [ ] 5.3 Run `openspec validate beskid-v0-5-networking --strict --no-interactive`, then `bun run openspec:validate`. Do not regenerate the catalog in this change; the HTTP release change owns that authorized step.
