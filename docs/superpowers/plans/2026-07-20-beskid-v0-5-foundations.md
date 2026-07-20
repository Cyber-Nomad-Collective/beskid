# Beskid 0.5 Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 0.5 fiber, channel, scheduler, resource-scope, bytes/encoding, and Core.IO APIs executable and conformant before networking begins.

**Architecture:** Preserve one runtime representation for values crossing fibers and channels: ABI values carry GC metadata and resource ownership rather than a scalar-only side path. Scheduler completion, timer expiry, cancellation, and close submit idempotent owner-routed commands; `use` lowers lexical cleanup through the same explicit disposal contract used by corelib resources.

**Tech Stack:** Rust compiler host and semantic queries, generated ISLE/CLIF, canonical Beskid runtime sources, Beskid corelib, Pest grammar, JIT/AOT kit conformance, OpenSpec, Bun.

## Global Constraints

- Linear authority: CYB-60; do not begin CYB-61 before every required Foundation acceptance gate passes.
- Create `openspec/changes/beskid-v0-5-foundations/`; generated `openspec/catalog.json` is never edited manually.
- Run GitNexus upstream impact analysis before editing each production symbol; warn and stop for HIGH or CRITICAL results.
- Add a focused failing test, observe failure, implement minimally, then run focused and integration gates.
- `spawn` returns `Fiber<T>`; `Channel<T>` accepts aggregates and resource-bearing values; `use` is the only scoped-resource keyword.
- 0.5 starts from the completed 0.4 architecture: no Rust runtime scheduler/channel implementation, legacy `Lowerable`, or handwritten Rust expression-lowering path may be revived.

### Task 1: Establish the Foundation OpenSpec contract

**Files:**
- Create: `openspec/changes/beskid-v0-5-foundations/{proposal.md,design.md,tasks.md,.openspec.yaml}`
- Create: deltas beneath `openspec/changes/beskid-v0-5-foundations/specs/` for fibers/spawn, channels, scheduler, grammar/parser, error handling, bytes, encoding, and core concurrency.

- [ ] Add stable SHALL requirements and GIVEN/WHEN/THEN scenarios for `Fiber<T>`, Join/Detach/Cancel consumption, captures/roots, channel commit/close/cancel ownership, timer race winners, and `use` cleanup order.
- [ ] Run `bun run openspec:validate` and correct every delta/layout/traceability error.
- [ ] Commit: `docs(openspec): specify beskid 0.5 foundations`.

### Task 2: Make `spawn` a value-producing generic fiber expression

