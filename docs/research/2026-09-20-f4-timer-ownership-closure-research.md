# F4 timer ownership and public sleep closure research

Date: 2026-09-20

Scope: research against the root checkout and the clean
`compiler-v05-foundations-runtime` worktree at `615c1cae`, following F3
disposable-channel acceptance (`e944a4d6`). No compiler, runtime, corelib, or
test implementation was changed or executed for this research. Earlier local
test outcomes below are attributed to the earlier research record, not rerun
results. GitNexus was not used, as explicitly requested for this task.

## Recommendation

Close F4 with a specification-first **public `Core.Time.Sleep(Duration)`
facade and source-level ownership acceptance**, using the existing
`ExternalSleepUntil` registration/park/release path. Retain its monotonic heap,
owner mailbox, generation tokens, and one-winner transition. This is a small
new public contract plus evidence work, not a scheduler rewrite.

The proposed Foundation change already assigns timers to F4 and names Time
`Sleep` tests in its evidence matrix, but it does not specify a public package,
signature, error enum, duration validation, or cancellation result. The earlier
[F1–F4 research](2026-09-20-v05-foundation-f1-f4-next-slice-research.md) correctly
deferred that design until F3 acceptance. The
[closure plan](../superpowers/plans/2026-09-19-beskid-v0-5-closure-rebaseline.md)
contains historical missing-implementation statements that are no longer true
at this compiler revision; its evidence obligations still apply.

Do not add a `Core.IO` timer, `Concurrency.Sleep` alias, public native timer
handle, timer-only runtime, worker-thread sleep, or alternate completion loop.
Do not treat this slice as all of F7: supported-target acceptance remains a
separate release condition.

## Codebase facts

Paths prefixed `C/` refer to `compiler-v05-foundations-runtime/` in this checkout;
the equivalent repository-relative compiler paths are the implementation
targets in the plan below.

