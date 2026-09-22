# F6 Native Descriptor Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing syscall descriptor contract correct and executable on all supported native targets without duplicating `Core.IO` policy or accepting raw Win32 handles.

**Architecture:** `Core.Syscall` retains its existing source surface and validates its `i64` raw selector into the established signed-`i32` descriptor domain. The canonical Runtime.Io worker owns one private descriptor duplicate for each accepted operation and executes one binary-mode partial transfer through the platform's descriptor API; it remains the only scheduler, staging, completion, and cancellation route. Windows fixtures provide UCRT descriptors rather than encoded `HANDLE`s, so all tests exercise the same production meaning.

**Tech Stack:** Beskid corelib/runtime source, generated ABI-v5 manifest contracts, C11 platform adapters, UCRT/POSIX descriptor APIs, Rust integration tests, exact native runtime kits, OpenSpec, macOS/Linux/Windows native hosts.

**Spec:** `openspec/changes/beskid-v0-5-foundations/`; research authority before Task 1: `compiler-v05-foundations-runtime/docs/research/2026-09-21-f6-windows-descriptor-abi-design.md`.

## Global Constraints

- `Core.IO.Reader`, `Writer`, `Closer`, `Stream`, `ReadExact`, and `WriteAll` remain the single owner of public partial-transfer loops, EOF/no-progress policy, and close policy; no Core.IO copy or Windows-only loop is allowed.
- `Descriptor::Raw(i64)` validates to one nonnegative signed-`i32` descriptor domain before any narrowing; a Windows `HANDLE` is never an alternate encoding.
- Keep the existing syscall ABI signatures and generated ABI-v5 authority; do not invent a hand-maintained header, service table, descriptor registry, public handle API, or ABI-v6 compatibility path.
- Each accepted native request owns a duplicate until native completion or safe abandonment. The runtime never changes or closes the caller's descriptor or caller-selected text/binary mode.
- Windows uses the supported shared application dynamic UCRT; hosted C fixture CRT flags must continue to come only from `beskid_tests_support::native_harness`.
- Preserve one partial native read/write operation per worker request. `Core.IO.WriteAll` alone owns complete-write looping.
- Update all direct worker fixtures together; no branch may guess whether a submitted word means a UCRT/POSIX fd or a Win32 `HANDLE`.
- Run native evidence only with exact same-revision kits. Missing tools or kits are unavailable cells, not passes. Do not expose credentials, stage a persistent guest checkout, push, merge, publish, or run installation-affecting final gates during this plan.

## Review Focus

- Out-of-domain `i64` values must return `InvalidFd(original)` before narrowing or native effects; test `-1`, `INT32_MAX + 1`, and `2^32 + 198`.
- A valid Windows UCRT descriptor and a numerically colliding Win32 handle must select the descriptor's bytes, never an alternate object.
- CRLF, Ctrl-Z, NUL, `0xff`, short read, and EOF must retain the binary byte/count contract while leaving the caller descriptor's mode unchanged.
- Cancellation, queue rejection, close/rebind, owner destruction, and shutdown must release exactly the duplicate they own without stale copy, wake, or leak.
- A real emitted Windows executable with redirected standard streams must share the supported UCRT descriptor namespace; a hosted `main` is not enough evidence.

## File Structure and Seams

| Path | Responsibility | Must not own |
| --- | --- | --- |
| `openspec/changes/beskid-v0-5-foundations/{design.md,tasks.md,specs/**}` | Normative descriptor domain, partial primitive, ownership, and evidence obligations. | Implementation fallback or copied source code. |
| `compiler/corelib/packages/foundation/src/Core/Syscall/{Syscall,Descriptor,SyscallError}.bd` | Source-domain checks and existing typed result construction. | Platform conversion, descriptor lifetime, Core.IO loops. |
| `compiler/runtime/beskid/src/Runtime/Io/Syscalls.bd` | Canonical submission/staging/managed completion using validated descriptors. | Independent scheduler or public I/O policy. |
| `compiler/crates/beskid_abi/assembly/common/external_wait.h` | One private descriptor acquire/perform/release path for the native worker. | Fixture-specific I/O semantics. |
| `compiler/runtime_manifest.bsol` and generated ABI artifacts | Sole ABI/import/layout declaration. | Hand-edited parallel generated declarations. |
| `compiler/crates/beskid_engine/tests/{foundation_io_native.rs,fixtures/foundation_syscall.bd,fixtures/foundation_io.c,fixtures/external_wait.c}` | Source-level evidence and UCRT descriptor fixture production. | Production translation or Core.IO policy. |
| `compiler/crates/beskid_abi/tests/fixtures/external_owner_transport.c` | Existing direct-worker fixture migrated to descriptor input. | A second worker contract. |

### Task 1: Amend the normative descriptor and partial-transfer contract

