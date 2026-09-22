# F4-W Windows-native external-wait acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing external-wait conformance fixture run natively on `x86_64-pc-windows-msvc`, through the same static, shared-kit, and JIT-callback routes already accepted on macOS/Linux.

**Architecture:** Retain one Rust integration target and one C fixture. A small platform adapter hides only fixture plumbing (threads, barrier, anonymous pipes, handles, exports); all scheduler assertions, race cases, timer cases, capacity/reuse cases, and shutdown cases remain shared. The Rust parent compiles exact-kit artifacts and runs each route in a deadline-bounded child, including a self-spawned JIT callback child, so no native fixture hang can consume the test process or the whole CI job.

**Tech Stack:** Rust integration tests and `std::process`, C11, Win32 (`SRWLOCK`, condition variables, `_beginthreadex`, anonymous pipes), LLVM `clang` targeting MSVC, ABI-v5 runtime kits, Cranelift JIT, Woodpecker Windows runner.

**Spec:** `openspec/changes/beskid-v0-5-foundations/specs/execution--runtime--fiber-scheduler-and-stacks/spec.md` (`BSP-REQ-6CF93216D4C9`, `BSP-REQ-52284EABE5E1`, `BSP-REQ-896BA6C917E9`, `BSP-REQ-A0D58F1B3E21`) and `openspec/changes/beskid-v0-5-foundations/design.md` F4-W gate; research: `compiler-v05-foundations-runtime/docs/research/2026-09-21-f4-w-windows-native-acceptance-research.md`.

## Global Constraints

- Preserve one owner scheduler, its inbound command queue, its timer heap, and its one atomic external-wait winner; this is acceptance plumbing only, never a second runtime or Core.IO path.
- Keep exactly one `external_wait_native` integration target and one `external_wait.c` fixture. Do not fork Windows behavior, copy scheduler assertions, or use an emulation layer.
- Support only native `x86_64-pc-windows-msvc`, existing native Linux x86_64, and native macOS ARM64. Do not promise Windows/GNU, cross compilation, or other architectures through a broad `cfg(windows)`.
- Build a fresh canonical ABI-v5 debug kit via `build_native_host`; static mode links `static_library`, while shared executable and fixture DLL link only `shared_import_library`, never `shared_library`/DLL as a linker input.
- Runtime-kit selection remains `prefix + metadata + artifact hashes`. Never use `PATH`, a loader fallback, or an ambient DLL to choose a runtime kit.
- Use `clang --target=x86_64-pc-windows-msvc -std=c11` after the repository-standard VS 2022 x64 `VsDevCmd.bat -arch=x64 -host_arch=x64` activation. Do not create an independent `cl.exe` path.
- Every static/shared success and deadlock route, plus JIT callback route, executes under one Rust child-process deadline. The outer CI phase timeout is a second guard, not the only guard.
- Preserve actual nonzero work evidence: static/shared success output must retain `matrix=600`, capacity, and timer-order markers; deadlock must return `101` with `beskid runtime trap v5`; JIT must call the real exported fixture entry.
- The frozen syscall transport remains signed `i32`; Windows handle conversion is explicit and restricted to this ABI seam. Do not rename, widen, or generalize it to arbitrary pointers.
- Child environment overrides are scoped to `Command`; never mutate the Rust test process globally. Dynamic fixture loading uses an absolute path and constrained Windows search flags.
- Factor the Windows developer environment once for Woodpecker release and acceptance uses; do not duplicate the long `VsDevCmd` import recipe.
- Keep all existing Unix acceptance behavior green. Unix-only zero-test output is a readiness failure, not a pass.
- No merge, push, publication, production `DynamicLibrary` behavior change, or guest persistent configuration change is part of this plan.

## Review Focus

- Shared executable links the COFF import library and runs only beside the metadata-validated kit DLL; a DLL-as-link-input or `PATH` fallback must fail the test.
- Fixture C barriers retain predicate-loop semantics around spurious/stolen Windows condition-variable wakes; the 600-case foreign-thread phase must remain real.
- A timeout kills and reaps the child, emits route/stdout/stderr evidence, and cannot leave the JIT fixture executing in the parent test process.
- The `i32` Windows pipe-handle conversion round-trips only through `syscall_read_bytes`; pipe ends and thread handles are closed on every fixture path.
- CI activates MSVC/SDK variables once and executes the focused native test on trusted pushes, manual validation, and tag packaging; release builds cannot silently bypass the F4-W cell.

---

## File structure and seams

| File | Responsibility | Interface it owns |
| --- | --- | --- |
| `compiler/crates/beskid_engine/tests/fixtures/external_wait.c` | One shared scheduler conformance program; platform-private C adapter only hides test thread, barrier, pipe, close, and export details. | `int RunExternalWaitFixture(TryComplete complete, int deadlock)` plus standalone `main`. |
| `compiler/crates/beskid_engine/tests/external_wait_native.rs` | One native-host harness that builds exact-kit fixture artifacts, starts bounded routes, and invokes the JIT callback. | `owner_routed_waits_and_deadlines_have_one_winner()` and child-only marker protocol. |
| `scripts/ci/windows-native-env.sh` | One Bash helper that imports VS x64/MSVC/SDK/LLVM environment for Windows jobs. | `source scripts/ci/windows-native-env.sh`; success guarantees `cargo`, `clang.exe`, `llvm-ml.exe`, `link.exe`, `lib.exe`. |
| `.woodpecker/windows.yml` | Windows release and focused compiler acceptance scheduling. | Reused environment helper and a bounded F4-W test step. |
| `scripts/ci/test/woodpecker-windows-acceptance.test.mjs` | Static contract test for the Windows workflow/helper relationship. | Test asserts activation ownership, event policy, focused command, and no duplicated inline `VsDevCmd` recipe. |

