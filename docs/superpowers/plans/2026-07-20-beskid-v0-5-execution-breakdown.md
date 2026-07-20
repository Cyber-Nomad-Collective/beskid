# Beskid 0.5 Detailed Execution Breakdown

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Every production-symbol edit requires a GitNexus upstream impact analysis first; every behavior uses a failing-test → minimal-implementation → focused-green cycle.

**Goal:** Deliver the complete 0.5 networking release through three dependency-gated OpenSpec changes: Foundations, Networking, then HTTP and release evidence.

**Architecture:** Foundation extends the post-0.4 canonical Beskid runtime and generated ISLE path with traced ABI values, one owner-routed external-completion model, and explicit scoped cleanup. Networking layers opaque-generation socket resources and manifest-authorized platform operations onto that model. HTTP consumes those completed APIs directly; it adds no alternate async or resource-lifetime path.

**Tech Stack:** Rust, Pest, ISLE/Cranelift, Beskid corelib, OpenSpec, Bun, Linux epoll, macOS kqueue, Windows IOCP.

## Release gates and ownership

| Gate | Linear | OpenSpec change | Required before opening next gate |
| --- | --- | --- | --- |
| F — Foundations | CYB-60 | `beskid-v0-5-foundations` | OpenSpec green; parser/semantic/runtime/corelib/JIT/AOT/native evidence green; Foundation examples compile. |
| N — Networking | CYB-61 | `beskid-v0-5-networking` | Gate F green; reactor and DNS/TCP/UDP loopbacks green; every local platform backend green or has CI evidence. |
| H — HTTP/release | CYB-62 | `beskid-v0-5-http` | Gate N green; HTTP security/lifecycle suite, examples, docs, catalog, Tracker delivery, and full final matrix green. |

The authoritative coordination issue is CYB-59. Do not parallelize edits within one runtime ownership subsystem; parallelize only isolated OpenSpec, test-fixture, documentation, or platform-backend work after the shared interface is committed.

## F — Foundations (CYB-60)

### F0 — Normative baseline and acceptance matrix

| ID | Scope and files | Red test / normative scenario | Green acceptance | Commit |
| --- | --- | --- | --- | --- |
| F0.1 | Create `openspec/changes/beskid-v0-5-foundations/{proposal.md,design.md,tasks.md,.openspec.yaml}` | Proposal identifies scalar ABI, owner-routing, timer, and scoped-binding gaps while preserving ordinary module imports. | Change validates its own structure. | `docs(openspec): propose 0.5 foundations` |
| F0.2 | Add deltas for `language-meta--evaluation--fibers-and-spawn`, `execution--runtime--channels-and-synchronization`, `execution--runtime--fiber-scheduler-and-stacks`, `compiler--front-end--grammar-and-parser-contract`, `core-library--concurrency--concurrency-package`, bytes, encoding, and error handling. | Each requirement has an ID and GIVEN/WHEN/THEN scenario for visible behavior. | `bun run openspec:validate` passes without provisional or placeholder behavior. | Included in F0.1 |
| F0.3 | Create an evidence matrix under the change design. | Matrix maps every requirement to parser, semantic, runtime, corelib, JIT, AOT, and native proof. | No requirement lacks an owner and a test target. | `docs(openspec): map 0.5 foundation evidence` |

### F1 — Bindable spawn and Fiber<T>

| ID | Scope and files | Red test | Minimal implementation | Acceptance |
| --- | --- | --- | --- | --- |
| F1.1 | `compiler/crates/beskid_analysis/src/beskid.pest`; `syntax/expressions/spawn_expression.rs` | Parse `Fiber<i64> f = spawn Compute();` and block spawn with a capture. | Preserve `spawn` as an expression node that carries call/block and capture data. | Parser snapshots distinguish expression and discarded statement forms. |
| F1.2 | `types/checker/spawn.rs`, `types/checker/statements.rs`, `types/result.rs` | Infer `Fiber<i64>` and `Fiber<Result<unit, FoundationError>>`; reject mismatched target type, ignored handle, and terminal use-after-move. | Derive `T` from the spawned computation; preserve `Detach() -> unit`, `Cancel() -> unit`, and the closed `FiberError`. | Analysis fixtures assert types, spans, and diagnostic IDs. |
| F1.3 | generation-safe spawn facts, generated ISLE rules, and `runtime_manifest.bsol` where ABI needs a value descriptor | Captured lambda and aggregate return fail under JIT/AOT. | Lower a capture environment plus a typed result slot through the canonical `CodegenInput`/ISLE boundary. | A JIT and AOT fixture receives the expected aggregate result. |
| F1.4 | `runtime/beskid/src/Runtime/**` canonical fiber/scheduler modules | Generic result is collected or truncated; a child still runs after main exits. | Store result/capture roots in fiber state; join all non-detached children during main shutdown. | GC stress, cancellation, and shutdown tests pass through validated kits. |
| F1.5 | `corelib/packages/concurrency/src/Concurrency/{Fiber.bd,FiberError.bd,FiberJoinStatus.bd}` | Double join, join-after-detach, detach-after-join, and child panic cases fail. | Preserve the public method/error surface and enforce consuming terminal operations through move analysis. | Corelib and compiler parity fixtures agree across JIT/AOT/native. |