**Files:**
- Modify: `openspec/changes/beskid-v0-5-foundations/design.md`
- Modify: `openspec/changes/beskid-v0-5-foundations/tasks.md`
- Modify: `openspec/changes/beskid-v0-5-foundations/specs/core-library--stability-and-api-shape--core-syscall/spec.md`
- Modify: `openspec/changes/beskid-v0-5-foundations/specs/core-library--stability-and-api-shape--corelib-api-shape/spec.md`
- Modify: the applicable delta under `openspec/changes/beskid-v0-5-foundations/specs/execution--runtime--panic-io-and-syscalls/`
- Modify: the applicable ABI-v5 delta under `openspec/changes/beskid-v0-5-foundations/specs/execution--abi-and-host--abi-versioning-and-compatibility/`

**Interfaces:**
- Consumes: the established `Descriptor::Raw(i64)`, ABI `i32` read/write parameters, and existing Core.IO sole-authority requirement.
- Produces: allocated stable requirements/scenarios for the descriptor domain, Windows UCRT namespace, binary primitive, duplicate ownership, partial count/EOF/failure results, and target evidence.

- [ ] **Step 1: Write the proposed requirements and scenarios before implementation**

  Add SHALL/MUST text that states the source validation and ownership boundary explicitly:

  ```markdown
  `Descriptor::Raw(i64)` SHALL be validated as a nonnegative signed-32-bit
  file descriptor before ABI narrowing. On Windows the descriptor SHALL be in
  the supported application UCRT namespace; a Win32 HANDLE SHALL NOT be an
  alternate numeric descriptor encoding.
  ```

  Add executable scenarios for `198`, `-1`, `2147483648`, `4294967494`, redirected standard descriptors, byte corpus/EOF/short transfer, cancellation/rebind, and static/shared/JIT evidence. Amend any pre-existing partial-write wording so it delegates complete-write behavior to `Core.IO.WriteAll`, not a worker loop.

- [ ] **Step 2: Validate the norm before code changes**

  Run: `pnpm exec openspec validate beskid-v0-5-foundations --strict --no-interactive`

  Expected: exit 0; every new scenario is structurally valid and no prior Core.IO or syscall requirement is contradicted.

- [ ] **Step 3: Review the normative delta and commit it alone**

  Run: `git diff --check && git diff -- openspec/changes/beskid-v0-5-foundations`

  Commit only the OpenSpec delta with: `docs(openspec): define native descriptor contract`.

### Task 2: Establish red source and manifest agreement tests

**Files:**
- Modify: `compiler/crates/beskid_engine/tests/foundation_io_native.rs`
- Modify: `compiler/crates/beskid_engine/tests/fixtures/foundation_syscall.bd`
- Modify: `compiler/crates/beskid_engine/tests/fixtures/foundation_io.c`
- Modify: `compiler/crates/beskid_manifest/tests/` existing ABI/source-authority target as discovered
- Modify: `compiler/crates/beskid_abi/tests/runtime_bootstrap_contract.rs`

**Interfaces:**
- Consumes: Task 1's exact scenario names and the unchanged `(i32, pointer, usize) -> i64` byte ABI.
- Produces: failing source/native tests proving range guards, exact binary payloads, partial/EOF results, and manifest/import contracts before worker implementation changes.

- [ ] **Step 1: Add failing source fixtures with exact observable codes**

  Keep the existing `RunFoundationFixture` fd-198 payload check and add separate functions that assert the original invalid descriptor value, a short `{0, 255, 42}` prefix, and empty EOF without inspecting private worker state:

  ```beskid
  Result<u8[], SyscallError> result = Syscall.ReadBytesWith(request);
  return match result {
      Result::Error(SyscallError::InvalidFd(value)) => value,
      _ => -1_i64,
  };
  ```

  Use the existing source-lowering/JIT/static/shared helper. Do not call the native worker directly as a substitute.

- [ ] **Step 2: Add native producer controls without adding I/O policy**

  Extend the existing C driver only to create descriptor-backed input, write the binary corpus through the host descriptor producer, coordinate short/EOF cases, and report fixture result codes. On Windows, use `_pipe(..., _O_BINARY)`, preserve any displaced fd before `_dup2(readFd, 198)`, check `_dup2` for `0`, and restore/close descriptors during cleanup.

- [ ] **Step 3: Prove red state on each supported host**

  Run: `cargo test -p beskid_engine --test foundation_io_native foundation_syscall_read_bytes_with_preserves_bytes_result -- --exact --nocapture --test-threads=1`

  Expected before Tasks 3–4: existing Unix behavior stays green; newly enabled Windows positive descriptor cases fail because the worker still interprets an fd as a `HANDLE`. Record exact discovery and failure output without weakening assertions.

- [ ] **Step 4: Commit the red evidence only after review**

  Commit only the fixture/test contract with: `test(engine): specify native descriptor acceptance`.