The compiler is a linked Git worktree/submodule checkout, while Woodpecker and OpenSpec files belong to the superproject. Tasks 1–7 commit only in `compiler-v05-foundations-runtime`. Before Task 8, create an isolated **superproject** worktree from its recorded base and branch (for example `codex/f4-w-windows-ci`); never edit or stage the user's dirty `/Users/mikserek/Projects/beskid` checkout. Task 8 commits only root CI files there. Task 9 creates one compiler evidence commit and, separately, a root OpenSpec status commit in that isolated superproject worktree. A later integration operation updates the superproject compiler gitlink only after the compiler commit is reachable by the configured submodule remote; this plan neither pushes nor merges.

### Task 1: Preserve one C fixture while replacing only Unix test plumbing

**Files:**
- Modify: `compiler/crates/beskid_engine/tests/fixtures/external_wait.c`
- Test: `compiler/crates/beskid_engine/tests/external_wait_native.rs`

**Interfaces:**
- Consumes: existing `TryComplete`, `RunExternalWaitFixture`, ABI-v5 `syscall_read_bytes(i32, ...)`, existing race/capacity/timer assertions.
- Produces: an unchanged fixture entry contract that compiles as one standalone executable or one shared fixture library on all three supported native hosts.

- [ ] **Step 1: Add the failing Windows C compilation route to the Rust harness**

  Extend the existing harness host predicate to include only:

  ```rust
  #![cfg(any(
      all(target_os = "linux", target_arch = "x86_64"),
      all(target_os = "macos", target_arch = "aarch64"),
      all(target_os = "windows", target_arch = "x86_64", target_env = "msvc"),
  ))]
  ```

  On the Windows guest, run the existing exact test before touching C:

  ```text
  cargo test -p beskid_engine --test external_wait_native \
    owner_routed_waits_and_deadlines_have_one_winner -- --exact --nocapture --test-threads=1
  ```

  Expected: FAIL at C compile because `unistd.h`, pthread symbols, `pipe`, and `alarm` are not available. Record that error in the task report; do not introduce a Windows-only fixture.

- [ ] **Step 2: Define private cross-platform fixture primitives at the top of `external_wait.c`**

  Keep existing Unix includes/types under `#ifndef _WIN32`. Under `_WIN32`, include `windows.h`, `process.h`, and define private wrapper types/functions with the same fixture-local operations:

  ```c
  typedef SRWLOCK FixtureMutex;
  typedef CONDITION_VARIABLE FixtureCondition;
  typedef HANDLE FixtureThread;
  #define FIXTURE_MUTEX_INIT SRWLOCK_INIT
  #define FIXTURE_CONDITION_INIT CONDITION_VARIABLE_INIT

  static void fixture_lock(FixtureMutex *lock);
  static void fixture_unlock(FixtureMutex *lock);
  static void fixture_wait(FixtureCondition *condition, FixtureMutex *lock);
  static void fixture_signal(FixtureCondition *condition);
  static void fixture_thread_start(FixtureThread *thread, unsigned (__stdcall *entry)(void *), void *argument);
  static void fixture_thread_join(FixtureThread thread);
  static void fixture_pipe_open(int32_t descriptors[2]);
  static void fixture_pipe_write(int32_t descriptor, const void *bytes, DWORD count);
  static void fixture_pipe_close(int32_t descriptor);
  ```

  Windows `fixture_wait` MUST call `SleepConditionVariableSRW(..., INFINITE, 0)` while callers retain their existing `while (!publish)` loops. `fixture_thread_start` MUST use `_beginthreadex`; `fixture_thread_join` MUST require `WaitForSingleObject(thread, INFINITE) == WAIT_OBJECT_0` then `CloseHandle(thread)`; `fixture_pipe_open` MUST use `CreatePipe`, explicitly cast each HANDLE through `(int32_t)(intptr_t)`, and fail on `INVALID_HANDLE_VALUE`/`NULL`; write/close use `WriteFile`/`CloseHandle`. Unix wrappers simply call the existing pthread/pipe/write/close operations and preserve their assertions.

- [ ] **Step 3: Replace fixture call sites mechanically through those primitives**

  Replace only the fixture-plumbing call sites:

  ```c
  pthread_mutex_lock(&barrier_lock)          -> fixture_lock(&barrier_lock)
  pthread_cond_wait(&barrier_ready, ...)    -> fixture_wait(&barrier_ready, &barrier_lock)
  pthread_cond_signal(&barrier_ready)       -> fixture_signal(&barrier_ready)
  pthread_create / pthread_join             -> fixture_thread_start / fixture_thread_join
  pipe / write / close                      -> fixture_pipe_open / fixture_pipe_write / fixture_pipe_close
  ```

  Keep all `while (!publish)`, scheduler calls, expected sources, `matrix=600`, derived capacity layout expression, stale token/handle assertions, and `RunExternalWaitFixture` call ordering byte-for-byte except for wrapper names. Delete `alarm(3)` / `alarm(0)` calls rather than replacing them in C; Rust owns route containment uniformly.

  Add a conditional export macro immediately before the fixture entry:

  ```c
  #ifdef _WIN32
  #define EXTERNAL_WAIT_EXPORT __declspec(dllexport)
  #else
  #define EXTERNAL_WAIT_EXPORT
  #endif

  EXTERNAL_WAIT_EXPORT int RunExternalWaitFixture(TryComplete complete, int deadlock) {
  ```

  Do not modify production ABI `external_wait.h`, worker-pool thread creation, scheduler sources, or Core.IO.

- [ ] **Step 4: Verify Unix regression before Windows execution**

  From the compiler worktree run:

  ```text
  cargo test -p beskid_engine --test external_wait_native \
    owner_routed_waits_and_deadlines_have_one_winner -- --exact --nocapture --test-threads=1
  ```

  Expected: PASS on the native Unix host with static/shared/JIT output retaining `matrix=600`, `capacity=`, `case=timer-winner`, `case=pump-command`, and `case=pump-equal`. Compile the fixture under the existing warning policy (or direct `clang -Wall -Wextra -Werror` when available) and require no warnings.

- [ ] **Step 5: Commit the isolated fixture-port change**

  ```text
  git add crates/beskid_engine/tests/fixtures/external_wait.c crates/beskid_engine/tests/external_wait_native.rs
  git commit -m "test(runtime): port external-wait fixture primitives"
  ```

### Task 2: Make every native route exact-kit and killable

