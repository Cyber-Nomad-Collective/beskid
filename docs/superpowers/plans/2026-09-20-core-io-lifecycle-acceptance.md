# Core.IO Lifecycle Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox syntax for tracking.

**Goal:** Prove v0.5 Core.IO close and scoped-cleanup contracts across JIT, static AOT, and the shared native runtime kit without duplicating IO policy or compiler cleanup machinery.

**Architecture:** The Core.IO module remains the single transfer-policy implementation. A fixture-only TestStream implements Stream, Closer, and Disposable and owns the sole physical-close transition. Dispose delegates only to Close and adapts its result. Existing semantic/ISLE cleanup lowering and Core.IO.FromDisposeError remain the only scoped-cleanup path.

**Tech Stack:** Beskid source fixtures, Rust integration tests, Cranelift JIT, object AOT, shared ABI-v5 native runtime kit.

**Spec:** docs/superpowers/specs/2026-09-20-core-io-lifecycle-design.md

## Global Constraints

- Do not repeat IO in Core.IO.
- The Core.IO module remains the only range validation, exact/all loop, EOF, no-progress, and provider-count policy implementation; use `IO.bd` only when naming the source file.
- An owning resource has exactly one physical-close state transition; Dispose is an adapter, not another state machine.
- Do not add IO-specific cleanup lowering, a generic error coercion, or a second native fixture harness.
- Reuse foundation_io.bd and foundation_io_native.rs; every runtime behavior gate executes source lowering, JIT, static AOT, and shared native-kit execution.
- Use the private `windows-server-2025` KVM guest on the NixOS build host for one native Windows evidence run when its already-configured SSH access is available. Do not alter the guest, NixOS host, credentials, firewall rules, or CI to obtain that run; record it as unavailable rather than claiming it if access cannot be refreshed.
- Preserve BSP-REQ-F25A4DF4DEA0 public shapes and errors exactly.
- Do not use GitNexus.

## Review Focus

- Explicit Close followed by scoped Dispose keeps physical release count at one, including configured failure.
- Closer and Stream calls dispatch through their interfaces.
- Scoped fallthrough, return, postfix ?, and nested scopes reuse existing reverse-order cleanup lowering.
- Invalid/empty base Read and Write never invoke a provider or mutate unaffected bytes.
- Provider Result.Error propagates while negative/oversize successful counts become ReadFailed or WriteFailed.

---

## File structure

| File | Responsibility |
| --- | --- |
| compiler/crates/beskid_engine/tests/fixtures/foundation_io.bd | One behavior fixture: adapters, lifecycle state, contract dispatch, transfer assertions. |
| compiler/crates/beskid_engine/tests/foundation_io_native.rs | Existing three-backend harness and named regression entrypoint. |
| compiler/CHANGELOG.md | Unreleased release evidence. |

### Task 1: Prove one close transition through all published interfaces

**Files:**
- Modify: compiler/crates/beskid_engine/tests/fixtures/foundation_io.bd
- Modify: compiler/crates/beskid_engine/tests/foundation_io_native.rs lines 67-70

**Interfaces:**
- Consumes: Core.IO.Stream, Core.IO.Closer, Core.Disposable, Core.IO.FromDisposeError.
- Produces: TestStream: Stream, Closer, Disposable; CloseTwice(Closer) -> Result<unit, IoError>; lifecycle result codes in RunFoundationFixture.

- [ ] **Step 1: Write failing test and fixture shape**

Add Rust test foundation_io_closer_stream_and_scoped_cleanup_are_native_safe calling run_foundation_fixture("foundation_io.bd").

Add TestStream state [released, release_calls, fail_close], Read, Write, Close, and Dispose methods. Add CloseTwice(Closer closer) that invokes closer.Close(). Compile before implementing lifecycle assertions.

- [ ] **Step 2: Verify failure**

Run: cargo test -p beskid_engine --test foundation_io_native foundation_io_closer_stream_and_scoped_cleanup_are_native_safe -- --exact --nocapture

Expected: FAIL until all three contracts and lifecycle proof exist.

- [ ] **Step 3: Implement the sole physical-close transition**

