# Beskid 0.5 Networking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a portable opaque-handle reactor and real DNS, TCP, and UDP corelib APIs after the 0.5 Foundations change is accepted.

**Architecture:** Canonical Beskid runtime modules own generation-tagged socket resources and the common reactor lifecycle; manifest-authorized platform intrinsics provide epoll, kqueue, and IOCP operations without creating a Rust runtime path. Corelib owns typed Beskid APIs and never exposes OS descriptors or errno/Winsock constants. Every async operation registers a single owner-routed completion that cancellation, timeout, close, or readiness can settle exactly once.

**Tech Stack:** Canonical Beskid runtime, generated ISLE/CLIF, manifest-authorized Rust host bindings, platform backends (epoll/kqueue/IOCP), Beskid corelib, OpenSpec, JIT/AOT/native conformance.

## Global Constraints

- Linear authority: CYB-61, blocked by CYB-60.
- Create `openspec/changes/beskid-v0-5-networking/`; do not duplicate Foundation requirements.
- Linux uses epoll, macOS uses kqueue, and Windows uses IOCP; a fallback is test-only and never replaces these backends.
- All handles are opaque, generation-tagged, idempotently closed, and leak-reported in debug/conformance mode.
- The 0.4 canonical runtime and exact-kit architecture remains mandatory; no `beskid_runtime` Rust scheduler/reactor or legacy lowering path may be added.

### Task 1: Create the networking OpenSpec change

**Files:**
- Create: `openspec/changes/beskid-v0-5-networking/{proposal.md,design.md,tasks.md,.openspec.yaml}`
- Create: deltas for runtime ABI/builtins, scheduler/IO, Core.IO, Network.Types, Network.Errors, Network.Dns, Network.Tcp, and Network.Udp.

- [ ] Specify native handles, cancellation/deadline lifecycle, error unions, TCP and UDP concurrency policies, DNS cancellation semantics, exclusions, and cross-platform conformance scenarios.
- [ ] Validate with `bun run openspec:validate`; commit `docs(openspec): specify beskid 0.5 networking`.

### Task 2: Implement the portable socket handle ABI and reactor

**Files:**
- Create: canonical runtime modules under `compiler/runtime/beskid/src/Runtime/Network/**` for handle ownership, operation state, and reactor coordination
- Modify: `compiler/runtime_manifest.bsol`, trusted intrinsic facts/rules, `compiler/crates/beskid_manifest/src/codegen.rs`, and `compiler/crates/beskid_abi/src/runtime_source.rs` for the smallest platform-operation boundary
- Test: canonical runtime reactor/handle fixtures plus JIT/AOT/native-kit ABI tests.

- [ ] Write failing tests for handle generation reuse, idempotent close, stale readiness, close-vs-readiness, timeout-vs-readiness, and one-resume-per-operation.
- [ ] Define the smallest typed builtin ABI for socket operations; add generation validation and centralized shutdown/leak cleanup.
- [ ] Implement epoll, kqueue, and IOCP host operations behind one manifest-authorized intrinsic contract; canonical Beskid runtime routes completions through the Foundation scheduler command queue.
- [ ] Run focused query/ISLE/codegen tests, canonical runtime reactor fixtures, ABI/manifest tests, and JIT/AOT/native-kit smokes; commit `feat(runtime): add portable socket reactor`.

### Task 3: Add shared network types, errors, and disposal bindings

**Files:**
- Create: `compiler/corelib/packages/network/src/Network/{Types.bd,Errors.bd,Socket.bd}` and package manifest/export files following existing package conventions.
- Modify: `compiler/corelib/packages/foundation/src/Core/Disposable.bd`
- Test: new corelib network type/error tests.

- [ ] Write tests for `IpAddress::V4`, `IpAddress::V6`, `SocketAddress`, every public `NetworkError` variant, and no OS constants in public errors.
- [ ] Bind opaque runtime handles to `TcpStream`, `TcpListener`, and UDP resources without public descriptor fields; make each Disposable implementation idempotent.
- [ ] Run corelib package resolution/tests; commit `feat(network): add portable types and errors`.

### Task 4: Implement DNS through the blocking pool

**Files:**
- Create: `compiler/corelib/packages/network/src/Network/Dns.bd`
- Modify: canonical runtime resolver scheduling, owner-routed completion modules, and manifest-authorized resolver intrinsics.
- Test: DNS result/cancellation tests and platform-gated resolver integration tests.

- [ ] Write failing tests for multiple addresses, family filtering, host-not-found mapping, cancellation result discard, and no cache behavior.
- [ ] Add resolver jobs that retain active-external-wait accounting until completion and discard results after caller cancellation without promising OS resolver interruption.
- [ ] Run focused runtime/corelib tests; commit `feat(network): add dns resolution`.

### Task 5: Implement TCP

**Files:**
- Create: `compiler/corelib/packages/network/src/Network/Tcp.bd`
- Modify: reactor builtin dispatch and socket ABI tests.
- Test: new TCP loopback, deadline, cancellation, partial read/write, half-close, and concurrent-operation tests.

- [ ] Write loopback tests for bind/listen/accept/connect/read/write, EOF, partial writes, address queries, options, one reader/one writer, and one accept policy.
- [ ] Implement corelib `Bind`, `Accept`, `Connect`, `Read`, `Write`, `ShutdownWrite`, `Close`, and address/options calls over the opaque ABI.
- [ ] Verify `use TcpStream` cleanup, `Channel<TcpStream>` transport, deadline/cancellation races, and no duplicate ownership.
- [ ] Run loopback JIT/AOT/native conformance; commit `feat(network): add tcp streams and listeners`.

### Task 6: Implement UDP

**Files:**
- Create: `compiler/corelib/packages/network/src/Network/Udp.bd`
- Test: new UDP loopback, datagram-boundary, source-address, truncation, deadline, cancellation, and concurrent-operation tests.

- [ ] Write failing datagram boundary and truncation tests; assert UDP is not accepted as a generic Stream.
- [ ] Implement bind, optional connect, receive-from, send-to, connected send/receive, close, and configured concurrency policy.
- [ ] Run loopback and cross-target tests; commit `feat(network): add udp datagrams`.

### Task 7: Networking evidence

- [ ] Run `openspec validate beskid-v0-5-networking --strict --no-interactive` and `bun run openspec:validate`, `just corelib`, focused runtime/compiler/JIT/AOT/native tests, and all locally available loopback suites. Reserve catalog regeneration for the final HTTP/release change.
- [ ] Add CI jobs for unavailable Linux/macOS/Windows backend cells and record exact platform limits on CYB-61.
- [ ] Commit `docs(release): record 0.5 networking conformance`.