### Task 3: Implement one validated descriptor admission and ownership path

**Files:**
- Modify: `compiler/corelib/packages/foundation/src/Core/Syscall/Syscall.bd`
- Modify: `compiler/runtime/beskid/src/Runtime/Io/Syscalls.bd`
- Modify: `compiler/crates/beskid_abi/assembly/common/external_wait.h`
- Modify: target-specific C adapter/import declarations referenced by `external_wait.h`
- Modify: `compiler/runtime_manifest.bsol`
- Regenerate: existing ABI-v5 generated artifacts through the repository generator, never manually

**Interfaces:**
- Consumes: Task 1 requirements and Task 2 red fixtures.
- Produces: one validated descriptor domain, request-owned duplicate lifecycle, and one binary partial-transfer worker path on every target.

- [ ] **Step 1: Write focused failing tests for source and raw ABI guards**

  Assert that guards execute before `i32(fd)` lowering and before allocation/native admission, including `WriteBytes` and the `i64` text-write service. Keep `Read` stdin-only and make the now-normative negative/range guard precedence explicit.

- [ ] **Step 2: Implement the common source-domain guard**

  Add one module-private scalar source helper used by all descriptor-taking façade operations (Beskid expresses this by omitting `pub`; it has no `private` keyword). The language's unfinished private-generic ABI query cannot lower the illustrative `Result<i32, SyscallError>` shape; do not expose it publicly or duplicate its domain policy. Because valid descriptors are nonnegative, `-1` is an unambiguous private sentinel and each façade maps only that sentinel to its existing typed result envelope:

  ```beskid
  i32 CheckedDescriptor(i64 descriptor) {
      if descriptor < 0_i64 || descriptor > 2147483647_i64 {
          return -1_i32;
      }
      return i32(descriptor);
  }
  ```

  Apply it before source allocation or intrinsic calls. The helper alone owns both the range comparison and narrowing; callers only translate the sentinel to `InvalidFd(original)`. Preserve public signatures and `Result` envelopes; do not add `HANDLE`, `usize`, or a second source stream abstraction. Test fd `0` explicitly so the sentinel cannot be confused with a valid descriptor.

- [ ] **Step 3: Make worker admission own one duplicate**

  Extend the existing canonical `SyscallSubmitAndPark` ownership state so successful admission records an owned duplicate, not the caller fd. On Windows, acquire with `_dup`, select `_O_BINARY` on the duplicate, capture expected CRT errors safely with a scoped thread-local handler, and close only with `_close`; on POSIX, acquire a non-inheritable duplicate. Every pre-admission rejection closes any temporary duplicate. Use an explicit owned/not-owned state because fd `0` is valid.

- [ ] **Step 4: Replace Windows handle reinterpretation with descriptor operations**

  In the sole native worker implementation, perform one `_read`/`_write` on the owned UCRT descriptor and record partial count, zero EOF, or existing negative failure. Keep Windows-specific conversion/private inheritance controls pointer-width only; do not place a `HANDLE` in the request's descriptor field. Bound one transfer to the documented Windows limit without truncating a caller-provided length or looping.

- [ ] **Step 5: Regenerate and verify ABI authority**

  Run the existing manifest/ABI generator, then:

  ```sh
  cargo test -p beskid_manifest --test abi_v5_source_authority
  cargo test -p beskid_abi --test runtime_bootstrap_contract
  cargo test -p beskid_abi --test abi_v5_contract
  ```

  Expected: generated signatures retain byte-service `(i32, pointer, usize) -> i64`; exact imports match actual C objects; no manually added ABI table exists.

- [ ] **Step 6: Run focused native source routes and commit**

  Run: `cargo test -p beskid_engine --test foundation_io_native -- --nocapture --test-threads=1`

  Expected: all source assertions pass on the current host; Windows is not claimed until Task 5 native evidence. Commit production/generated files and their direct tests together with: `fix(runtime): preserve descriptor ownership across native I/O`.

### Task 4: Migrate every direct worker fixture to the descriptor contract

**Files:**
- Modify: `compiler/crates/beskid_engine/tests/fixtures/external_wait.c`
- Modify: `compiler/crates/beskid_abi/tests/fixtures/external_owner_transport.c`
- Modify: their existing Rust owning targets only as required for descriptor fixture setup/assertions

**Interfaces:**
- Consumes: Task 3's sole descriptor admission path.
- Produces: direct worker tests that submit UCRT/POSIX descriptors and prove no `HANDLE` encoding branch remains.

- [ ] **Step 1: Add a fixture-level descriptor producer red test**

  Replace Windows `CreatePipe` plus `(int32_t)(intptr_t)HANDLE` with CRT `_pipe` descriptors in binary mode. Require the setup helper to return `int32_t` descriptors, and assert both real endpoints have expected data before entering the runtime.