| Fact | Primary evidence | Classification and consequence |
| --- | --- | --- |
| Canonical Core.Time specifies distinct clock domains and nanosecond Duration storage; it has no sleep signature. | `openspec/specs/core-library--stability-and-api-shape--core-time/spec.md`, Clock domain separation and Duration nanosecond storage | Existing authority. Add a Core.Time delta under the Foundation change before observable API work. |
| Foundation requires monotonic absolute deadlines, generation-tagged cancellation, owner routing, external-wait accounting, sibling progress, and exactly one completion. | `openspec/changes/beskid-v0-5-foundations/specs/execution--runtime--fiber-scheduler-and-stacks/spec.md`, `BSP-REQ-B206035816D3`, `6CF93216D4C9`, `52284EABE5E1`, `896BA6C917E9`, `A371B8519429` | Already specified runtime invariants, not authority for an invented TimerError shape. |
| Its evidence matrix names Time Sleep tests; tasks 5.2 and 5.5 require timer fixtures and compiling examples. | Foundation `design.md:54`, `tasks.md:33-36` | Public timer acceptance is intended but underspecified. |
| Core.Time already owns `Duration`, `Instant`, clock reads, and duration helpers in foundation. `Concurrency` depends on foundation. | `C/corelib/packages/foundation/src/Core/Time/{Time,Duration,Instant}.bd`; `C/corelib/packages/concurrency/corelib_concurrency.bproj` | Reuse Duration. A foundation runtime builtin does not require foundation to import the concurrency package. |
| `Instant` is only `{ i64 nanos }`, shared by realtime and monotonic constructors; `Time.AddDuration` adds unchecked. | `C/corelib/packages/foundation/src/Core/Time/{Instant,Time}.bd` | A public SleepUntil(Instant) would accept a wall-clock value indistinguishably. Relative Sleep avoids expanding that existing domain-enforcement gap. |
| No public Sleep or TimerError exists in checked-in corelib sources. | Search of `C/corelib/packages`; existing `C/corelib/beskid_corelib/tests/corelib_tests/src/system/TimeTests.bd` | True API and acceptance gap. |
| ExternalSleepUntil rejects a negative deadline or absence of a current fiber with status 0; otherwise it registers, parks, releases, and returns the winner. | `C/runtime/beskid/src/Runtime/Fiber/Scheduler/External.bd:228-237` | Already implemented call-owned lifecycle. Do not imply that an ordinary host/main frame is already a fiber. |
| Registration stores owner, fiber handle, generation, and operation; exactly one registration per fiber is allowed, in a table of 32 slots. | `External.bd:3-7,99-126` | Bounded admission can fail; the public API needs a typed unavailable outcome. The capacity is shared with other external waits, not a separate timer quota. |
| ExternalTryComplete is the atomic claim, timer removal, active-count decrement, and possible wake site. Release later clears the terminal slot. | `External.bd:130-150,218-225` | One terminal outcome and one registration owner; completion and storage release are distinct transitions. |
| Park observes both the persistent fiber flag and published cancellation slot before pumping completions. A completed registration returns without switching stacks. | `External.bd:178-200` | Pending cancellation is seen even before queued cancel processing. A past/zero deadline must not bypass this check in a wrapper. |
| Cancel processing lets an external operation resume its original stack; subsequent waits continue observing cancellation. | `C/runtime/beskid/src/Runtime/Fiber/Scheduler/Queue.bd:59-94`; `External.bd:203-215`; `C/crates/beskid_engine/tests/fixtures/external_cancel_value_transfer.bd` | Sleep cancellation can be returned to its caller; it does not reset or consume the Fiber cancellation state. |
| The scheduler pumps inbound commands and deadlines before choosing runnable fibers, and only waits on the owner primitive when external work remains. | `C/runtime/beskid/src/Runtime/Fiber/Scheduler/Loop.bd:4-79`; `C/runtime/beskid/src/Runtime/Fiber/Fiber.bd`, FiberJoinStatus | Existing progress/liveness integration. No spin wait or native blocking sleep belongs in the facade. |
| Normal shutdown drives owned children; detached contexts are cancelled and not resumed once shutdown starts. ExternalShutdown cleans surviving registrations. | `C/runtime/beskid/src/Runtime/Fiber/Scheduler/Core.bd:628-677`; `External.bd:239-256` | No promise that detached timer code or arbitrary user cleanup runs at shutdown. Registration cleanup is the runtime's obligation. |
| A manifest C export already authorizes external_sleep_until(i64)->usize, but no corresponding source builtin is declared. | `C/runtime_manifest.bsol:208,218`; `C/crates/beskid_analysis/build.rs`; `C/crates/beskid_abi/build.rs` | Add one manifest-owned source binding to that export, preserving its exact ABI. Do not hand-maintain a second signature. |
| The owner-wake transport implements Windows SRW condition waits, macOS relative condition waits, and Linux CLOCK_MONOTONIC condition waits. | `C/crates/beskid_abi/assembly/common/external_wait.h:11-62,131-151` | Target implementations exist. Presence is not target acceptance. |
| Windows monotonic nanos are GetTickCount64 milliseconds multiplied by 1,000,000. | `C/crates/beskid_abi/assembly/x86_64-pc-windows-msvc/platform_host.c:129-131` | Nanosecond units do not promise nanosecond wake precision. |
| The C fixture exercises 600 ordered winner deliveries over three park phases, stale tokens, real sleep, heap removal/order, sibling syscall progress, sticky cancellation, slot reuse, detached shutdown, and true deadlock. | `C/crates/beskid_engine/tests/fixtures/external_wait.c` | Strong existing internal runtime evidence. Pair ordering is deterministic; the foreign-thread park window itself is scheduling-dependent. |
| external_wait_native statically and dynamically links the C fixture, then JIT-compiles a forwarding callback to try_complete. | `C/crates/beskid_engine/tests/external_wait_native.rs:12-105` | Its JIT row proves runtime linking/callback behavior, not public Beskid Sleep lowering. |
| fiber_value_transfer lowers actual Beskid source, executes it through Engine, emits an object, then links it against static and shared native kits. Its cancellation fixture uses raw extern sleep. | `C/crates/beskid_engine/tests/fiber_value_transfer.rs`; `fixtures/external_cancel_value_transfer.bd` | Best existing source-to-JIT/AOT/shared-native seam for a public timer fixture. |
| Both harnesses above, foundation_io_native, and external_owner_transport use `#![cfg(unix)]`. | Corresponding files under `C/crates/{beskid_engine,beskid_abi}/tests/` | Windows currently runs zero tests for these binaries. This is an explicit harness gap, not merely a missing remote run. |