Close behavior: if released, return Ok(unit); otherwise set released, increment release_calls, then return Error(CloseFailed) when fail_close is nonzero or Ok(unit). Dispose invokes Close and converts only Error to DisposeError.Failed.

RunFoundationFixture must call CloseTwice through a Closer receiver, call Read and Write through a Stream receiver, and explicitly Close a TestStream before use binding it. Assert release_calls equals one after scope exit for successful and failing first Close. Do not add transfer policy to TestStream.

- [ ] **Step 4: Verify all three native modes**

Run: cargo test -p beskid_engine --test foundation_io_native foundation_io_closer_stream_and_scoped_cleanup_are_native_safe -- --exact --nocapture

Expected: PASS through source lowering, JIT, static AOT, and native kit.

- [ ] **Step 5: Commit**

Run:
git add crates/beskid_engine/tests/fixtures/foundation_io.bd crates/beskid_engine/tests/foundation_io_native.rs
git commit -m "test(io): prove stream close cleanup lifecycle"

### Task 2: Prove structured cleanup exits through the existing compiler seam

**Files:**
- Modify: compiler/crates/beskid_engine/tests/fixtures/foundation_io.bd

**Interfaces:**
- Consumes: TestStream.Dispose() -> Result<unit, DisposeError> from Task 1 and scoped use lowering.
- Produces: fixture assertions for fallthrough, return, postfix ?, nested reverse-order cleanup, and IoError.CloseFailed conversion.

- [ ] **Step 1: Write failing exit functions**

Add ReturnFromScope(TestStream) returning Result<unit, IoError> with use binding then return. Add PropagateFromScope(TestStream) using a scoped resource and Result.Error(IoError.ReadFailed())?. Add nested use bindings with distinct state arrays and unique fixture result codes.

- [ ] **Step 2: Verify failure**

Run: cargo test -p beskid_engine --test foundation_io_native foundation_io_closer_stream_and_scoped_cleanup_are_native_safe -- --exact --nocapture

Expected: FAIL until every structured exit and conversion result is asserted.

- [ ] **Step 3: Implement assertions only with use and Dispose**

Follow scoped_cleanup.bd syntax. Assert exactly one physical release after fallthrough, return, and postfix ?; assert nested reverse ordering; assert a configured dispose failure becomes IoError.CloseFailed via existing FromDisposeError. Do not add ScopedStream, another CleanupConversion, or cleanup compiler code.

- [ ] **Step 4: Verify existing cleanup remains canonical**

Run: cargo test -p beskid_engine --test foundation_io_native foundation_io_closer_stream_and_scoped_cleanup_are_native_safe -- --exact --nocapture && cargo test -p beskid_engine --test scoped_cleanup_native -- --nocapture

Expected: PASS.

- [ ] **Step 5: Commit**

Run:
git add crates/beskid_engine/tests/fixtures/foundation_io.bd
git commit -m "test(io): cover close cleanup exits"

### Task 3: Complete direct transfer boundary coverage without another policy path

**Files:**
- Modify: compiler/crates/beskid_engine/tests/fixtures/foundation_io.bd

**Interfaces:**
- Consumes: Core.IO.Read, Write, ReadExact, WriteAll and partial Reader/Writer contracts.
- Produces: direct base-operation and adversarial-provider assertions.

- [ ] **Step 1: Write failing providers and base-operation checks**

Add InvalidCountReader(response) returning Result.Ok(response), InvalidCountWriter(response), ErrorReader returning Result.Error(IoError.ReadFailed), and ErrorWriter returning Result.Error(IoError.WriteFailed). Add helpers matching ReadFailed, WriteFailed, propagated errors.

Assert direct Core.IO.Read and Write invalid negative, overflow, and end-past-buffer calls leave provider counters unchanged. Assert valid empty calls do too. Assert base Read EOF preserves destination and nonzero Write offsets preserve unaffected source bytes.

- [ ] **Step 2: Verify failure**

Run: cargo test -p beskid_engine --test foundation_io_native foundation_io_transfers_validate_ranges_and_handle_partial_eof_and_progress -- --exact --nocapture

Expected: FAIL until direct result and no-effect assertions are encoded.

- [ ] **Step 3: Implement only fixture assertions**