**Files:**
- Modify: `compiler/crates/beskid_engine/tests/external_wait_native.rs`
- Test: `compiler/crates/beskid_engine/tests/external_wait_native.rs`

**Interfaces:**
- Consumes: Task 1 `RunExternalWaitFixture`; `RuntimeKitProfile::Debug`; `JitRuntimeKit::load(prefix, target, BuildProfile::Debug)`.
- Produces: platform-private compile/load adapters plus `run_bounded` that every executable and JIT route uses.

- [ ] **Step 1: Add a failing child-marker test path**

  Split the existing test into an unmarked parent and a marker-selected child operation. Reserve private environment names:

  ```rust
  const CHILD_MODE: &str = "BESKID_EXTERNAL_WAIT_CHILD_MODE";
  const CHILD_PREFIX: &str = "BESKID_EXTERNAL_WAIT_CHILD_PREFIX";
  const CHILD_FIXTURE: &str = "BESKID_EXTERNAL_WAIT_CHILD_FIXTURE";
  ```

  The unmarked parent must assert that setting a deliberately unsupported marker causes a deterministic panic naming the marker value. The marked JIT child must run only the JIT fixture call, not recursively spawn itself. Initially wire the parent to request `jit` before its child handler exists; expected RED is a clear unsupported-mode error rather than an in-process hang.

- [ ] **Step 2: Introduce target-private artifact and compiler selection**

  Add small functions, not a public test framework:

  ```rust
  fn fixture_suffix() -> &'static str;
  fn executable_suffix() -> &'static str;
  fn fixture_compiler() -> Command;
  fn compile_standalone(root: &Path, output: &Path, library: &Path) -> Output;
  fn compile_fixture_library(root: &Path, output: &Path, import_library: &Path) -> Output;
  ```

  Unix retains `cc`, `-lpthread`, and existing platform shared flags. Windows uses `clang`, `--target=x86_64-pc-windows-msvc`, `-std=c11`, `-DEXTERNAL_WAIT_STANDALONE`, ABI include path, and `.exe`/`.dll` outputs. It links static standalone to `kit.static_library`; native-kit standalone and fixture DLL to `kit.shared_import_library.as_ref().expect("Windows ABI-v5 kit must contain a COFF import library")`. Do not pass `-fPIC`, `-lpthread`, `-lm`, Unix dynamic-library suffixes, or the kit DLL to the Windows linker.

- [ ] **Step 3: Implement one bounded subprocess helper and use it for all standalone cases**

  Add:

  ```rust
  fn run_bounded(label: &str, command: &mut Command, limit: Duration) -> Output;
  ```

  It must configure `stdin(Stdio::null())`, `stdout(Stdio::piped())`, and `stderr(Stdio::piped())`; poll `try_wait` with a short `sleep`; on deadline call `kill`, then `wait`, collect both streams, and panic with label, limit, exit status, stdout, and stderr. On ordinary completion, collect streams before assertions. Do not use `Command::output()` for a route that can hang.

  Run static success, native-kit success, static deadlock, and native-kit deadlock through it with a 60-second per-route limit. The static success must not set a loader variable. For Unix shared mode, set only the existing platform loader variable to the exact kit directory. For Windows, copy/co-locate `kit.shared_library` beside the shared executable in a unique test-owned directory; do not set `PATH` as a runtime selector.

- [ ] **Step 4: Implement constrained fixture library loading**

  Keep Unix `dlopen`/`dlsym`/`dlclose` behind `#[cfg(unix)]`. Under the exact Windows target, add a private loader:

  ```rust
  unsafe fn load_fixture(path: &Path) -> (HMODULE, unsafe extern "system" fn(TryComplete, i32) -> i32);
  ```

  Convert the absolute UTF-16 path with `encode_wide().chain(Some(0))`; call `LoadLibraryExW` with `LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR | LOAD_LIBRARY_SEARCH_DEFAULT_DIRS`; include `GetLastError()` and the path in failure diagnostics; resolve exactly `b"RunExternalWaitFixture\\0"` via `GetProcAddress`; and always `FreeLibrary` after the call. Load `JitRuntimeKit` first so its validated absolute kit DLL remains alive. Do not change production `DynamicLibrary::open` in this task.

- [ ] **Step 5: Put the JIT callback in the bounded self-spawn child**

  The parent prepares the fresh prefix and fixture absolute path, then invokes:

  ```text
  <current test executable> owner_routed_waits_and_deadlines_have_one_winner --exact --nocapture --test-threads=1
  ```

  with `CHILD_MODE=jit`, `CHILD_PREFIX=<absolute prefix>`, and `CHILD_FIXTURE=<absolute fixture path>` through `run_bounded("jit callback", ..., Duration::from_secs(60))`. The child reconstructs `JitRuntimeKit`, defines the actual Cranelift forwarding function for `beskid_rt_v5_external_try_complete`, loads the fixture through the platform-private loader, calls `RunExternalWaitFixture`, and returns zero. Parent asserts zero and reports child stderr. Never allow a JIT hang inside the unmarked libtest process.

- [ ] **Step 6: Run the focused route test and the affected typed-Sleep regression**

  Run on native Unix first and Windows guest after VS activation:

  ```text
  cargo test -p beskid_engine --test external_wait_native \
    owner_routed_waits_and_deadlines_have_one_winner -- --exact --nocapture --test-threads=1
  cargo test -p beskid_engine --test fiber_value_transfer \
    source_timer_sleep_has_typed_outcomes_and_owned_registration -- --nocapture
  ```

  Expected: focused fixture PASS across static, shared kit, and child JIT; deadlocks terminate with `101` and intended trap diagnostic; every timeout diagnostic identifies its route; typed Sleep remains PASS.

- [ ] **Step 7: Commit exact-kit and containment behavior**

  ```text
  git add crates/beskid_engine/tests/external_wait_native.rs
  git commit -m "test(engine): contain native external-wait routes"
  ```

### Task 3: Restore the canonical Windows runtime-library provider