- [ ] **Step 2: Remove all dual interpretation paths**

  Delete fixture casts that turn `HANDLE` into an `int32_t` worker descriptor. `external_owner_transport` must use the same descriptor setup for every worker-read scenario; it may retain Win32 handles only for fixture threads/events unrelated to descriptor I/O.

- [ ] **Step 3: Add lifecycle probes to the owning tests**

  Coordinate admission before closing/rebinding the caller descriptor, then complete the original operation. Assert no stale wake, managed copy into a reused result, or leaked duplicate after completion/cancellation/queue rejection/shutdown. Do not rely on sleeps or timing guesses.

- [ ] **Step 4: Run focused regressions and commit**

  Run:

  ```sh
  cargo test -p beskid_engine --test external_wait_native -- --nocapture --test-threads=1
  cargo test -p beskid_abi --test external_owner_transport -- --nocapture --test-threads=1
  ```

  Expected: exact existing semantic markers survive; there is one descriptor contract. Commit with: `test(runtime): use descriptor-backed native worker fixtures`.

### Task 5: Execute the supported-target native matrix and close the evidence gap

**Files:**
- Modify: `openspec/changes/beskid-v0-5-foundations/design.md` evidence matrix/status only after all listed cells execute
- Modify: `openspec/changes/beskid-v0-5-foundations/tasks.md` completion markers only after all listed cells execute
- Modify: `CHANGELOG.md` with a Keep a Changelog entry after implementation and evidence are both complete

**Interfaces:**
- Consumes: Tasks 1–4, exact debug/release runtime kits, and the separate Task 10 JIT availability status.
- Produces: evidence that distinguishes proven cells, unavailable cells, and the independent Windows JIT relocation blocker.

- [ ] **Step 1: Record nonzero discovery on each native host**

  Run:

  ```sh
  cargo test -p beskid_engine --test foundation_io_native -- --list
  cargo test -p beskid_engine --test external_wait_native -- --list
  cargo test -p beskid_abi --test external_owner_transport -- --list
  ```

  Expected: named foundation syscall and direct worker cases are present on macOS, Linux, and Windows. A `cfg(unix)` zero-test binary is an open failure, never a pass.

- [ ] **Step 2: Run JIT, static, and shared native evidence per host**

  Execute the full `foundation_io_native`, `external_wait_native`, and `external_owner_transport` targets with bounded children. Record revision, target, tool versions, kit metadata/hash, artifact/import-library identities, command, case count, stdout/stderr, and exit status. Run Windows emitted executable evidence with redirected stdin/stdout in addition to hosted drivers.

- [ ] **Step 3: Audit imports and target UCRT sharing**

  Inspect actual COFF imports and runtime-kit audit metadata. Require the selected dynamic UCRT plus only manifest-authorized descriptor symbols; do not remove `ReadFile`/`WriteFile` imports used by unrelated services. Require the runtime, host, and descriptor producer to use the supported shared application UCRT.

- [ ] **Step 4: State the separate Task 10 result accurately**

  If the stable Cranelift monitor predicate remains unmet, record the Windows source-JIT relocation cell as blocked/unavailable, not passed by static/shared success. Do not ship an RC, reduce test coverage, or replace source JIT with a C callback.

- [ ] **Step 5: Validate, review, and commit evidence atomically**

  Run:

  ```sh
  pnpm exec openspec validate beskid-v0-5-foundations --strict --no-interactive
  pnpm run openspec:validate
  git diff --check
  ```

  Expected: all normative and repository validation passes. Commit evidence/status/changelog only after an independent review; do not run `just corelib` or `just replace` unless explicitly scheduled as final integration.

## Self-Review

- Spec coverage: Task 1 owns every new SHALL/MUST and resolves the partial-write and text-read guard conflicts. Tasks 2–4 implement and test the source guard, one worker lifecycle, generated ABI, and all existing direct consumers. Task 5 owns supported-target evidence without laundering the independent JIT blocker.
- Placeholder scan: no deferred-scope marker is used as a task action; every task names files, seams, commands, expected outcomes, and a commit boundary.
- Type consistency: public `Descriptor::Raw(i64)` remains source-facing; `CheckedDescriptor` produces internal `i32`; byte service remains `(i32, pointer, usize) -> i64`; request-owned duplicate is private worker state.
- Review focus: Task 2 owns range/binary/EOF inputs; Task 3 owns boundary/invalid-handler/partial-transfer behavior; Task 4 owns cancellation and reuse; Task 5 owns real emitted executable/UCRT sharing and truthfully records Task 10.

## Execution Handoff

Use subagent-driven development: review Task 1 before any code task, then use a fresh implementer and independent reviewer for each following task. Keep the normal compiler work isolated from unrelated root worktree changes, and keep all Windows credentials/configuration out of reports and commits.
