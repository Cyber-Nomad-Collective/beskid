# Beskid 0.5 Closure Re-baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` task-by-task. Every production-symbol change requires GitNexus upstream impact analysis before editing; every behavior starts with a focused failing test.

**Goal:** Deliver the 0.5 networking release without retaining scalar value transport, worker-local completion, duplicate resource lifetimes, or unproven platform behavior.

**Architecture:** The only serial path is Foundations (CYB-60) -> Networking (CYB-61) -> HTTP and final release evidence (CYB-62). Foundations establishes one ABI-value ownership model, one scheduler-completion model, and one resource/I/O model; Networking and HTTP consume them without alternatives. Glue is a separate fail-closed lane unless the product explicitly promotes generated Rust/.NET bindings into the release contract.

**Tech Stack:** Rust, Salsa semantic facts, Pest, generated ISLE/Cranelift, canonical Beskid runtime sources, corelib, OpenSpec, pnpm, Woodpecker, epoll, kqueue, IOCP.

**Spec:** `openspec/changes/beskid-v0-5-foundations/`, `openspec/changes/beskid-v0-5-networking/`, and [release split design](../specs/2026-07-20-beskid-v0-5-release-split-design.md).

**Research basis:** [Foundations](../../research/2026-09-19-v05-foundations-plan-research.md), [Networking](../../research/2026-09-19-v05-networking-plan-research.md), and [HTTP/release/Glue](../../research/2026-09-19-v05-release-glue-plan-research.md) capture the current-code seams, primary-source practice, and evidence gaps that this plan resolves.

## Current facts and non-negotiable constraints

| Fact | Planning consequence |
| --- | --- |
| `FiberRecord.outcome_value`, `__fiber_join_value`, and the primary channel queue are scalar `i64` paths. | Replace them with one traced ABI-value record; do not add another scalar/pointer compatibility route. |
| Current spawn lowering calls its child trampoline after calling spawn and discards the runtime handle. | Make spawn return the runtime-owned `Fiber<T>` handle; the child result belongs only to the fiber record. |
| `ChannelClose` drains committed values. | Close may reject new sends and wake waiters, but must preserve committed values until exactly one receive moves them out. |
| No owner-routed external completion/timer service, `Core.Disposable`, `Core.IO`, or Network runtime/package exists. | Complete these prerequisites before socket work. |
| `beskid-v0-5-foundations` and `beskid-v0-5-networking` validate strictly through `pnpm exec openspec`; `beskid-v0-5-http` is absent. | Treat CYB-60 and CYB-61 as active proposed contracts; create and validate CYB-62 before HTTP implementation. |

