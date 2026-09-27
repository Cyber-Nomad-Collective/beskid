# TCP Lifecycle Deadlines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give TCP connect and accept explicit typed v0.5 deadlines without adding a timer or completion path outside Foundation.

**Architecture:** The public `Option<Core.Time.Deadline>` is projected only inside canonical `Network/Internal.bd`. ABI-v5 `network_open` and `network_accept` gain one internal `i64` absolute monotonic deadline argument; the runtime passes it to the existing `NetworkStartLocked` / `ExternalWaitRegister` path. All old public call sites move to an explicit `Option.Empty<Deadline>()`, with no compatibility overload.

**Tech Stack:** Beskid corelib and runtime source, ABI-v5 manifest/generated artifacts, Rust contract tests, Linux epoll, macOS kqueue, Windows IOCP.

**Spec:** `openspec/changes/beskid-v0-5-networking/specs/core-library--networking--network-tcp/spec.md` (`BSP-REQ-1A35BB03D4E2`), `openspec/changes/beskid-v0-5-networking/design.md` (Explicit deadline policy in v0.5).

## Global Constraints

- Keep `Core.IO.Stream` read/write signatures fixed. Public deadlines are opaque `Core.Time.Deadline` values, never `i64`, `Instant`, or a native timer handle.
- `TcpStream.Connect(address, options, deadline: Option<Deadline>)` and `TcpListener.Accept(deadline: Option<Deadline>)` have no ambient deadline and no legacy overload. `None` passes internal `-1` and registers an unbounded wait.
- The compiler-authorized scalar projection stays in canonical `Network/Internal.bd`; ordinary source cannot read `Deadline.monotonicNanos` or call a raw network service.
- Connect/accept expiry returns `NetworkError::TimedOut()` without leaking a request, listener, accepted socket, or Foundation wait. Readiness, cancellation, close, and expiry retain the existing one-winner transition.
- Change the exact ABI-v5 manifest signature and regenerate artifacts; do not hand-edit generated code. Rebuild the CLI before a kit because runtime source is embedded in it.
- No GitNexus. No push or main merge during implementation. Linux heavy builds run on the NixOS builder, Windows on the key-only VM, macOS only with at least 20 GiB free. Use unique source, target, kit, and `BESKID_CORELIB_ROOT` paths per slice; read `docs/diagnose.md` and `scripts/diagnose/` before debugging.

## Review Focus

- An already-expired accept on an empty listener returns one timeout, leaves zero external waits, and permits a later successful accept; Task 1's runtime fixture and Task 2's typed test pin this.
- A close racing a pending accept does not leave a timer or an accepted socket; Task 1's native test checks one winner and resource cleanup.
- A completed connection can beat an expired deadline when both become runnable; tests check one terminal result and cleanup, not a host-dependent mandatory timeout.
- A bind or UDP-open path still uses an unbounded internal deadline and does not acquire a spurious timer; Task 1's existing portable native cases cover both paths.
- An untyped integer passed by user code is rejected at the public API; Task 2's compile-fail case checks the boundary.

---

### Task 1: Propagate lifecycle deadlines through ABI-v5 and the runtime

**Files:**
- Modify: `compiler/runtime_manifest.bsol` at `__network_open` and `__network_accept`.
- Regenerate: `compiler/crates/beskid_abi/src/generated/abi_v5_contract.rs`, `compiler/crates/beskid_abi/include/beskid_runtime_abi_v5.h`, `compiler/crates/beskid_abi/include/abi-v5.json`, and other generator-owned ABI-v5 outputs.
- Modify: `compiler/runtime/beskid/src/Runtime/Network/Sockets.bd` at `NetworkOpen`, `NetworkConnectHandle`, `NetworkAccept`, and `NetworkUdpConnect`.
- Modify: `compiler/corelib/packages/network/src/Network/Internal.bd` to supply internal `-1` in the existing no-policy wrappers until Task 2 changes their typed interface.
- Test: `compiler/runtime/beskid/tests/runtime_semantics/src/NetworkNativeTests.bd`; `compiler/crates/beskid_abi/tests/runtime_bootstrap_contract.rs`.

**Interfaces:** `beskid_rt_v5_network_open(i64 kind, pointer address, i64 options, i64 backlog, i64 deadline, pointer output) -> i32`; `beskid_rt_v5_network_accept(usize handle, i64 deadline, pointer output) -> i32`. `NetworkConnectHandle(handle, address, deadline)` and accept forward the internal value to `NetworkStartLocked`; listener bind, UDP open, and UDP connect use `-1` until the separate UDP deadline slice. Reject values below `-1` before registration.