**Files:**
- Modify: `compiler/crates/beskid_abi/assembly/x86_64-pc-windows-msvc/platform_host.c`
- Modify: `compiler/runtime_manifest.bsol`
- Modify: manifest-generated/provider assertion files selected by the existing manifest test generator
- Test: `compiler/crates/beskid_abi/tests/runtime_bootstrap_contract.rs`
- Test: existing runtime-manifest freshness/provenance tests

**Interfaces:**
- Consumes: ABI-v5 Windows intrinsic declaration for `memset`; canonical host-emitter external-library list.
- Produces: the sole Windows provider declaration for the emitted C `memset` reference, resolving it through `VCRUNTIME140.dll` without a runtime-private shim or Unix change.

- [ ] **Step 1: Capture the failing canonical Windows DLL link before editing**

  In the ephemeral Windows workspace after VS x64 activation, run the existing native-kit build path used by `build_native_host`. Expected: the no-entry canonical DLL link fails with `undefined symbol: memset` from `beskid_runtime.platform_host.obj`; retain the failing provider assertion that records `memset library=ucrt`. Do not add `-lvcruntime` to a test command as a workaround.

- [ ] **Step 2: Correct the two canonical ownership declarations**

  In Windows `platform_host.c`, add the platform linker directive for `vcruntime.lib` adjacent to the existing Windows system-library directives. In `runtime_manifest.bsol`, change only the Windows `memset` import's provider from `ucrt` to `vcruntime`. Do not add a C/Rust `memset` implementation, alter Unix declarations, widen an ABI, or add a second linking path.

- [ ] **Step 3: Regenerate and assert provenance**

  Run the repository's manifest generation/verification command used by the existing ABI manifest tests. Update only generated artifacts that are direct outputs. Extend the provider test so `memset` asserts `vcruntime` on Windows and fails if it regresses to `ucrt`; retain existing target-specific provider assertions.

- [ ] **Step 4: Prove the actual provider, then rebuild both kit profiles**

  On the Windows guest, compile the canonical platform object and build debug and release native kits. Require both static library plus runtime DLL/import-library triplet. Inspect imports with the available PE tool and require exactly the expected VCRuntime `memset` import; do not accept an ambient object or test-only library. Run the focused bootstrap/manifest tests on the native target.

- [ ] **Step 5: Commit the production provider fix**

  ```text
  git add crates/beskid_abi/assembly/x86_64-pc-windows-msvc/platform_host.c runtime_manifest.bsol <direct manifest outputs and provider tests>
  git commit -m "fix(abi): link Windows memory intrinsic provider"
  ```

### Task 4: Extend the existing reusable native-test harness from the reviewed external-wait harness

**Files:**
- Modify: `compiler/crates/beskid_tests_support/Cargo.toml`
- Modify: `compiler/crates/beskid_tests_support/src/lib.rs`
- Create: `compiler/crates/beskid_tests_support/src/native_harness.rs`
- Modify: `compiler/Cargo.toml` workspace members only if the existing crate is not already a member
- Modify: `compiler/crates/beskid_engine/Cargo.toml` dev-dependencies
- Modify: `compiler/crates/beskid_abi/Cargo.toml` dev-dependencies
- Modify: `compiler/crates/beskid_engine/tests/external_wait_native.rs`
- Test: existing `external_wait_native` exact test

**Interfaces:**
- Consumes: reviewed Task 2 target rules and exact-kit artifact role inputs.
- Produces: one `beskid_tests_support::native_harness` module for suffixes, native C compiler configuration, bounded child execution, and app-local shared-DLL placement; engine-specific dynamic symbol loading remains local to engine tests.

- [ ] **Step 1: Write focused support tests before extraction**

  Add unit tests for `supported_native_host`, executable/shared suffix selection, timeout kill/reap diagnostic retention, and simultaneous stdout/stderr draining. The timeout test self-spawns its executable and writes distinct markers; it must complete below its cap after the child is killed. Expected RED: symbols are absent.

- [ ] **Step 2: Define the minimal shared interface**

  Implement only:

  ```rust
  pub fn supported_native_host() -> bool;
  pub fn executable_name(stem: &str) -> OsString;
  pub fn shared_library_name(stem: &str) -> OsString;
  pub fn native_c_compiler() -> Command;
  pub fn run_bounded(label: &str, command: &mut Command, limit: Duration) -> Output;
  pub fn place_shared_runtime(executable_dir: &Path, shared_library: &Path) -> PathBuf;
  ```

  `native_c_compiler` selects `cc` on existing Unix hosts and, on exact Windows MSVC, exactly `clang --target=x86_64-pc-windows-msvc -std=c11 -fms-runtime-lib=dll -Wl,/NODEFAULTLIB:libcmt`. A DLL caller adds only `-shared`; no caller passes CRT/provider libraries or selects `dll_dbg`. This is the hosted-consumer policy that avoids the non-CL driver's static `libcmt` default conflicting with the canonical source-owned `vcruntime.lib`; it MUST NOT affect the production no-entry runtime DLL link. `run_bounded` owns null stdin, concurrent stream readers, `try_wait`, kill, reap, and complete diagnostics. `place_shared_runtime` copies only the metadata-selected DLL into a unique owned route directory on Windows; Unix callers keep their existing loader-variable branch. No runtime-kit resolver, JIT loader, ABI symbol type, or production dependency moves into support.

- [ ] **Step 3: Move Task 2 generic helpers without behavior drift**

  Replace local suffix/compiler/bounded-route/app-local-copy code in `external_wait_native.rs` with the support interface. Retain local exact host crate predicate and engine-private Unix/Windows fixture loader, JIT function construction, artifact-role selection, child marker protocol, and all assertions. The resulting test output must retain every existing capacity/matrix/timer/deadlock marker.

- [ ] **Step 4: Verify helper and external-wait regressions**

  ```text
  cargo test -p beskid_tests_support native_harness -- --nocapture
  cargo test -p beskid_engine --test external_wait_native owner_routed_waits_and_deadlines_have_one_winner -- --exact --nocapture --test-threads=1
  ```

  Expected: all helper tests and static/shared/JIT fixture routes pass on Unix. On native Windows Clang 22, compile/run the external-wait static executable, shared executable, and callback DLL; audit their PE imports to require the dynamic CRT model plus the canonical `VCRUNTIME140.dll!memset` provider, with no `libcmt` collision. Supported Windows host selection remains nonzero once Task 3 kit build is green.