External design constraints corroborate the repository contracts: edge-triggered epoll requires non-blocking I/O and draining to `EAGAIN` ([epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html)); kqueue coalesces events for a unique `(ident, filter)` registration ([kevent(2)](https://man.freebsd.org/cgi/man.cgi?query=kevent)); IOCP completion packets must be dequeued and associated with the initiating operation ([GetQueuedCompletionStatus](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-getqueuedcompletionstatus)); and HTTP/1.1 framing must be parsed as octets with unambiguous body-length handling ([RFC 9112](https://www.rfc-editor.org/rfc/rfc9112.html)).

## Review focus

- A forced GC at every fiber/channel ownership transition must not lose an aggregate, reference, or opaque resource.
- A cancellation before and after channel commit must produce different, explicit ownership outcomes.
- Readiness, close, cancel, timeout, and duplicate notifications must produce exactly one scheduler completion.
- A stale socket generation or late DNS result must never affect a reused resource or cancelled caller.
- Ambiguous HTTP body framing, malformed octets, and partial I/O must fail boundedly without retaining fibers, streams, or handles.

## Delivery map

```text
F0 specification decision
  -> F1 ABI/root record -> F2 fibers + F3 channels -> F4 scheduler/timers
  -> F5 scoped use -> F6 Core.IO/bytes/encoding -> Foundation evidence (CYB-60)
  -> N1 socket ABI/reactor -> N2 API -> N3 DNS -> N4 TCP -> N5 UDP -> Networking evidence (CYB-61)
  -> H0 HTTP/release change -> H1 parser -> H2 serializer/router -> H3 server -> final evidence (CYB-62)

Glue: G1 boundary diagnostics -> G2 GlueTag extraction -> G3 structured artifact/tool lock -> G4 Rust/.NET emitters (only if explicitly in scope)
```

## Foundation gate — CYB-60

### Task 1: F0 — Resolve the normative baseline before implementation

**Files:** `openspec/changes/beskid-v0-5-foundations/{design.md,tasks.md}`; corresponding deltas under `specs/`.

- [ ] Reconcile the design's `FiberError` narrowing with the existing closed, richer corelib error surface; retain diagnostic detail and specify any required panic-code constraint as a value invariant.
- [ ] Map every stable Foundation requirement to a parser, semantic, runtime, corelib, JIT, AOT, and native proof target in `design.md`.
- [ ] Run `pnpm exec openspec validate beskid-v0-5-foundations --strict --no-interactive`.
- [ ] Commit the accepted normative correction separately from source changes.

### Task 2: F1 — Establish the sole traced ABI-value and root contract

**Files:** `compiler/runtime_manifest.bsol`; `compiler/crates/beskid_manifest/src/{v5.rs,analysis_codegen.rs}`; `compiler/crates/beskid_abi/src/runtime_source/**`; `compiler/runtime/beskid/src/Runtime/{Mem,Fiber,Sync}/**`; ABI/manifest tests.

- [ ] Add failing JIT, AOT, and native-kit ABI-slot fixtures that transfer `u8[]`, an aggregate, and a Foundation-local opaque `OwnedResource` while forcing collection. These prove the F1 substrate only; Tasks 3 and 4 separately prove the same payload matrix through their completed Fiber and Channel consumers.
- [ ] Define `BeskidAbiValue` once in the manifest: tag, payload, trace/descriptor metadata, and owner-state operations `initialize`, `replace_with_barrier`, `move_out`, and `clear`.
- [ ] Generate and consume that one layout through the manifest/ABI/runtime boundary; do not expose per-payload transport builtins.
- [ ] Add the generated ABI-audit harness and red cases for publicly reachable scalar `__fiber_join_value`, scalar channel-send, and pointer-side-channel transport. Keep the harness pending until Tasks 3 and 4 jointly migrate their consumers; it must reject all three families in their final cutover, never accept a compatibility release state.
- [ ] Run focused manifest/ABI/runtime tests, then the three ownership fixtures on every locally available execution mode.

### Task 3: F2 — Make spawn a rooted, typed handle-producing expression

**Files:** `compiler/crates/beskid_analysis/src/{beskid.pest,syntax/expressions/spawn_expression.rs,types/checker/spawn.rs,types/checker/statements.rs}`; `compiler/crates/beskid_queries/src/semantic_contract/closures_spawn.rs`; `compiler/crates/beskid_isle/src/context/calls.rs`; `compiler/runtime/beskid/src/Runtime/Fiber/**`; `compiler/corelib/packages/concurrency/src/Concurrency/{Fiber.bd,FiberError.bd,FiberJoinStatus.bd}`.

- [ ] Write red parser/semantic tests for bound `spawn Compute()`, rooted heap capture, stack-reference escape, discarded non-detached handle, double Join, and Join-after-Detach.
- [ ] Make `emit_spawn` return the generation-safe runtime fiber handle; remove direct trampoline invocation from the spawning frame.
- [ ] Store one typed result record and rooted capture environment in each fiber. `Join` moves that record exactly once; `Detach` consumes join capability; `Cancel` remains idempotent; main shutdown joins non-detached children.
- [ ] After Fiber consumes `BeskidAbiValue`, run the `u8[]`/aggregate/`OwnedResource` forced-collection transfer matrix through `spawn`/`Join` in JIT, AOT, and native-kit modes; this is the Fiber half of the former F1 transport gate.
- [ ] Consume generation-bound `spawn_legality` facts rather than duplicating capture authority in a second checker walk.
- [ ] Run `cargo test -p beskid_tests analysis::spawn`, focused query/ISLE/codegen tests, then JIT/AOT/native aggregate-capture fixtures.

### Task 4: F3 — Replace split channel transport with a commit-ownership protocol

**Files:** `compiler/runtime/beskid/src/Runtime/Sync/Channel.bd`; scheduler parking modules; `compiler/runtime_manifest.bsol`; `compiler/corelib/packages/concurrency/src/Concurrency/{Channel.bd,ChannelError.bd,ChannelOptions.bd}`; concurrency/corelib fixtures.

- [ ] Write red fixtures for aggregate queue retention, parked sender retention, pre-commit cancellation, post-commit cancellation, close-after-drain, exactly-one receive, and backpressure without a held lock.
- [ ] Represent every queue cell, pending sender, and receive receipt as `BeskidAbiValue` plus an explicit owner state.
- [ ] Under the channel lock, transition `SenderOwns -> ChannelOwns`; pre-commit cancellation keeps sender ownership, post-commit cancellation leaves the queue ownership intact.
- [ ] Run the `u8[]`/aggregate/`OwnedResource` forced-collection transfer matrix through send/receive in JIT, AOT, and native-kit modes; this is the Channel half of the former F1 transport gate.
- [ ] Change close to set the durable closed state and wake waiters without draining committed cells; delete the scalar and pointer transport families only after the complete matrix is green.
- [ ] Activate the Task 2 ABI audit in this final fiber/channel cutover and reject every remaining public scalar or pointer-side-channel transport family.
- [ ] Resolve the current API/runtime mismatch where a nominally unbounded capacity maps to 16 entries; implement true dynamic storage or revise the public contract before release.

### Task 5: F4 — Introduce owner-routed completion and one-winner timers

**Files:** `compiler/runtime/beskid/src/Runtime/Fiber/Scheduler/**`; `compiler/runtime/beskid/src/Runtime/Io/Syscalls.bd`; `compiler/runtime_manifest.bsol`; target adapter/ABI sources.

- [ ] Add deterministic red race tests for wake-before/during/after park and every pair from `{readiness, close, cancel, timeout, duplicate}`.
- [ ] Record `{ownerSchedulerId, fiberHandle, waitGeneration, operation}` before incrementing active external waits. Adapters may only post inbound commands and signal the owner wake primitive.
- [ ] Implement `try_complete(waitId, generation, source)` as the single atomic terminal transition. Only its winner wakes the fiber, unregisters the source, and decrements the external-wait count.
- [ ] Add a monotonic absolute-deadline heap with generation-tagged cancellation; a stale timer is a no-op.
- [ ] Run repeated deterministic race matrices and native scheduler smoke tests; include a true-deadlock case and an all-fibers-parked-with-external-wait case.

### Task 6: F5 — Add scoped `use` and exactly-once disposal

**Files:** `compiler/crates/beskid_analysis/src/{beskid.pest,syntax/**,types/checker/**}`; `compiler/crates/beskid_queries/**`; `compiler/crates/beskid_isle/**`; create `compiler/corelib/packages/foundation/src/Core/Disposable.bd`.

- [ ] Test that `use Package.Module;` remains an import while `use Type name = expression;` produces a distinct scoped-binding AST; reject a `using` alias.
- [ ] Require `Disposable.Dispose() -> Result<unit, DisposeError>`, non-escaping ownership, a `Result<T,E>` enclosing callable, and one unambiguous cleanup-error conversion.
- [ ] Lower a single cleanup-region stack in reverse declaration order on fallthrough, return, postfix `?`, and supported structured exits.
- [ ] Add fixtures for nested cleanup, use-after-scope, missing/ambiguous conversion, and cleanup-error precedence.

### Task 7: F6 — Publish Foundation I/O and data contracts

**Files:** create `compiler/corelib/packages/foundation/src/Core/IO/{Reader,Writer,Closer,Stream,IoError}.bd`; modify `Core/{Bytes/**,Encoding/**,Syscall/Syscall.bd}` and matching manifest/ABI handlers.

- [ ] Correct `ReadBytesWith` atomically across corelib, manifest, generated ABI, JIT, and AOT to `Result<u8[], SyscallError>`.
- [ ] Add range-first validation, zero-length bypass, overlap-safe copy, cursor bounds, strict UTF-8/Hex/Base64, and HTTP ASCII helper tests.
- [ ] Define `ReadExact` and `WriteAll` over `Reader`/`Writer`; test partial transfer, EOF, no progress, idempotent close, and close-error conversion.
- [ ] Prohibit Network-specific read/write loops: TCP later implements `Core.IO.Stream`.

### Task 8: F7 — Close CYB-60 evidence

- [ ] Run `pnpm exec openspec validate beskid-v0-5-foundations --strict --no-interactive`, `pnpm run openspec:validate`, `just -f compiler/justfile corelib`, `just -f compiler/justfile compiler`, focused JIT/AOT/native fixtures, and Foundation-only examples.
- [ ] Record exact commands, commits, and unavailable platform cells on CYB-60; do not start N1 until all required Foundation rows are green.

## Networking gate — CYB-61 (blocked by F7)

### Task 9: N1 — Declare and prove the manifest-authorized socket boundary

**Files:** `compiler/runtime_manifest.bsol`; `compiler/crates/beskid_manifest/src/**`; `compiler/crates/beskid_abi/src/**`; create `compiler/runtime/beskid/src/Runtime/Network/{Handles,Operations,Reactor}.bd`.

- [ ] Write red ABI tests for opaque `(slot, generation)` reuse, stale completion, idempotent close, and zero raw descriptor leakage.
- [ ] Add the minimal private platform-operation surface to the manifest; generated ABI remains the only Rust/native boundary.
- [ ] Make canonical Beskid runtime code own socket tables, operation records, terminal state, and shutdown leak reporting.
- [ ] Validate `(slot, generation)` before every readiness/completion action and route it through Foundation's `try_complete`.

### Task 10: N2 — Build three adapters behind one reactor contract

**Files:** target-specific ABI/platform adapters; `Runtime/Network/Reactor.bd`; ABI and native-kit tests.

- [ ] Begin with level-triggered/nonblocking epoll behavior; if using `EPOLLET`, drain reads/writes to `EAGAIN` and use an explicit rearm discipline.
- [ ] Model kqueue registrations as unique `(ident, filter)` records and treat coalesced notifications as state observations, not completion counts.
- [ ] Associate each IOCP completion with the generated operation identity and validate it before scheduling the owner command.
- [ ] Test readiness after close/reuse, duplicate notification, shutdown, and handle leaks separately on Linux, macOS, and Windows; a test fallback may not ship as a production adapter.

### Task 11: N3 — Publish portable types, errors, and disposal

**Files:** create `compiler/corelib/packages/network/` with `Network/{Types,Errors,Dns,Tcp,Udp}.bd` and package manifest/exports; Foundation API-shape tests.

- [ ] Test `IpAddress`, `SocketAddress`, options, `Datagram`, and every `NetworkError` variant for absence of descriptors, errno, Winsock code, or platform constants.
- [ ] Bind `TcpStream`, `TcpListener`, and `UdpSocket` to `Disposable`; bind only `TcpStream` to `Core.IO.Stream`.
- [ ] Define `DisposeError -> NetworkError::CleanupFailed` once; do not recreate Foundation close/transfer logic.

### Task 12: N4 — Implement DNS as cancellable waiting, not cancellable OS work

**Files:** `Runtime/Network/**` resolver operation; manifest-authorized resolver intrinsics; `Network/Dns.bd`; resolver tests.

- [ ] Test family selection, multiple addresses, host-not-found mapping, no cache, cancellation-before-result, cancellation-after-result, and shutdown waiting.
- [ ] Run resolution on the blocking pool while retaining active-external-wait accounting until the job exits; cancellation discards a later result instead of claiming it interrupted the host resolver.

### Task 13: N5 — Implement TCP and UDP as separate vertical slices

**Files:** `Network/Tcp.bd`, `Network/Udp.bd`, runtime operation modules, loopback tests.

- [ ] TCP: test bind/listen/accept/connect, partial reads/writes, EOF, half-close, options, local/peer addresses, deadline/close races, one accept, one reader, and one writer.
- [ ] UDP: test bind/connect, send-to/receive-from, connected send/receive, source address, truncation metadata, deadline/cancel races, one send, and one receive. Never implement `Stream` for UDP.
- [ ] Exercise `use TcpStream` and `Channel<TcpStream>` in both slices; this is the integration proof that Foundation was genuinely reusable.

### Task 14: N6 — Close CYB-61 evidence

- [ ] Run strict change and repository OpenSpec checks plus reactor/handle/DNS/TCP/UDP tests through JIT, AOT, and native kits.
- [ ] Require Linux epoll, macOS kqueue, and Windows IOCP loopback evidence. Record exact runner limitation for an unavailable cell; it is not a passing result.

## HTTP and final release gate — CYB-62 (blocked by N6)

### Task 15: H0 — Create the missing final OpenSpec owner before source work

**Files:** create `openspec/changes/beskid-v0-5-http/{proposal.md,design.md,tasks.md,.openspec.yaml,specs/**}`.

- [ ] Specify bounded HTTP/1.1, parser/serializer/router/server lifecycle, compiling examples, documentation, catalog revision, Tracker evidence, and final target matrix.
- [ ] Freeze exclusions: TLS, HTTP/2+, QUIC, WebSocket, pooling, proxying, compression, DNS caching, and public native handles are out of 0.5.
- [ ] Validate the new change strictly and make its final gate depend on accepted CYB-60/CYB-61 evidence.

### Task 16: H1 — Build a bounded octet HTTP/1.1 parser and serializer

**Files:** create `compiler/corelib/packages/http/src/Http/{Types,Errors,Headers,Parser,Serializer}.bd`; corelib parser/serializer tests.

- [ ] Test invalid start lines, bare/obsolete line endings, header/body limits, duplicate/conflicting `Content-Length`, `Content-Length` with `Transfer-Encoding`, malformed chunks, premature EOF, and pipelined partial input.
- [ ] Parse octets via `Core.IO.Reader`, then validate field grammar; do not parse the wire stream as Unicode text.
- [ ] Start with fixed `Content-Length` framing; add chunking/trailers only if the accepted HTTP change assigns their exact behavior. Serialize through `WriteAll`.

### Task 17: H2 — Deliver router, joinable server, and release evidence

**Files:** create `Http/{Router,Server}.bd`; compiled examples; relevant Book/docs/Tracker/CI evidence code.

- [ ] Test exact route/method matching, bounded accept queue, slow reader/writer deadlines, keep-alive cap, and graceful shutdown: close listener, join acceptor, close/drain queue, wait grace deadline, cancel, join, close streams.
- [ ] Add examples only after the APIs compile: spawn/join, resource channel, TCP/UDP/DNS, HTTP handler/router/server/shutdown.
- [ ] Generate the catalog only with `pnpm run openspec:catalog`, then run `pnpm run openspec:validate` and record catalog revision, source commits, target results, and evidence locations in CYB-62/Tracker.

## Conditional Glue lane — explicit product decision required

Glue stays fail closed by default. If product scope includes generated Rust or .NET bindings, add its final gate to CYB-62 and execute this lane after F7:

1. Implement dual-surface diagnostics from `reconcile-glue-ffi-extern-0-5`, then `GlueTag` extraction from `extend-extern-import-extraction-glue-0-5`; prove one import takes exactly one path.
2. Replace no-op `run_glue` with deterministic, validated contract invocation and a serializable binding plan using the existing `beskid_abi::interop` vocabulary.
3. Replace `BackendArtifact::{RustSource(String),DotNetProject(String)}` with one deterministic structured source-artifact tree carrying relative files, digests, ABI envelope, target, resolved-tool manifest, and declared outputs.
4. Extend `beskid_abi::toolchain` to exact path/prefix discovery, executable validation, version/target interrogation, SHA-256 pinning, and bounded captured invocation; never search ambient `PATH`.
5. Emit a compilable Rust `cdylib` fixture and .NET SDK project fixture from the validated plan; test ownership, malformed signatures, code-injection-like identifiers, and import/export round trips. Use C ABI at foreign boundaries; preserve the existing CLIF path unchanged.

## Independent contract-system lane — no gate dependency

`extend-contract-system-generic-and-self` (generic contracts, `impl`-block
conformance, `where`-bound checking, and `This`/associated types) is owned
scope for the v0.5 release program but is not on the F/N/H critical path: it
touches `beskid_analysis` typechecking/resolver, the `beskid_queries`
semantic-contract conformance fact, and corelib, not the ABI/scheduler/socket
surfaces F/N/H gate on. Execute it in parallel with Foundations/Networking/HTTP,
serializing only where a slice's file list overlaps a live F/N/H worker's
in-flight edits (`crates/beskid_isle/src/context/{calls,control_flow,enums,aggregate}.rs`
and `crates/beskid_queries/src/semantic_contract/**` are busy — see
`~/.claude/handoffs/networking-coordination.md` before claiming a path there).

- Spec: `openspec/changes/extend-contract-system-generic-and-self/` (proposal,
  design, tasks; validated strictly and independently of CYB-60/61/62 — it
  carries no `dependsOn` in its `.openspec.yaml`).
- Plan: `docs/superpowers/plans/2026-09-22-v05-contract-system.md` — ordered,
  independently testable slices mapped to current `main`.
- Gate: green when `cargo test -p beskid_analysis`, `cargo test -p
  beskid_queries`, `just corelib`, and `pnpm run openspec:validate` pass for
  this change; it does not block or get blocked by CYB-60/61/62 closure.

## Cross-target behavioral evidence

Extend the existing Woodpecker release-evidence route rather than create another publisher. Add a versioned `feature-evidence-v1.json` per platform containing commit/version identity, target/runtime-kit digest, executed conformance case IDs, test-log hashes, and an explicit `not_applicable` reason for out-of-scope Glue. The aggregate must reject missing, mismatched, or unexecuted promised behavioral evidence even when CLI/LSP bundles build successfully.

## Completion checklist

- [ ] CYB-60, CYB-61, and CYB-62 each have accepted OpenSpec requirements and their own green evidence matrix.
- [ ] No scalar/pointer compatibility transport, direct adapter wake, raw public descriptor, or networking-specific I/O helper remains reachable.
- [ ] All required supported targets have native behavioral evidence, not just release artifacts.
- [ ] `pnpm run openspec:catalog && pnpm run openspec:validate`, changed-scope analysis, focused/full compiler and corelib gates, and release evidence succeed from the same revision.
- [ ] The user explicitly decides whether Glue belongs to the 0.5 release promise; otherwise its backends remain fail closed and are recorded as out of scope.
