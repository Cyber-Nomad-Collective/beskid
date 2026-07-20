## 1. Validate the normative baseline

- [ ] 1.1 Run `openspec validate beskid-v0-5-networking --strict --no-interactive` and correct every change-layout, requirement, stable-ID, and scenario error before implementation.
- [ ] 1.2 Confirm that CYB-60 / `beskid-v0-5-foundations` is accepted and its owner-routed completion, one-winner deadline, `Disposable`, Core.IO, and generic resource-channel evidence is green before introducing networking code.

## 2. Introduce the portable contracts

- [ ] 2.1 Add manifest-generated private socket builtin operations and their one opaque generation-tagged handle representation in `compiler/runtime_manifest.bsol`, `compiler/crates/beskid_manifest`, and `compiler/crates/beskid_abi`; add registry-parity and public-symbol audits.
- [ ] 2.2 Add one reactor contract, socket table, and operation state under `compiler/runtime/beskid/src/Runtime/Network/**`; expose only the narrow manifest-authorized `epoll`, `kqueue`, and IOCP platform intrinsics required by those Beskid modules. Add generation reuse, stale readiness/completion, idempotent close, and leak tests; do not add a Rust `beskid_runtime` scheduler/reactor.
- [ ] 2.3 Add the `network` corelib package and `Network.Types`, `Network.Errors`, `Network.Dns`, `Network.Tcp`, and `Network.Udp` typed public surfaces; preserve `IoError` on Foundation Stream methods, use `NetworkError` on socket lifecycle/policy operations, declare the explicit `DisposeError -> NetworkError::CleanupFailed` conversion, and add API-shape tests proving no descriptor, native constant, or native error code is public.
- [ ] 2.4 Bind `TcpStream` to the existing Foundation `Core.IO.Stream` and all network resources to the existing `Disposable` contract; do not add another partial-transfer or cleanup abstraction.

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
- [ ] 5.2 Run required Linux epoll, macOS kqueue, and Windows IOCP CI cells; record unavailable cells and their exact environment limitation on CYB-61 rather than weakening the matrix.
- [ ] 5.3 Run `openspec validate beskid-v0-5-networking --strict --no-interactive`, then `bun run openspec:validate`. Do not regenerate the catalog in this change; the HTTP release change owns that authorized step.