- [ ] **Step 5: Commit the extraction**

  ```text
  git add Cargo.toml crates/beskid_tests_support crates/beskid_engine/Cargo.toml crates/beskid_abi/Cargo.toml crates/beskid_engine/tests/external_wait_native.rs
  git commit -m "test: share native fixture harness"
  ```

### Task 5: Repair Windows context continuation relocations

**Files:**
- Modify: `compiler/crates/beskid_abi/assembly/x86_64-pc-windows-msvc/context.asm`
- Modify: `compiler/crates/beskid_abi/tests/x86_64_windows_context_assembly.rs`
- Test: `compiler/crates/beskid_abi/tests/x86_64_windows_context_assembly.rs::windows_x64_context_enters_entry_and_return_trampoline_with_abi_aligned_stack`
- Test: `compiler/crates/beskid_engine/tests/external_wait_native.rs`

**Interfaces:**
- Consumes: the x64 Windows context frame and `context_return`/`context_resume` continuation labels.
- Produces: full-width, ASLR-safe continuation addresses for ordinary fiber return and resume without touching scheduler policy, CRT configuration, or fixture semantics.

- [ ] **Step 1: Preserve the deterministic native red cases**

  On the Windows guest run the existing native ABI context test and the exact external-wait test. Expected: context test fails and static/shared fixture routes exit `0xC0000005` after the C fiber entry returns. Use the diagnostic report's C-only control only as supporting evidence; do not retain it as production test infrastructure.

- [ ] **Step 2: Add an object-relocation regression before changing assembly**

  Extend the existing Windows context-object test to inspect relocations for both continuation-address materializations. It MUST reject `IMAGE_REL_AMD64_ADDR32`/any truncating absolute relocation for `context_return` and `context_resume`, and require the repository-supported RIP-relative 64-bit address materialization. The test's failure must name both labels and relocation kinds.

- [ ] **Step 3: Replace both address materializations with ASLR-safe form**

  In `context.asm`, replace only the two `lea` forms that currently materialize `context_return` and `context_resume` as absolute 32-bit addresses with the MASM/llvm-ml RIP-relative form that emits a full-width image-relative continuation address. Preserve the ABI frame offsets, register restores, `sub rsp, 8`, return/trampoline order, labels, and all non-Windows context assembly unchanged. Do not hard-code an image base, disable ASLR, or route return through scheduler/CRT code.

- [ ] **Step 4: Prove object, context, and full fixture green on native Windows**

  Build the object at normal ASLR settings and require the relocation test green. Run the native context test, then exact external-wait acceptance. Require static/shared/JIT success markers, capacity/matrix/timer evidence, and static/shared deadlock status `101` with the intended trap diagnostic. A low-image-base link control is no longer acceptance evidence after the repair.

- [ ] **Step 5: Run Unix regressions and commit the single repair**

  ```text
  cargo test -p beskid_abi --test x86_64_windows_context_assembly \
    windows_x64_context_enters_entry_and_return_trampoline_with_abi_aligned_stack -- --exact --nocapture --test-threads=1
  cargo test -p beskid_engine --test external_wait_native owner_routed_waits_and_deadlines_have_one_winner -- --exact --nocapture --test-threads=1
  git add crates/beskid_abi/assembly/x86_64-pc-windows-msvc/context.asm crates/beskid_abi/tests/x86_64_windows_context_assembly.rs
  git commit -m "fix(abi): preserve Windows context continuation addresses"
  ```

### Task 6: Port all Engine source and production-validation routes

**Files:**
- Modify: `compiler/crates/beskid_engine/tests/fiber_value_transfer.rs`
- Modify: `compiler/crates/beskid_engine/tests/fixtures/timer_validation.c`
- Test: `compiler/crates/beskid_engine/tests/fiber_value_transfer.rs`

**Interfaces:**
- Consumes: Task 3 canonical Windows kit and Task 4 compiler/bounded/process/DLL helpers.
- Produces: one cross-native engine integration target that retains its one lowering/semantic-selection path while exposing all eight named tests on Windows.

- [ ] **Step 1: Establish native Windows discovery RED**

  On Windows run `cargo test -p beskid_engine --test fiber_value_transfer -- --list`. Expected before the change: zero names because the file has `#![cfg(unix)]`. Add a discovery assertion in the test/CI helper that requires exactly the eight names enumerated in the F4-W research report, so a future Unix gate cannot turn the target green with zero tests.

- [ ] **Step 2: Reuse the shared harness rather than copy Task 2 code**

  Replace the crate gate with the exact supported native-host predicate. Replace every local `cc`, suffix, unbounded `output`, shared-DLL link input, and Unix loader branch with Task 4 support and one engine-private typed fixture loader. On Windows, all shared consumers link `kit.shared_import_library.expect(...)`, route executables receive the exact app-local kit DLL, and callback DLLs use absolute `LoadLibraryExW` after the engine has loaded the validated kit. Preserve semantic fact discovery, canonical-source/reachability checks, lowering, layout facts, and public behavior unchanged.

- [ ] **Step 3: Export the one Windows callback entry**

  Add a conditional `__declspec(dllexport)` only to `RunTimerValidation` in `timer_validation.c`; retain all nine records, root handling, fatal statuses, and standalone `main` unchanged. Do not create a timer fixture copy or a second registration path.

- [ ] **Step 4: Keep fatal cases isolated and bounded**

  Convert existing fatal child invocations to Task 4 `run_bounded`, keep their exact filter and add `--test-threads=1`. Require all four statuses (`1`, `2`, `5`, maximum word) to fail in each Engine/static/shared route and include the intended invariant diagnostic. A loader/link crash cannot pass.

- [ ] **Step 5: Run full Unix and Windows acceptance**

  On each native host first require `--list` to contain all eight names, then run the three named F4 tests and full target. Windows must show source result `126` on JIT/static/shared, production validation `engine=9 static=9 shared=9`, and twelve isolated fatal failures with intended diagnostics. Any zero-test, DLL/import-library, loader, or child-timeout result is a fail.