## Proposed public contract and authority

Add an ADDED requirement to
`openspec/changes/beskid-v0-5-foundations/specs/core-library--stability-and-api-shape--core-time/spec.md`
(new delta file), and update that change's design/evidence/tasks. Preserve
canonical `openspec/specs` as the authority after normal change application;
do not silently treat this research as an accepted specification.

Recommended declarations, subject to that normative change:

```beskid
// corelib_foundation, Core.Time hub
pub Core.Results.Result<unit, TimerError> Sleep(Duration duration);

// Core/Time/TimerError.bd
pub enum TimerError {
    InvalidDuration(),
    DeadlineOverflow(),
    Unavailable(),
    Cancelled(),
}
```

Keep the implementation in existing `Core/Time/Time.bd` and the enum in its
own file. This follows the current hub/type-directory layout. TimerError is
distinct from civil-input `TimeError`, `FiberError`, and IO errors because
their recovery actions and authority differ. No error contains a native
handle, generation, errno, scheduler identifier, or raw runtime status.

Define these observable rules before implementation:

1. Reject `duration.nanos < 0` with InvalidDuration before registration.
2. Read the monotonic clock once. A failed/negative clock sample maps to
   Unavailable. Check `duration.nanos > I64_MAX - now` before addition and
   return DeadlineOverflow; never overflow then inspect the result.
3. Pass the absolute `now + duration.nanos` to the one scheduler sleep entry.
   Zero duration still takes that path so already-requested cancellation is
   observed; it is not a fairness/yield promise.
4. Runtime winner `4` (deadline elapsed) maps to `Result::Ok(unit)`;
   winner `3` maps to `Result::Error(TimerError::Cancelled())`; status `0`
   maps to Unavailable. The current status 0 conflates no current fiber,
   invalid registration, and capacity exhaustion. A minimal facade should
   not invent a distinction the runtime cannot establish.
5. Winners `1`/`2` are not valid for a private sleep registration. Any unknown
   status is an invariant failure, following the closed-result validation
   pattern in `Concurrency/Fiber.bd`; it must not be accepted as success.
6. Sleep runs only inside a scheduler-owned fiber. Calling it from an
   ordinary host entry returns Unavailable; examples show `spawn` and Join.
   Main-thread blocking fallback and an implicitly spawned helper are out of
   scope. If main-fiber behavior is desired, specify it as a separate runtime
   entry decision rather than hiding it in Sleep.
7. Completion may occur later than the deadline because of scheduler or OS
   granularity. Do not promise an exact wake time or ordering of equal
   deadlines.

Elapsed sleep is success: a public `Timeout()` error would confuse a timer's
normal completion with a network operation failing its deadline. Network
timeouts can later consume the same registration/winner mechanism with their
own result mapping.

Do not expose `SleepUntil(Instant)` in this minimal slice. The untagged Instant
representation cannot reject wall-clock input as required by clock-domain
separation. A future absolute public API must establish a checked/opaque
monotonic deadline domain first; this is not a reason to duplicate the heap.
The existing internal absolute deadline remains the sole scheduler input.

## Ownership and cancellation invariants

- The suspended Sleep invocation owns one private registration. Its owner
  scheduler owns the mutable record and heap node. The caller never receives
  a timer resource to dispose, clone, detach, reset, or transfer.
- Fully initialized owner/fiber/generation/operation state precedes active
  accounting and any publication. Registration failure contributes no active
  wait and leaks no slot or heap entry.
- `ExternalTryComplete` alone chooses a terminal source. Only its winner
  removes the matching timer and decrements the active count; an obsolete or
  duplicate completion cannot wake a replacement registration.
- Normal and cancellation returns release the terminal registration before
  public Sleep returns. Runtime shutdown owns cleanup when a detached frame
  will never resume. No timer Disposable or Core.IO cleanup conversion is
  necessary.