Use Core.IO.Read, Write, ReadExact, WriteAll for every policy decision. Assert negative/oversize successful counts map to ReadFailed/WriteFailed and provider errors propagate. No provider may add range validation, retry, EOF policy, or exact/all loops.

- [ ] **Step 4: Verify focused and complete native foundation gates**

Run: cargo test -p beskid_engine --test foundation_io_native foundation_io_transfers_validate_ranges_and_handle_partial_eof_and_progress -- --exact --nocapture && cargo test -p beskid_engine --test foundation_io_native -- --nocapture

Expected: PASS across all modes.

- [ ] **Step 5: Commit**

Run:
git add crates/beskid_engine/tests/fixtures/foundation_io.bd
git commit -m "test(io): complete transfer boundary coverage"

### Task 4: Record evidence and independently accept the slice

**Files:**
- Modify: compiler/CHANGELOG.md
- Modify: compiler/crates/beskid_engine/tests/foundation_io_native.rs lines 65-70 only if stale F6 RED text is disproved.
- Create: ignored .superpowers/sdd/2026-09-19-beskid-v0-5-closure-rebaseline/task-7-io-lifecycle-report.md

**Interfaces:**
- Consumes: Tasks 1-3, NixOS developer cache at /var/tmp/beskid-local-build, and the private `windows-server-2025` KVM guest when its access is already available.
- Produces: release evidence, clean diff, reviewer-ready final commit.

- [ ] **Step 1: Update evidence after green gates only**

Replace stale F6 RED commentary with exact verified coverage. Add Unreleased/Fixed changelog entry. Do not claim Windows/macOS cross-target proof unless it ran.

- [ ] **Step 2: Run local acceptance**

Run: cargo test -p beskid_engine --test foundation_io_native -- --nocapture && cargo test -p beskid_engine --test scoped_cleanup_native -- --nocapture && cargo test -p beskid_queries --test semantic_facts scoped_cleanup -- --nocapture && git diff --check

Expected: PASS. Record exact totals and warning-only output.

- [ ] **Step 3: Run relocated NixOS/Linux acceptance**

Sync compiler and beskid_bsol into /var/tmp/beskid-local-build excluding .git and target. Run pinned Rust container with CARGO_TARGET_DIR=/workspace/target:
cargo test -p beskid_engine --test foundation_io_native -- --nocapture
cargo test -p beskid_engine --test scoped_cleanup_native -- --nocapture

Expected: PASS without changing Woodpecker or NixOS configuration.

- [ ] **Step 4: Run established Windows acceptance when available**

Use the private `windows-server-2025` guest through the NixOS host's established private SSH forwarding and its preinstalled MSVC/Rust toolchain. Transfer an exact compiler plus sibling `beskid_bsol` snapshot only as required by the established host workflow, then run the focused native foundation gates. Do not create, start, stop, reconfigure, or otherwise mutate the guest or NixOS host. If guest SSH access is unavailable, record that Windows evidence did not run and preserve the local/NixOS result; do not claim cross-platform proof.

- [ ] **Step 5: Audit and commit evidence**

Run: git status --short && git diff --check

Confirm only planned tracked files plus ignored report. Commit:
git add CHANGELOG.md crates/beskid_engine/tests/foundation_io_native.rs
git commit -m "test(io): accept lifecycle and transfer contracts"

- [ ] **Step 6: Request a fresh independent review**

Reviewer verifies no Core.IO lifecycle or transfer duplication, one physical release transition, all contract dispatch, local/NixOS evidence, and release-note accuracy.

## Plan self-review

- Spec coverage: Tasks 1-2 cover one close transition, all contracts, conversion, and every structured exit. Task 3 covers direct and exact/all transfer boundaries. Task 4 covers local/NixOS evidence, established-host Windows evidence when available, and review.
- Placeholder scan: every task names files, required behavior, commands, expected results, and a commit.
- Type consistency: TestStream implements Stream, Closer, Disposable; CloseTwice consumes Closer; Dispose returns Result<unit, DisposeError>; transfer functions retain Result<..., IoError>.
- Review focus: close-before-scope and dispatch are Task 1; exits are Task 2; invalid/empty behavior and provider errors are Task 3.