- [ ] **Step 6: Commit the engine port**

  ```text
  git add crates/beskid_engine/tests/fiber_value_transfer.rs crates/beskid_engine/tests/external_wait_native.rs crates/beskid_engine/tests/support/native_fixture.rs crates/beskid_engine/tests/fixtures/timer_validation.c
  git commit -m "test(engine): run source timer acceptance on Windows"
  ```

### Task 7: Port the direct owner-transport fixture without narrowing handles

**Files:**
- Modify: `compiler/crates/beskid_abi/tests/external_owner_transport.rs`
- Modify: `compiler/crates/beskid_abi/tests/fixtures/external_owner_transport.c`
- Test: `compiler/crates/beskid_abi/tests/external_owner_transport.rs`

**Interfaces:**
- Consumes: Task 4 compiler/bounded execution helper and production `assembly/common/external_wait.h`.
- Produces: the same direct owner-wake transport acceptance test on every supported native host, with Windows requests retaining `uintptr_t` native handles.

- [ ] **Step 1: Capture discovery RED and direct C build failure on Windows**

  Require `cargo test -p beskid_abi --test external_owner_transport -- --list` to contain `native_owner_wake_closes_each_park_window_and_routes_only_to_its_owner`. Before the port, record its zero-test Unix gate and the fixture's POSIX compile failure. Do not substitute the public syscall `i32` adapter.

- [ ] **Step 2: Port private fixture adapters only**

  Add `_WIN32` wrappers for SRW lock/condition predicate waits, `_beginthreadex`/wait/close, `GetTickCount64() * 1000000`, `SwitchToThread`, `CreatePipe`/`WriteFile`/`CloseHandle`, and the wait-boundary interception matching the Windows production `SleepConditionVariableSRW` call. Store pipe ends and `request_for` input as `uintptr_t`; retain Unix pthread interception under its branch. Delete C `alarm` calls because Rust owns the route deadline. Preserve the exact 64 iteration, stale-owner, in-flight ownership, allocation, and worker shutdown assertions.

- [ ] **Step 3: Use shared C compiler and bounded runner from Rust**

  Replace the Unix crate predicate, hard-coded `cc -lpthread`, extensionless path, unbounded `.output()`, and manual cleanup with Task 4 support plus RAII temp ownership. Windows uses `clang --target=x86_64-pc-windows-msvc -std=c11` without pthread flags; Unix retains pthread link behavior. Compilation and fixture execution each have bounded failure diagnostics.

- [ ] **Step 4: Run exact native acceptance**

  ```text
  cargo test -p beskid_abi --test external_owner_transport native_owner_wake_closes_each_park_window_and_routes_only_to_its_owner -- --exact --nocapture --test-threads=1
  ```

  Expected: nonzero test discovery and PASS on Unix and Windows through the same production header. Windows evidence must show the 64-iteration race matrix and stale-owner delivery checks, not just compilation.

- [ ] **Step 5: Commit the owner transport port**

  ```text
  git add crates/beskid_abi/tests/external_owner_transport.rs crates/beskid_abi/tests/fixtures/external_owner_transport.c
  git commit -m "test(abi): run owner transport acceptance on Windows"
  ```

### Task 10: Resolve the Windows x64 JIT relocation prerequisite before enabling the CI gate

**Prerequisite ordering:** This task is release-critical for Tasks 8–9, but can run independently of Task 7. Do not enable a Windows acceptance gate that treats the five source-JIT failures as an allowed result.

**Files:**
- Modify (compiler worktree): `Cargo.toml`, `Cargo.lock`, `crates/beskid_codegen/src/cranelift_host.rs`, `crates/beskid_engine/src/jit_module.rs`, and focused existing/new Engine JIT tests.
- Modify (isolated superproject worktree): `openspec/changes/beskid-v0-5-foundations/design.md`, the applicable execution/runtime spec, and `CHANGELOG.md` only when the upgrade/backport lands.

**Interfaces:**
- Consumes: `docs/research/2026-09-21-windows-x64-jit-relocation-overflow-diagnosis.md` and `docs/research/2026-09-21-cranelift-x64-jit-relocation-resolution-design.md`.
- Produces: one stable coherent Cranelift family and one production-JIT ISA policy that supports valid discontiguous x86_64 code/data allocations without allocator-proximity assumptions.

- [ ] **Step 1: Revalidate stable upstream availability and lock the implementation choice**

  Immediately before editing, verify from crates.io and the official Wasmtime tag graph that one stable release contains merge `6901aa7cee056f45015e84a3650dd9850865b735` / #13975, and that identically versioned stable `cranelift-codegen`, `frontend`, `isle`, `jit`, `module`, `native`, and `object` crates exist. Record tag, versions, containment, checksums, and API migration notes. Do not ship `0.136.0-rc.1`; do not select a JIT-only package update or duplicate Cranelift type family.

  If no stable release exists and v0.5 cannot wait, stop for an explicit release-owner decision before a coordinated immutable upstream backport. That backport must carry the exact call-veneer and per-blob-GOT commits plus coupled codegen/object changes, upstream tests, license/provenance, local patch hash, and removal condition. A custom near-allocation provider and a shared-lowering non-colocation rewrite are rejected.

- [ ] **Step 2: Amend the normative JIT architecture before source changes**

  Add SHALL requirements and scenarios: native x86_64 JIT finalization shall support valid discontiguous local branch targets and function/data address materialization without a ±2 GiB allocator-placement precondition; near paths retain correct execution; non-x86 JIT policy remains unchanged. Define the sole authorities: one exact Cranelift family, one production-JIT ISA builder, upstream finalization veneers/GOT, and a test-only forced-far provider. Keep AOT's explicit PIC policy separate.

- [ ] **Step 3: Upgrade the one Cranelift family atomically**

  Change all seven workspace constraints and the lockfile together. Run `cargo tree -d` and reject duplicate `cranelift-*` families. Resolve Engine, Codegen, ISLE, and AOT API fallout as one compatibility migration; do not introduce adapter crates, compatibility aliases, or a second lowering path.