**F1 commands:** `cargo test -p beskid_tests analysis::spawn`; `cargo test -p beskid_engine --test spawn_scheduler`; focused JIT/AOT fixtures; `just compiler`.

### F2 — Generic channel values and ownership

| ID | Scope and files | Red test | Minimal implementation | Acceptance |
| --- | --- | --- | --- | --- |
| F2.1 | canonical `runtime/beskid/src/Runtime/**` channel modules plus trusted manifest intrinsics | `Channel<u8[]>` loses its array after a GC; `Channel<Result<OwnedResource, FoundationError>>` cannot enqueue. | Replace scalar transport with one traced ABI-value record representation and no Rust-runtime fallback. | Runtime tests prove scalar, pointer, aggregate, and Foundation-local opaque-handle storage. |
| F2.2 | `channel.rs`; GC/write-barrier helpers | Queued value or parked sender value becomes untraced after collection. | Trace queue and sender slots; write-barrier every replacement/removal. | GC concurrency stress retains values until receive/cancel. |
| F2.3 | `channel.rs`; scheduler parking paths | Bounded sender parks while holding the mutex and receiver cannot free capacity. | Release lock before parking; recheck commit state under lock after wake. | Backpressure test completes without lock starvation. |
| F2.4 | `Channel.bd`, `ChannelError.bd`, `ChannelOptions.bd` | Close drops queued messages; cancellation ownership is ambiguous. | Encode pre-commit retain versus post-commit transfer and close-after-drain semantics. | Exactly-one receive, close-drain, cancellation race, and abandoned-channel diagnostics pass. |
| F2.5 | Corelib tests plus Foundation-local `OwnedResource` fixtures | `Channel<OwnedResource>` duplicates disposal or leaks after drain. | Transport the opaque resource value without implicit disposal on close. | Resource ownership and leak-drain tests pass without Networking types. |

**F2 commands:** focused query/ISLE/codegen tests; canonical runtime concurrency/GC fixtures through JIT/AOT/native kits; `just corelib`.

### F3 — Scheduler commands, waits, timers, and deadlines

| ID | Scope and files | Red test | Minimal implementation | Acceptance |
| --- | --- | --- | --- | --- |
| F3.1 | `scheduler/{tls.rs,state.rs,run_loop.rs,mod.rs}` | A syscall worker wake lands in its own TLS queue and the owner scheduler remains parked. | Add scheduler IDs, thread-safe inbound command queue, and owner wake primitive. | Cross-thread completion wakes only its owning scheduler. |
| F3.2 | `scheduler/syscall_pool.rs` | All fibers parked with a pending syscall reports deadlock. | Increment/decrement active external waits across submission and terminal completion. | Deadlock fires only with parked fibers, no runnable fibers, and zero external sources. |
| F3.3 | `builtins/clocks.rs`, new scheduler timer module, Core Time package | Sleep or timeout has no scheduler source; wall-clock rollback changes deadline. | Use monotonic absolute deadlines and generation-tagged registration/cancellation. | `Sleep`, timer cancellation, and shutdown-with-timers tests pass. |
| F3.4 | Scheduler operation state | Close/readiness, cancel/timeout, or duplicate wake resume a fiber twice. | Centralize one atomic winner transition and idempotent cleanup. | Race matrix passes deterministically under repeated stress. |

**F3 commands:** focused query/ISLE/codegen tests; targeted canonical-runtime race fixture; native runtime-kit scheduler smoke.

### F4 — Scoped `use` and disposal