**Files:**
- Modify: `compiler/crates/beskid_analysis/src/beskid.pest`, `syntax/expressions/spawn_expression.rs`, `types/checker/spawn.rs`, `types/checker/statements.rs`, `types/result.rs`
- Modify: generation-safe spawn facts in `compiler/crates/beskid_queries/**`, generated rules in `compiler/crates/beskid_isle/**`, `compiler/runtime_manifest.bsol`, and canonical modules under `compiler/runtime/beskid/src/Runtime/**`
- Test: `compiler/crates/beskid_tests/**`, focused query/ISLE/codegen fixtures, canonical runtime conformance fixtures, and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/concurrency/FiberHandleTests.bd`

- [ ] Write parser/type tests for `Fiber<i64> worker = spawn Compute();`, a captured block returning `Result<unit, FoundationError>`, aggregate returns, discarded non-detached handles, semantic use-after-move on `Join`/`Detach`, and result-type mismatch; observe each failure.
- [ ] Define one internal `FiberResult` storage representation that holds an ABI value plus trace metadata; replace scalar `i64` result transport and null-only capture environments.
- [ ] Lower call and block spawn forms through generated ISLE into that representation; register captures and result slots as GC roots; preserve the expression-statement form only with discarded-handle diagnostics.
- [ ] Implement Join/Detach/Cancel state transitions in canonical Beskid runtime modules while preserving `Detach() -> unit`, `Cancel() -> unit`, and the existing closed `FiberError`; main shutdown joins non-detached children.
- [ ] Run `cargo test -p beskid_tests analysis::spawn`, focused query/ISLE/codegen suites, JIT/AOT/native parity fixtures, and `just compiler`.
- [ ] Commit: `feat(fibers): make spawn return rooted Fiber<T>`.

### Task 3: Make generic channels GC-safe and ownership-safe

**Files:**
- Modify: canonical channel/scheduler modules under `compiler/runtime/beskid/src/Runtime/**`, trusted manifest intrinsics, and their generation-safe query/ISLE call sites
- Modify: `compiler/corelib/packages/concurrency/src/Concurrency/{Channel.bd,ChannelError.bd,ChannelOptions.bd}`
- Test: canonical runtime conformance fixtures, JIT/AOT/native kit fixtures, and `compiler/corelib/beskid_corelib/tests/corelib_tests/src/concurrency/ChannelApiTests.bd`

- [ ] Write failing tests for `Channel<u8[]>`, aggregate payload tracing, parked sender retention, close-after-queue-drain, pre/post-commit cancellation, exactly-once receive, and bounded backpressure.
- [ ] Replace `VecDeque<i64>` payload storage with a single traced ABI-value queue; apply write barriers on enqueue/dequeue and retain parked send values until commit, cancellation, or return to sender.
- [ ] Release the channel mutex before parking/waking fibers; make close/cancel/receive resolve one deterministic commit state.
- [ ] Add resource-ownership diagnostics for abandoned undrained channels without implicitly disposing payloads.
- [ ] Run focused query/ISLE/codegen tests, canonical runtime GC/concurrency fixtures through JIT/AOT/native kits, and `just corelib`.
- [ ] Commit: `feat(channels): support traced generic ownership transfer`.

### Task 4: Route external wakes and introduce timers/deadlines

**Files:**
- Modify: canonical scheduler/timer modules under `compiler/runtime/beskid/src/Runtime/**`, `compiler/runtime_manifest.bsol`, and trusted platform intrinsic facts/rules
- Modify: `compiler/corelib/packages/foundation/src/Core/Time/**`
- Test: canonical runtime scheduler/timer conformance plus JIT/AOT/native timer-race integration tests.

- [ ] Write failing race tests for wake-before/during/after-park, duplicate wake, active syscall wait with all fibers parked, true deadlock, timer cancellation, and readiness/cancel/close/timeout winner selection.
- [ ] Add scheduler identity, thread-safe inbound commands, platform wake primitive, and external-wait counter; drain commands only on the owning scheduler.
- [ ] Add monotonic absolute deadlines and generation-tagged timer registrations; expose `Sleep` through the runtime builtin and corelib without wall-clock I/O deadlines.
- [ ] Run focused query/ISLE/codegen tests and canonical runtime scheduler tests through the validated runtime kits.
- [ ] Commit: `feat(runtime): route external wakes and deadlines`.

### Task 5: Introduce scoped `use` and deterministic disposal

**Files:**
- Modify: `compiler/crates/beskid_analysis/src/{beskid.pest,syntax/**,types/checker/**}`
- Modify: generation-safe cleanup facts and generated ISLE rules in `compiler/crates/beskid_queries/**` and `compiler/crates/beskid_isle/**`
- Create: `compiler/corelib/packages/foundation/src/Core/Disposable.bd`
- Test: parser/semantic/lowering fixtures and corelib resource-scope tests.

- [ ] Write failing tests for `use TestResource resource = input;`, preserved `use Package.Module;` imports, normal fallthrough, return, `?` propagation, nested reverse cleanup, use-after-scope, and exactly-once cleanup.
- [ ] Add a scoped-resource AST node distinct from imports, validate `Disposable.Dispose() -> Result<unit, DisposeError>`, and reject invalid resource expressions.
- [ ] Lower cleanup edges through generated ISLE for every supported lexical exit and preserve the cleanup-failure policy from the OpenSpec delta.
- [ ] Run parser, semantic, lowering, JIT, AOT, and corelib tests; commit `feat(language): add scoped use cleanup`.

### Task 6: Complete bytes, encoding, and Core.IO

**Files:**
- Modify: `compiler/corelib/packages/foundation/src/Core/{Bytes/**,Encoding/**,Syscall/Syscall.bd}`
- Modify: `compiler/corelib/packages/runtime/src/Runtime/Handlers/Bytes.bd`
- Create: `compiler/corelib/packages/foundation/src/Core/IO/**`
- Test: `compiler/corelib/beskid_corelib/tests/corelib_tests/src/core/{BytesTests.bd,EncodingUtf8Tests.bd}` and new IO tests.

- [ ] Write failing bounds/zero-length/overlap tests; replace unsafe overlap copy with the specified overlap-safe policy; add reader/writer/cursor tests.
- [ ] Write invalid UTF-8, Hex, Base64, and ASCII tests; reject overlong, surrogate, out-of-range, and malformed-padding inputs.
- [ ] Correct `ReadBytesWith` to declare the actual `Result<u8[], SyscallError>` value type.
- [ ] Add `Reader`, `Writer`, `Closer`, `Stream`, `ReadExact`, and `WriteAll`; test partial transfers, EOF, zero-length, close idempotency, and no-progress rejection.
- [ ] Run `just corelib`, `python3 corelib/ci/normalize_corelib_test_imports.py --check`, and the focused compiler suites; commit `feat(corelib): add safe bytes encoding and io contracts`.

### Task 7: Foundation release evidence

- [ ] Run `openspec validate beskid-v0-5-foundations --strict --no-interactive`, `bun run openspec:validate`, all focused commands above, `just tests`, and available JIT/AOT/native tests. Do not regenerate the release-wide catalog before the final HTTP/release change.
- [ ] Compile Foundation-local spawn/join, aggregate result, generic channel/resource, timer, scoped-resource, bytes/encoding, and Core.IO examples without importing Networking or HTTP types.
- [ ] Update CYB-60 with exact commands, revisions, and platform gaps; do not advance CYB-61 unless the Foundation evidence is green.
- [ ] Commit documentation/evidence separately: `docs(release): record 0.5 foundation conformance`.