- [ ] **Step 4: Add the JIT-specific x86_64 PIC policy at the correct seam**

  Retain `production_isa_settings_builder`'s shared frame-pointer contract and AOT's current PIC ownership. Extend the authoritative production **JIT** ISA construction so it selects `is_pic=true` only for native x86_64 before `JITBuilder::with_isa`; leave non-x86 JIT policy non-PIC. Test the actual resulting ISA flags. Do not infer this from `JITBuilder::with_flags`.

- [ ] **Step 5: Add deterministic forced-far test support without changing production allocation**

  At the existing Engine JIT-builder seam, install a test-only memory provider that deterministically separates allocations by more than 2 GiB. Cover direct calls, tail jumps, function address identity, data/string/descriptor/static-plan identity, near and far relaxation, executable results, and absence of `TryFromIntError`. The provider is test support only; production remains on Cranelift's standard memory provider.

- [ ] **Step 6: Run the complete compatibility and target matrix**

  Require formatting, workspace/all-target compilation, duplicate-family audit, focused Codegen/ISLE/Engine/AOT suites, verifier/importer/literal/static-plan/closure/array/aggregate coverage, AOT ELF/Mach-O/COFF and ABI-v5 kit bootstrap/manifest/provenance/library-pair checks, and exact debug/release static/shared kit evidence. On x86_64 Linux and Windows run forced-far tests; on Windows QEMU run F4-W discovery plus external-wait, source JIT/static/shared, 9/9/9, twelve-fatal, and owner-transport commands. No `TryFromIntError`, panic, low-address workaround, or fixture-only exception passes this task.

- [ ] **Step 7: Commit atomically and preserve an honest rollback**

  Commit dependency, custom-ISA, forced-far tests, normative design/spec, and changelog evidence together after gates pass. An atomic rollback restores both the seven-crate family and the x86_64 JIT PIC policy; it may never represent the old Windows source-JIT cell as green.

### Task 8: Make the Windows acceptance cell a maintained Woodpecker gate

**Files:**
- Create: `scripts/ci/windows-native-env.sh`
- Modify: `.woodpecker/windows.yml`
- Create: `scripts/ci/test/woodpecker-windows-acceptance.test.mjs`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: Tasks 2–7 native commands and nonzero-discovery contracts, plus Task 10 Windows x64 JIT resolution; existing Windows agent paths and `.woodpecker/windows.yml` contract.
- Produces: one reusable x64 toolchain activation helper and one bounded F4-W matrix validation step, scheduled on trusted pushes, manual validation, and tags.

- [ ] **Step 1: Write a failing workflow contract test**

  Create a Node test that reads `.woodpecker/windows.yml` and `scripts/ci/windows-native-env.sh`. Assert all of the following literal contract points:

  ```js
  assert.match(workflow, /source scripts\/ci\/windows-native-env\.sh/);
  assert.match(workflow, /cargo test -p beskid_engine --test external_wait_native/);
  assert.match(workflow, /owner_routed_waits_and_deadlines_have_one_winner/);
  assert.match(workflow, /cargo test -p beskid_engine --test fiber_value_transfer/);
  assert.match(workflow, /source_timer_sleep_deadline_validation_uses_production_helpers/);
  assert.match(workflow, /source_timer_sleep_invalid_runtime_status_fails_closed/);
  assert.match(workflow, /source_timer_sleep_has_typed_outcomes_and_owned_registration/);
  assert.match(workflow, /cargo test -p beskid_abi --test external_owner_transport/);
  assert.match(workflow, /-- --list/);
  assert.match(workflow, /--exact --nocapture --test-threads=1/);
  assert.match(helper, /VsDevCmd\.bat/);
  assert.match(helper, /-arch=x64 -host_arch=x64/);
  assert.match(helper, /clang\.exe/);
  assert.match(helper, /llvm-ml\.exe/);
  assert.match(helper, /link\.exe/);
  assert.match(helper, /lib\.exe/);
  assert.doesNotMatch(workflow, /vs_env=.*VsDevCmd/);
  ```

  Run `node --test scripts/ci/test/woodpecker-windows-acceptance.test.mjs`. Expected RED: helper, test step, and policy are absent.

- [ ] **Step 2: Factor the existing Windows environment activation into one helper**

  Move the existing exact Rust discovery/provisioning, `VsDevCmd` temporary `.cmd`/`set` import, required variable import (`PATH`/`Path`, `INCLUDE`, `LIB`, `LIBPATH`, `VCINSTALLDIR`, `VCToolsInstallDir`, `WindowsSdkDir`, `WindowsSDKVersion`), LLVM prepend, and tool checks into `scripts/ci/windows-native-env.sh`. Keep all existing fail-closed messages and delete the duplicated block from `build-windows`. The helper must be Bash sourceable and must not provision secrets or change host configuration.

- [ ] **Step 3: Add a bounded focused validation step and event policy**

  In `.woodpecker/windows.yml`, source the helper in both release and validation paths. Add one bounded validation script/step that initializes `compiler` and `beskid_bsol`, first asserts all eight Engine names plus external-wait and owner-transport names from `cargo test ... -- --list`, then runs the six normative commands from Task 8 Step 1. Give every command an outer 20-minute cap using the runner's available timeout command or explicit PowerShell process timeout; each failure names its command and cap. Add `validate-windows-runtime` that invokes this one script rather than duplicating command blocks.

  Schedule the validation step for trusted push, manual `BESKID_TASK == "validate"`, and tag builds; retain release packaging only for tag/manual `BESKID_TASK == "build"`. The validation step MUST NOT publish, upload a release handoff, or request credentials.

- [ ] **Step 4: Verify workflow contract and YAML**

  Run:

  ```text
  node --test scripts/ci/test/woodpecker-windows-acceptance.test.mjs
  pnpm exec prettier --check .woodpecker/windows.yml scripts/ci/windows-native-env.sh scripts/ci/test/woodpecker-windows-acceptance.test.mjs
  ```

  Expected: PASS. Also inspect the evaluated `when` rules: trusted validation does not package/upload; tags validate before package; manual `build` does not accidentally skip validation.