- [ ] **Step 1: Add failing contract and native tests.** Assert both manifest/export tuples include the `i64` deadline argument. In `NetworkNativeTests.bd`, call accept with deadline `0` on a listening socket with no connection, assert `NETWORK_TIMED_OUT`, `ExternalActiveCount()==0`, then connect and accept with `-1` and close all handles. Add a close-versus-accept test that asserts one result and zero leaked waits/sockets, without assuming which event wins.
- [ ] **Step 2: Run the focused ABI and native targets on the Linux builder.** Expect the new tuple assertion or changed-arity call to fail before implementation. Keep the exact red log and source/kit identity.
- [ ] **Step 3: Change the manifest and runtime forwarding.** Add the argument in the same position to the manifest, export source, and internal call graph. Update every direct runtime-fixture call and let the current corelib `Network.Internal` wrappers pass `-1`, so this task remains buildable before Task 2. Use only `NetworkStartLocked`'s existing Foundation wait registration; preserve existing `NetworkFinish` cleanup after a timeout. Generate ABI artifacts with `beskid_manifest`'s `generate_v5` example and inspect the generated diff.
- [ ] **Step 4: Rebuild CLI and exact kit, rerun the focused ABI/native tests.** Require green native JIT/AOT/kit routes, `git diff --check`, and manifest freshness. Commit this slice without including generated `obj` or lockfile churn.

### Task 2: Expose typed Connect/Accept and migrate all callers

**Files:**
- Modify: `compiler/corelib/packages/network/src/Network/Internal.bd`, `Internal/Resources.bd`, `Tcp/TcpStream.bd`, `Tcp/TcpListener.bd`.
- Modify: each repository call to `TcpStream.Connect` / `TcpListener.Accept`, including `compiler/corelib/packages/http/src/Http/Server.bd`, to pass `Option.Empty<Deadline>()` where no policy was requested.
- Test: `compiler/corelib/beskid_corelib/tests/corelib_tests/src/network/TcpTests.bd`, `compiler/corelib/packages/network/tests/compile-fail/RawDeadline.bd`, and the compile-fail project target.

**Interfaces:** `TcpStream.Connect(SocketAddress, SocketOptions, Option<Deadline>) -> Result<TcpStream, NetworkError>` and `TcpListener.Accept(Option<Deadline>) -> Result<TcpStream, NetworkError>`. `Network.Internal` alone projects `Option<Deadline>` to `-1` or absolute monotonic nanos before the ABI service call; `Resources` constructs and releases typed owners exactly as before.

- [ ] **Step 1: Add typed red tests.** `NetworkTcpTests` creates a `Deadline.After(Time.FromMilliseconds(0_i64))`, accepts on an empty listener, checks `NetworkError::TimedOut()`, then connects with `Option.Empty<Deadline>()`, accepts with `None`, and closes every resource. The compile-fail fixture passes a raw `i64` to both public operations and expects rejection. A separate connect test checks that success or timeout yields exactly one owned/closed stream and no leak; it must not assert a host-dependent winner.
- [ ] **Step 2: Run focused corelib and compile-fail targets on the builder and confirm red.** Record whether the failure is the missing public argument/type boundary, not a stale kit or `Project.lock` path.
- [ ] **Step 3: Implement the public signatures and migrate callers.** Add `Option<Deadline>` imports as needed. Route only the canonical internal module through `OptionalDeadlineNanos`; pass `-1` for bind and UDP-open paths. Update HTTP's existing no-policy wrapper without inventing HTTP deadline semantics in this task. Remove old two-argument Connect and zero-argument Accept forms.
- [ ] **Step 4: Rebuild the exact CLI/kit and rerun targeted tests, then full `NetworkTcpTests` and `HttpExchangeTests`.** Require no raw-time deadline escape, no old call forms, and `git diff --check`. Commit only the corelib/API slice.

### Task 3: Cross-platform lifecycle acceptance

**Files:**
- Test: the Task 1 native fixture and Task 2 public tests; update `openspec/changes/beskid-v0-5-networking/tasks.md` only for evidence actually passed.

**Interfaces:** Consumes the exact compiler/corelib commits and native kit from Tasks 1–2. Produces a source-hash-identified Linux/macOS/Windows acceptance record, not a new API.

- [ ] **Step 1: Run the complete corelib 81-target and runtime 7-target matrices on Linux with explicit per-target and whole-matrix budgets.** Record pass count, release-eligibility flag, CLI/kit/source identity, and all logs.
- [ ] **Step 2: Run the focused native and public TCP deadline targets and the complete corelib/runtime matrices on macOS and Windows.** Require at least 20 GiB free before the Mac run. If a platform cannot run, report a release blocker rather than weakening this gate. Treat a missing Git checkout/provenance or kit-source mismatch as an evidence gap even when behavior passes.
- [ ] **Step 3: Repeat the accept close/deadline race 50 times per platform without relying on wall-clock sleeps.** Run `scripts/diagnose/matrix-log.py` on each complete matrix and inspect shutdown leak status.
- [ ] **Step 4: Mark only the TCP lifecycle deadline scenarios complete in the networking checklist once every required platform is green.** Leave DNS, UDP, HTTP, and pending TCP-write proof for their own slices.

## Self-review

- Coverage: the plan supplies typed public Connect/Accept, absolute internal deadline propagation, one Foundation winner, timeout ownership cleanup, and three-target acceptance. It does not claim to finish DNS, UDP, HTTP, or pending TCP-write evidence.
- No task creates a second timer or public raw deadline. The ABI argument order is consistent between Tasks 1 and 2.
- The one open judgment is whether a deterministic connect-timeout test needs a host adapter fault-injection seam. The plan deliberately requires one-winner cleanup and avoids treating a fast local connect as a timeout failure; exact expiry behavior is exercised through the shared `NetworkStartLocked` path by empty-listener accept.