| ID | Scope and files | Red test | Minimal implementation | Acceptance |
| --- | --- | --- | --- | --- |
| F4.1 | `beskid.pest`, syntax AST, parser snapshots | `use TestResource resource = input;` is parsed as a module import or rejected. | Add a dedicated scoped-binding grammar/AST node while preserving `use Package.Module;`. | Parser distinguishes both forms without a `using` alias. |
| F4.2 | semantic checker | Non-Disposable resource, use-after-scope, or duplicate cleanup compiles. | Require `Disposable.Dispose() -> Result<unit, DisposeError>` and lexical scope ownership. | Semantic diagnostics identify binding and escape site. |
| F4.3 | lowering exit paths | Return, `?`, or nested exit skips cleanup. | Emit exactly-once cleanup edges in reverse declaration order for normal and supported abnormal exits. | Lowering/JIT/AOT tests cover every supported exit. |
| F4.4 | `corelib/packages/foundation/src/Core/Disposable.bd` | No authentic source contract exists. | Publish Disposable and DisposeError with no `using` alias. | Corelib imports and TCP-resource later bindings compile. |

### F5 — Bytes, encoding, and Core.IO

| ID | Scope and files | Red test | Minimal implementation | Acceptance |
| --- | --- | --- | --- | --- |
| F5.1 | `Core/Bytes/**`; runtime `bytes_copy` handler | Overlapping copy corrupts data; cursor overrun is unchecked. | Define overlap-safe copy and add reader/writer/cursor bounds/position/capacity APIs. | Zero-length, overlap, bounds, and cursor tests pass. |
| F5.2 | `Core/Encoding/{Utf8,Hex,Base64,EncodingError}.bd` | Overlong UTF-8, surrogate, >U+10FFFF, invalid Base64 bits/padding pass. | Complete strict validators; add HTTP ASCII helper. | Invalid-input matrix passes. |
| F5.3 | `Core/Syscall/Syscall.bd` | `ReadBytesWith` declaration disagrees with actual `u8[]` value. | Correct declared `Result<u8[], SyscallError>`. | Typecheck regression passes. |
| F5.4 | New `Core/IO/{Reader,Writer,Closer,Stream,IoError}.bd` | No API handles partial transfer/EOF/no-progress. | Implement contracts, `ReadExact`, `WriteAll`, typed propagation. | Partial read/write, EOF=Ok(0), zero input, idempotent close, and no-progress tests pass. |

### F6 — Foundation completion

1. Run targeted Foundation validation and `bun run openspec:validate`; reserve catalog regeneration for the final HTTP/release change.
2. Run `just corelib`, `just compiler`, `just tests`, targeted runtime tests, and available JIT/AOT/native tests.
3. Update CYB-60 with exact command outputs and platform omissions; retain Foundation as Todo/In Progress until every gate is green.
4. Run GitNexus changed-scope analysis before every commit and update `CHANGELOG.md` only after reconciling existing user edits.

## N — Networking (CYB-61; blocked by F)

### N0 — Normative/API boundary

1. Create `openspec/changes/beskid-v0-5-networking/` with proposal/design/tasks and deltas for handles, reactor, DNS, TCP, UDP, types, errors, and native runtime ABI.
2. Record the platform backend contract: epoll/Linux, kqueue/macOS, IOCP/Windows; document fallback only as unsupported-target test support.
3. Validate the change before source work: `bun run openspec:validate`.

### N1 — Opaque handles and reactor

| ID | Files | Required test-first behavior | Completion criterion |
| --- | --- | --- | --- |
| N1.1 | canonical `runtime/beskid/src/Runtime/Network/**` handle/operation modules | Open/close/reuse rejects stale generation; repeat close is harmless. | One canonical handle table owns generation, resource, close state, and leak metadata. |
| N1.2 | manifest-authorized epoll/kqueue/IOCP host operations plus canonical reactor coordination | Readiness for a closed/reused handle is ignored. | All three platform lanes produce one canonical completion record without a Rust scheduler. |
| N1.3 | semantic intrinsic facts, generated ISLE, `runtime_manifest.bsol`, `beskid_manifest`, `beskid_abi` | An intrinsic exposes a raw descriptor or resumes twice. | Typed opaque ABI and exactly-once completion across readiness/cancel/timeout/close. |
| N1.4 | runtime shutdown paths | Leaked handle survives runtime shutdown. | Shutdown closes handles and reports leaks in debug/conformance mode. |

### N2 — Network package surface