- [ ] **Step 5: Add a precise changelog entry and commit workflow evidence**

  Add an Unreleased `Changed` entry stating that Windows validates the complete F4 native matrix through the validated ABI-v5 kit; do not claim Linux/F7 or release publication. Then commit:

  ```text
  git add .woodpecker/windows.yml scripts/ci/windows-native-env.sh scripts/ci/test/woodpecker-windows-acceptance.test.mjs CHANGELOG.md
  git commit -m "ci(windows): validate native external waits"
  ```

### Task 9: Execute native Windows evidence and close only the F4-W cell

**Files:**
- Modify (compiler worktree): `docs/research/2026-09-21-f4-w-windows-native-acceptance-research.md`
- Modify (isolated superproject worktree): `openspec/changes/beskid-v0-5-foundations/tasks.md`
- Modify (isolated superproject worktree): `CHANGELOG.md` only if a correction to Task 3 wording is necessary

**Interfaces:**
- Consumes: Tasks 1–7 complete native matrix, Task 10 Windows x64 JIT resolution, and Task 8 Windows job contract.
- Produces: target-specific, revision-pinned Windows acceptance evidence without claiming other F4 or F7 cells.

- [ ] **Step 1: Run the focused acceptance command on the configured Windows QEMU guest**

  Use the existing private access configuration without reading or printing secrets. Work only in an ephemeral checkout/workspace for the exact branch revision; activate the repository helper; record the checked-out commit and `rustc -vV`. Run:

  ```text
  cargo test -p beskid_engine --test external_wait_native \
    owner_routed_waits_and_deadlines_have_one_winner -- --exact --nocapture --test-threads=1
  cargo test -p beskid_engine --test fiber_value_transfer \
    source_timer_sleep_deadline_validation_uses_production_helpers -- --exact --nocapture
  cargo test -p beskid_engine --test fiber_value_transfer \
    source_timer_sleep_invalid_runtime_status_fails_closed -- --exact --nocapture
  cargo test -p beskid_engine --test fiber_value_transfer \
    source_timer_sleep_has_typed_outcomes_and_owned_registration -- --nocapture
  cargo test -p beskid_engine --test fiber_value_transfer -- \
    --nocapture --test-threads=1
  cargo test -p beskid_abi --test external_owner_transport -- --nocapture
  ```

  Before those commands, require exact `--list` discovery for eight Engine names, external-wait, and owner transport as Task 8 specifies. Expected: all commands execute nonzero case counts on `x86_64-pc-windows-msvc`; fixture output proves static/shared/JIT success, expected deadlock traps, capacity/reuse, timer ordering, `9/9/9` production validation observations, twelve intended fatal failures, typed source result `126` on three routes, and the owner 64-iteration/stale-owner matrix. A compiler/link/loader failure is a failed cell, never a substitute pass.

- [ ] **Step 2: Capture only reproducible, non-secret evidence**

  Append a dated evidence table to the F4-W research report with commit, target, host toolchain versions, exact-kit metadata/artifact identities, commands, test counts, outcomes, and bounded-route diagnostics. Do not include IP addresses, usernames, SSH commands, filesystem paths outside the workspace, credentials, or raw environment values.

- [ ] **Step 3: Update normative task status conservatively**

  In `openspec/changes/beskid-v0-5-foundations/tasks.md`, mark only the F4-W Windows-native acceptance subtask complete when Step 1 evidence is green. Keep Linux acceptance and F7 supported-target acceptance open. If any command fails, record the exact failed cell and leave the task unchecked.

- [ ] **Step 4: Run final local integrity gates and commit evidence in their owning repositories**

  ```text
  git diff --check
  pnpm exec openspec validate beskid-v0-5-foundations --strict --no-interactive
  ```

  Expected: PASS. In the compiler worktree, commit only the target evidence file:

  ```text
  git add docs/research/2026-09-21-f4-w-windows-native-acceptance-research.md
  git commit -m "test(runtime): record Windows external-wait acceptance"
  ```

  In the isolated superproject worktree, stage only `openspec/changes/beskid-v0-5-foundations/tasks.md` (and `CHANGELOG.md` only if corrected) and commit it separately. Do not stage the compiler gitlink until its commit is reachable by the configured submodule remote; do not merge or push as part of this task.

## Self-review

- Spec coverage: Task 1 preserves the one owner/winner and shared fixture; Task 2 contains exact-kit external wait; Task 3 restores the actual Windows provider; Task 4 removes test-harness drift; Task 5 repairs Windows continuation relocation; Task 6 covers every named Engine source/validation cell; Task 7 covers direct owner transport; Task 10 resolves the Windows JIT prerequisite; Task 8 maintains the Windows CI gate; Task 9 records only target evidence without overclaiming Linux/F7.
- DRY: one fixture per existing contract, one shared `native_harness`, one engine-private loader, one Windows activation helper, and one matrix command script shared by direct guest and CI; no duplicate Core.IO or runtime transport.
- Failure coverage: wrong VCRuntime provider, import-library misuse, loader ambiguity, condition-variable wake behavior, process/JIT hangs, i32-versus-`uintptr_t` handle transport, zero-test discovery, and workflow event drift each have a named task assertion.
- Scope: production runtime loading is intentionally untouched; canonical Windows linker provider is corrected at its ABI manifest/adapter authority, while only disposable fixture DLL loading gets restricted search flags. No release publication, merge, or push is authorized by this plan.
- Placeholder/type scan: all proposed names, artifact roles, target triple, routes, provider, commands, and expected status codes are explicit. Tasks 3–6 own every interface Tasks 7/8 consume.

## Execution Handoff

The user already selected **Subagent-driven** execution and gave standing authorization to continue. Execute this plan through fresh implementer/reviewer pairs and a whole-branch review. Before Task 1, create this plan's SDD ledger and record the following ruling: F4-W validates on trusted pushes plus manual validation and tag builds; production runtime DLL loader hardening remains a separately reviewed follow-up because this plan's constrained loader applies only to a disposable test fixture.