- Cancellation is sticky on the fiber. Observing TimerError::Cancelled does
  not make the next wait eligible to succeed or consume the Fiber handle.
  The existing Join result remains FiberError::Cancelled when fiber
  cancellation wins; do not rewrite that lifecycle contract.
- Distinguish operation and fiber outcomes: a timer may have already won
  when a cancellation arrives. The call then retains its winning timer
  result; the subsequent fiber cancellation point may still cancel the child.
  No second resume or post-hoc replacement of a wait winner is allowed.
- No cross-thread source edits a fiber or run queue. Sources publish to the
  owner; sibling runnable work continues while the sleeping fiber is parked.
- Timer registration cleanup is not arbitrary resource disposal. If a
  sleeping function uses a separate scoped Disposable, its generated lexical
  cleanup remains the sole cleanup authority. Do not claim timer tests prove
  asynchronous unwinding or cleanup for detached shutdown frames.

## Alternatives and primary-source constraints

| Approach | Benefit | Cost / risk | Decision |
| --- | --- | --- | --- |
| Keep F4 runtime-only and run F7 | No new public API; honest interpretation of current scheduler SHALL requirements | Does not supply the named Time Sleep source example/corelib evidence, and leaves callers using raw extern hooks | Valid only if the release contract explicitly removes that public example obligation |
| Core.Time.Sleep(Duration), call-owned registration | Reuses existing types/runtime; small closed error surface; no new resource ownership object | Must specify no-current-fiber, cancellation, zero duration, and overflow; absolute public deadlines remain unavailable | Recommended 0.5 closure slice |
| Public timer/future/Disposable handle with SleepUntil/reset/cancel | Greater composition and reusable timers | Adds a lifecycle state machine, drop/use semantics, and clock-domain type work without a demonstrated 0.5 need | Defer; implement only on the same scheduler registration service if later required |