1. Create package/module files following existing package-manifest conventions: `Network/Types.bd`, `Errors.bd`, `Socket.bd`, `Dns.bd`, `Tcp.bd`, `Udp.bd`.
2. Add `IpAddress::V4`, `IpAddress::V6`, `SocketAddress`, `NetworkError`, and `Datagram` tests before implementation.
3. Bind `TcpStream`, `TcpListener`, and UDP resource types to Foundation `Disposable`; never add public descriptor fields.

### N3 — DNS, TCP, and UDP delivery

| Work | Failing cases | Required result |
| --- | --- | --- |
| DNS | multiple addresses, family filtering, host-not-found, cancellation while resolver runs, cache absence | blocking-pool job completion routes through F3; cancellation discards result without asserting OS interruption. |
| TCP | bind/listen/accept/connect, partial I/O, EOF, half-close, options, local/peer, deadlines, one-reader/one-writer/one-accept errors | loopback JIT/AOT/native API works with `use` and `Channel<TcpStream>`. |
| UDP | datagram boundaries, source address, truncation, bind/connected modes, deadline/cancel/concurrency | API is datagram-specific and never implements generic Stream. |

### N4 — Networking completion

1. Run reactor/handle unit tests, resolver tests, TCP/UDP loopbacks, `just corelib`, and JIT/AOT/native matrix tests.
2. Add CI coverage for any unavailable platform backend; do not call an unrun backend conformant.
3. Update CYB-61, run targeted and full OpenSpec validation without regenerating the release catalog, run changed-scope analysis, and commit the independently green networking change.

## H — HTTP and release (CYB-62; blocked by N)

### H0 — Normative boundary and security limits

1. Create `openspec/changes/beskid-v0-5-http/` with explicit HTTP parser, serializer, router, server, shutdown, documentation, and release-traceability deltas.
2. Set default limits exactly: 8 KiB line; 16 KiB headers; 100 headers; 1 MiB body; 100 requests/connection; 128 accept queue; 10s initial-read; 10s write; 30s keep-alive.
3. Specify every framing rejection and every release exclusion before implementation.

### H1 — Parser and serializer

| ID | Files | Red test | Green criterion |
| --- | --- | --- | --- |
| H1.1 | New `corelib/packages/http/src/Http/{Types,Errors,Headers,Parser}.bd` | conflicting `Content-Length`, `Content-Length`+chunked, folded header, bad chunk, premature EOF | Dedicated bounded parser rejects ambiguity/malformed input and preserves valid pipelining. |
| H1.2 | `Parser.bd`, Core.IO integration | line/header/body/request caps and slow-progress timeout | Counters and monotonic progress deadlines bound every request. |
| H1.3 | New `Serializer.bd` | partial writes, content length, chunked response, close semantics | Serializer uses `WriteAll` and writes only valid framing. |

### H2 — Router and server lifecycle

| ID | Files | Red test | Green criterion |
| --- | --- | --- | --- |
| H2.1 | New `Router.bd` | wrong method/path, exact match, named segment if selected | Exact method/path works without a middleware abstraction. |
| H2.2 | New `Server.bd` | bounded queue, accept/worker lifecycle, deadline, keep-alive cap | One joinable accept fiber, bounded generic channel, and joinable workers run on delivered primitives. |
| H2.3 | `Server.bd` tests | shutdown leaves listener/worker/stream live | Exact ten-step graceful shutdown sequence completes with typed result. |

### H3 — Examples, documentation, release evidence

1. Locate the existing CI example directory before adding any source; create examples only where analysis/JIT/AOT/native matrix registration can compile them.
2. Add source examples for: spawn/join; fiber cancel; aggregate channel; `Channel<TcpStream>`; scoped `use`; TCP echo; TCP worker pool; UDP echo; DNS; handler; router; server; graceful shutdown.
3. Update Book concurrency/networking chapters, corelib/runtime docs, website examples, package exports, changelog, and release status only after their examples compile.
4. Confirm Tracker’s canonical 0.5 workflow before writing delivery data; seed data currently declares v0.5+ absent.

### H4 — Final release gate

1. Run OpenSpec catalog then validation, all focused compiler/runtime/corelib suites, JIT/AOT/native tests, HTTP security tests, website/docs checks, package/export checks, and locally available platform tests.
2. Add or verify CI jobs for unavailable supported platform cells and record those as remote-only evidence.
3. Run GitNexus `detect_changes({scope: "compare", base_ref: "main"})`, whole-branch review, and CHANGELOG validation before final commit.
4. Update CYB-62/CYB-59 and Tracker delivery links with catalog revision, commit, target matrix, and all command results. Release is incomplete if any required behavior is stubbed or any gate fails.