Tokio's sleep suspends task work and cancellation drops the returned future
without additional caller cleanup. The relevant lesson is that cancellation
must release the timer registration with its owning operation; a stackful
beskid call has no returned future to drop, so copying that public object
model would add unnecessary ownership. Tokio also documents runtime-context
requirements and platform-dependent granularity. These support explicit
context and precision contracts, not necessarily Tokio's panic policy.
Sources: [Tokio sleep](https://docs.rs/tokio/latest/tokio/time/fn.sleep.html),
[Tokio sleep_until](https://docs.rs/tokio/latest/tokio/time/fn.sleep_until.html).

Rust std::thread::sleep blocks its thread and may overshoot the requested
duration; its documentation directs yield intent to a separate operation.
Use that distinction to reject a blocking implementation and a hidden
Sleep(0)-means-Yield promise in beskid's cooperative scheduler.
Source: [Rust thread::sleep](https://doc.rust-lang.org/std/thread/fn.sleep.html).

Rust's Instant is opaque and monotonic, and checked_add explicitly represents
unrepresentable deadlines. This supports validation before deadline addition
and avoiding an absolute API over beskid's currently untagged Instant. It
does not justify claiming identical suspend-time behavior across platforms.
Source: [Rust Instant](https://doc.rust-lang.org/std/time/struct.Instant.html).

## Staged TDD and acceptance plan

Commands below are planned commands, not results from this research. Run
compiler commands from `compiler-v05-foundations-runtime`; root OpenSpec
commands run from `/Users/mikserek/Projects/beskid`. Before any production
symbol edit, perform the separately required upstream impact analysis.

### 1. Specify the facade and the acceptance boundaries

Edit the new Core.Time delta, Foundation `design.md` and `tasks.md`, and
reconcile the F4/F7 section of the closure plan with current implementations.
Add scenarios for positive/zero/negative duration, overflow, no current fiber,
sticky cancellation, sibling progress, stale generation, slot release, and
static/shared/JIT parity. Name the unavailable Windows harness explicitly.

```sh
pnpm exec openspec validate beskid-v0-5-foundations --strict --no-interactive
```

Do not regenerate the canonical catalog just to pretend an unapplied delta
is already accepted. Run the normal root validation/catalog workflow when
the change's actual integration scope requires it.

### 2. Start with failing source-level API and result tests

Add `crates/beskid_engine/tests/fixtures/timer_value_transfer.bd` and a test
named `source_timer_sleep_has_typed_outcomes_and_owned_registration` to
`crates/beskid_engine/tests/fiber_value_transfer.rs`. Reuse its source lowering
and JIT/static/shared-kit execution helper. Add the existing Core.Time source
closure plus TimerError to its input units; do not create a fake timer
runtime or replace Sleep with a fixture implementation. The first run must
fail on the missing public API, not an unrelated import.

```sh
cargo test -p beskid_engine --test fiber_value_transfer source_timer_sleep_has_typed_outcomes_and_owned_registration -- --nocapture
```

Use fixture-local extern probes solely for active-count observation and
deterministic cancellation orchestration, as existing ownership fixtures do.
The behavior under test calls the real public Sleep. Assert local result
variants inside the cancelled child before a subsequent yield/return; assert
the independent Join cancellation at the parent. A cancelled child's return
value is not an observation channel. Cover:

- invalid duration and exact overflow before registration; zero duration;
- no-current-fiber Unavailable from the host-driven fixture entry;
- positive sleep never completes before its monotonic deadline;
- a runnable sibling makes progress while a timer is active;
- cancelled Sleep returns Cancelled on its own frame and repeated waits
  remain cancelled; a fresh reused fiber can sleep normally;
- active count is zero after each call and repeated calls do not exhaust the
  32 registration slots.

### 3. Add one binding and the thin facade

Edit `runtime_manifest.bsol` to bind one source builtin (suggested name
`__timer_sleep_until`) to the already-exported
`beskid_rt_v5_external_sleep_until(i64)->usize`, using the existing
`soft_builtin` pattern used by `__fiber_yield`. Add TimerError and Sleep in
`corelib/packages/foundation/src/Core/Time/{TimerError,Time}.bd`. Preserve
the generated analysis/ABI authority and exact `word`/`usize` return width;
never reinterpret it as an independently declared i32 status.

Do not modify External.bd unless a focused failing case proves a defect.
Do not add a parallel deadline calculator in the runtime: the facade
validates duration and computes one deadline; ExternalSleepUntil continues
owning registration/park/release.

```sh
cargo test -p beskid_manifest
cargo test -p beskid_abi --test runtime_bootstrap_contract
cargo test -p beskid_engine --test fiber_value_transfer -- --nocapture
```

Build scripts generate analysis builtin and ABI artifacts from the manifest.
Inspect their resulting diff; do not edit generated declarations manually.

### 4. Strengthen the existing ownership/race seams only where needed

Extend `crates/beskid_engine/tests/fixtures/external_wait.c` and its existing
`external_wait_native.rs` harness with admission/release edges absent from
the current fixture: full shared wait capacity rejects safely; released slots
can all be reused; a late cancelled token cannot affect the replacement;
an already-won timer retains its source when cancellation is processed before
the fiber resumes. Keep its synthetic `ExternalPump(now)` clock advancement
for deterministic heap tests; do not introduce a separate fake timer engine.

```sh
cargo test -p beskid_engine --test external_wait_native -- --nocapture
cargo test -p beskid_abi --test external_owner_transport -- --nocapture
```

For capacity tests, use real valid fiber handles and the actual shared wait
table. Do not assume a 33rd fiber can be spawned: the scheduler itself has
bounded storage. A second registration on one fiber already has defined
failure and should be tested independently from total capacity exhaustion.

### 5. Make the public example a maintained corelib contract

Extend `corelib/beskid_corelib/tests/corelib_tests/src/system/TimeTests.bd`
with type/result coverage that fits its existing `SystemTimeTests` target.
That file is already in
`crates/beskid_tests_projects/src/spine/corelib_spine_catalog.rs`. Keep runtime
cancellation/progress proof in the engine fixture where scheduling is
controlled. Document Sleep and its spawn/Join example in
`corelib/beskid_corelib/docs/Core/Time.md`; correct the misleading
"since process start" wording to the runtime's unspecified monotonic epoch.

```sh
cargo test -p beskid_tests_projects system_time_tests_front_end_typechecks -- --ignored --nocapture --test-threads=1
cargo test -p beskid_tests_projects corelib_tests_front_end_typechecks_matrix -- --nocapture --test-threads=1
```

The broad `just corelib` command invokes `just replace`, which rebuilds and
replaces the installed toolchain. It is a final integration gate, not an
innocent read-only unit test. Preserve the explicit installation decision
when executing F7 rather than unexpectedly running it during research.

### 6. Close all promised execution/target cells

For macOS and Linux, run the two engine commands above and owner transport
tests against a native host-built kit from the same revision. Preserve logs,
target, commit, kit identity, executed case count, and actual results. The
earlier F1–F4 research records local macOS passes at `09b8cb5c`; those are
baseline evidence, not public-facade or current Windows evidence.

For Windows, first make the existing harnesses portable:
`crates/beskid_engine/tests/{fiber_value_transfer,external_wait_native}.rs`,
`crates/beskid_engine/tests/fixtures/{fiber_value_transfer,external_wait}.c`,
and `crates/beskid_abi/tests/{external_owner_transport.rs,fixtures/external_owner_transport.c}`.
Replace Unix-only build/load/thread/alarm fixture mechanics with platform
branches or existing target helpers, while testing the same canonical runtime.
Keep fixture mechanics distinct from runtime behavior. Run the same named
Cargo commands on `x86_64-pc-windows-msvc` and require a nonzero executed test
count. `cfg(unix)`-induced zero tests is a failed readiness condition.

Source-level acceptance must execute the public facade through all three
routes: Engine JIT, emitted object plus static runtime, and emitted object
plus shared native runtime. Internal C-ABI JIT callback coverage cannot
replace the first route. Missing LLVM/clang or native kit tools remain
recorded unavailable cells; neither cross-compilation nor building a DLL
alone proves the behavior.

## Open risks and remaining decisions

1. **Public surface is proposed, not accepted.** Core.Time is the best fit
   from existing ownership and the evidence matrix. Naming and the four
   error variants must become normative before implementation.
2. **Clock domains already drift.** Canonical Core.Time requires rejection of
   monotonic values in civil conversion, while Instant itself carries no
   domain. Investigate existing semantic enforcement separately before
   claiming that broader requirement is satisfied. This slice must not
   worsen it with an unchecked SleepUntil.
3. **Duration constructors can overflow before Sleep is called.** Sleep can
   validate the Duration it receives, but cannot recover the caller's
   intended span from an already-overflowed `FromSeconds`/`FromMilliseconds`.
   Do not silently broaden this slice into changing those established APIs.
4. **Admission is bounded and status 0 is coarse.** Unavailable is honest for
   current code. Distinct NoScheduler/CapacityExhausted variants would need a
   specified runtime status extension and focused evidence. The shared
   32-wait bound matters for later networking load.
5. **Shutdown is not drop-driven cleanup.** Detached frames are not resumed;
   timer registration storage is released by ExternalShutdown. Do not imply
   that Tokio-style dropped-future cleanup establishes lexical resource
   disposal on beskid's abandoned stacks.
6. **Cancellation has two observable layers.** Tests must observe Sleep's
   local typed error and the Fiber lifecycle independently. Existing source
   sticky-cancel evidence explicitly yields before returning, allowing queued
   cancellation to become the terminal fiber outcome; do not infer more
   immediate-return behavior than the tests establish.
7. **Target evidence is incomplete.** Native adapters exist for all three
   targets, but the relevant harnesses are Unix-only. Windows portability is
   required work, not a documentation waiver.
8. **Worker cleanup accounting deserves a separate audit.** ExternalTryComplete
   decrements the scheduler wait count when cancelling a syscall, while
   abandoned worker storage can remain until the native operation exits.
   This does not block a pure timer (which has no worker job), but later DNS
   acceptance explicitly requires job-lifetime accounting. Do not use timer
   success as evidence that worker cancellation/liveness is fully settled.

## Research verification and handoff

Read the current spec, corelib declarations, manifest/build generators,
canonical scheduler/clock/worker sources, and the fixtures and harnesses
cited above. Verified the compiler worktree was clean at `615c1cae` before
research. No benchmark or test was rerun, no production symbol was edited,
and no commit or remote operation was performed. The local knowledge note
lives outside the repository at `~/.agents/knowledge/f4-timer-ownership.md`.
