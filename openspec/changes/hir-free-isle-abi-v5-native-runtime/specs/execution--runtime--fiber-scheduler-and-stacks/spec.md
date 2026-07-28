## ADDED Requirements

### Requirement: Canonical scheduler owns ABI-declared state

The canonical runtime scheduler SHALL allocate its scheduler object separately,
store that object only through the `scheduler` field declared by
`runtime_manifest.bsol`, and initialize that field idempotently. Scheduler and
fiber code MUST NOT derive storage by adding an undeclared offset to runtime
state or write outside a manifest-declared layout.

#### Scenario: Scheduler initialization preserves runtime-state bounds

- **GIVEN** a 64-byte ABI-declared runtime state surrounded by sentinels
- **WHEN** canonical scheduler initialization runs twice
- **THEN** both calls observe the same non-null scheduler pointer at the
  manifest-declared field, and neither sentinel is modified

### Requirement: Canonical fibers use target-derived contexts and bounded stacks

Each canonical fiber SHALL own a context whose size and alignment are derived
from `runtime_manifest.bsol`, plus an ABI-aligned stack with an initial capacity
of 64 KiB and a maximum capacity of 8 MiB. Overflow SHALL surface as join status
`3` and MUST NOT write beyond allocated context or stack storage. A target SHALL
NOT claim canonical scheduler support until its assembly context contract and
canonical executable scheduler test both pass.

#### Scenario: Linux canonical fiber resumes and returns

- **GIVEN** the Linux x86-64 canonical runtime kit and two yielding fibers
- **WHEN** the fibers spawn, yield, resume, and return
- **THEN** their contexts are manifest-aligned, each join reports its returned
  value, and no legacy scheduler or Rust runtime implementation is linked

#### Scenario: Fiber stack overflow is observable at join

- **GIVEN** a fiber whose stack demand exceeds 8 MiB
- **WHEN** that fiber is joined
- **THEN** its join status is `3` and execution has not written beyond its stack allocation

### Requirement: Scheduler execution uses the manifest-only context boundary

The canonical scheduler SHALL allocate one context record per runnable fiber
using the selected target's `BeskidArchContext*` manifest layout and alignment.
It SHALL initialize a new context only through
`beskid_arch_v5_context_init` and switch an already initialized context only
through `beskid_arch_v5_context_switch`. These two assembly exports SHALL be
the sole assembly implementation of scheduler execution; context allocation,
fiber state transitions, entry invocation, return completion, queue ownership,
and error delivery SHALL remain in canonical Beskid source.

The scheduler SHALL allocate an ABI-aligned writable stack region with an
initial usable capacity of 64 KiB, an inaccessible guard region at its lower
bound, and a hard usable-capacity limit of 8 MiB. Growth, if needed, SHALL
preserve the guard region and SHALL fail the affected fiber with join status
`3` before a write crosses either bound. Fixed-size context records, hard-coded
target context sizes or alignments, and undeclared runtime-state offsets are
prohibited.

The manifest SHALL declare a canonical-runtime-only guarded-stack adapter;
ordinary packages SHALL NOT declare or invoke it. The adapter SHALL return the
lower bound of the writable usable region, with its inaccessible guard directly
below that address, or fail closed with a null pointer. On Linux x86-64 and
Darwin arm64 it SHALL reserve a single contiguous region with no access and
change only the usable suffix to read/write. On Windows x86-64 it SHALL reserve
a single no-access region and commit only the usable suffix as read/write. The
native adapter, rather than Beskid source, SHALL derive the target page or
allocation granularity used for the guard and shall reject a zero, less-than-64
KiB, or greater-than-8-MiB requested usable capacity. Releasing a guarded stack
SHALL release the original whole reservation, including its guard; it SHALL NOT
turn the guard readable or writable first.

Because the manifest context initializer invokes a `void(pointer)` entry while
canonical generated fiber bodies return an `i64`, the canonical runtime SHALL
provide one scheduler-owned entry wrapper and return trampoline. The wrapper
SHALL receive the fiber record pointer, invoke the generation-bound body with
its recorded argument, record its normal value, publish terminal state, and
transfer only through the manifest context switch export to fiber 0. It SHALL
NOT return normally. The return trampoline is a no-argument fail-closed path:
it SHALL trap if reached or resumed and SHALL NOT recover a record through a
host, Rust, TLS, process-global, or other hidden handoff. Generated body
pointers SHALL NOT be cast directly to the context initializer's entry
signature.

The compiler SHALL emit the wrapper as the only canonical-runtime callable
`void(pointer)` helper and the trampoline as the only canonical-runtime
callable `void()` helper. `ContextInit` SHALL receive addresses of exactly
those helpers together with the fiber-record pointer; it SHALL NOT receive the
generated body address. The helpers are compiler-owned lowering artifacts, not
ABI-v5 imports or source-declarable functions, and ordinary packages and
Corelib SHALL be unable to construct, name, or invoke them.

The canonical Scheduler alone SHALL be able to request those addresses through
the compiler-minted operations `scheduler_fiber_entry_address() -> pointer` and
`scheduler_return_trampoline_address() -> pointer`. Those operations SHALL
exist only as generation-bound facts for the exact embedded Scheduler unit;
they SHALL NOT be ABI-v5 imports, manifest declarations, user-declarable
functions, or callable body pointers. Any copied source unit, ordinary package,
or Corelib unit that spells either operation SHALL be rejected before code
generation.

The canonical runtime SHALL invoke the recorded generated body through one
typed, capability-gated indirect-call representation with signature
`fn(pointer) -> i64`. A raw `word` or `pointer` value SHALL NOT become
callable through a cast, untyped memory load, host callback, or a special-case
third context boundary. This operation SHALL lower from generation-bound facts
through `TypedProgram`, `CodegenInput`, ISLE, and verified CLIF, and ordinary
packages and Corelib SHALL be denied the capability to construct or invoke it.

#### Scenario: Linux context initialization preserves the target ABI contract

- **GIVEN** the Linux x86-64 manifest layout and a newly allocated canonical fiber
- **WHEN** the scheduler prepares its context and switches to it for the first time
- **THEN** the context allocation matches the manifest size and alignment, the
  stack top is 16-byte aligned, the only assembly calls are the two
  manifest-declared context exports, and the fiber entry receives its declared
  environment argument

#### Scenario: Entry wrapper preserves a generated fiber result

- **GIVEN** a generated canonical fiber body that accepts its declared argument
  and returns an `i64`
- **WHEN** the scheduler initializes and runs that fiber through the manifest
  context boundary
- **THEN** a scheduler-owned `void(pointer)` wrapper invokes the body, records
  the result in that fiber's record before terminal publication, transfers to
  fiber 0 only through the declared context switch export without returning,
  passes only the compiler-emitted wrapper and trampoline addresses to
  `ContextInit`, and traps on a reached or resumed return trampoline without a
  direct function-pointer cast or hidden record handoff

#### Scenario: Scheduler-only helper addresses cannot escape the canonical corpus

- **GIVEN** the exact embedded Scheduler unit and an ordinary or Corelib unit
- **WHEN** either unit requests an entry-wrapper or return-trampoline address
- **THEN** only the embedded Scheduler receives a compiler-minted local helper
  address; all other units are rejected before code generation and no ABI import
  or source-declarable helper symbol is emitted

#### Scenario: Typed canonical indirect call rejects raw pointers

- **GIVEN** a scheduler-owned fiber record holding a generated
  `fn(pointer) -> i64` body reference
- **WHEN** the canonical entry wrapper invokes that body
- **THEN** only the typed capability-gated indirect-call operation is lowered
  through verified CLIF, and an ordinary package, Corelib unit, or raw word
  value is rejected before code generation

#### Scenario: Guarded-stack limit fails closed

- **GIVEN** a canonical fiber whose execution would grow its stack past 8 MiB
- **WHEN** the scheduler attempts that growth
- **THEN** the guard region remains inaccessible, no write crosses the stack
  allocation, the fiber enters the terminal stack-overflow state, and
  `fiber_join_status` returns `3`

#### Scenario: Target adapter keeps the lower guard inaccessible

- **GIVEN** a canonical fiber with a 64 KiB stack request on a supported target
- **WHEN** the manifest-authorized guarded-stack adapter allocates its storage
- **THEN** Linux and Darwin reserve no-access storage before protecting only the
  usable suffix, Windows reserves no-access storage before committing only the
  usable suffix, and the adapter returns a writable pointer immediately above
  the guard

#### Scenario: Guarded-stack request outside canonical bounds fails closed

- **GIVEN** a canonical fiber request below 64 KiB or above 8 MiB
- **WHEN** the scheduler asks the guarded-stack adapter to allocate it
- **THEN** no stack reservation is published, the fiber has terminal join status
  `3`, and a later release operation has no writable guard region to restore

### Requirement: Canonical scheduler has one observable fiber lifecycle

The canonical scheduler SHALL own one lifecycle state machine for fiber 0 and
every spawned fiber. `fiber_spawn` and `fiber_spawn_with_cancel_slot` SHALL
allocate a distinct non-zero handle, initialize its context and guarded stack,
publish the handle only after that initialization succeeds, and enqueue the
fiber exactly once. The cancel-slot variant SHALL clear the supplied slot before
publication and record cancellation through that same scheduler-owned fiber.

`fiber_yield` SHALL cooperatively save the current context and requeue that
fiber; it SHALL NOT execute a Rust, host, or legacy scheduler path.
`fiber_current_id` SHALL report the currently executing canonical fiber handle.
`fiber_cancel` SHALL make a non-terminal target complete with status `1` at its
next scheduler-observable cancellation point. `fiber_detach` SHALL waive only
the parent/main shutdown join obligation; it SHALL NOT erase the fiber's state
before completion and a detached panic SHALL remain process-fatal.

`fiber_join_status` SHALL return exactly `0`, `1`, `2`, `3`, or `4` for normal
completion, cancellation, panic, stack overflow, or not-yet-terminal state,
respectively. `fiber_join_value` SHALL return the recorded entry value only
after status `0`; it SHALL reject a stale, terminal-error, or not-done handle
without fabricating a value. All of these exports SHALL lower from the
canonical runtime corpus through `TypedProgram` → `CodegenInput` → ISLE →
verified CLIF and share the scheduler object stored in the manifest-declared
`BeskidRuntimeState.scheduler` field.

Fiber handles SHALL be scheduler-owned opaque identities: fiber 0 SHALL have
the distinguished main-fiber identity, each successful spawn SHALL publish a
fresh non-zero identity, and no completed or detached record SHALL be reused
while an externally reachable handle can still name it. A handle that is
unknown or stale SHALL be rejected fail-closed by every handle-taking export;
it SHALL NOT be reported as a live fiber, a normal completion, or a fabricated
join value.

#### Scenario: Spawn, yield, resume, and join use one scheduler-owned record

- **GIVEN** a Linux x86-64 canonical runtime program that spawns two fibers
  which yield once and return distinct values
- **WHEN** the scheduler runs until both are terminal
- **THEN** each handle is distinct and non-zero, each fiber resumes after its
  yield, `fiber_current_id` identifies the running fiber, both joins report
  status `0` with their own values, and the verified CLIF contains no legacy
  scheduler, Rust runtime, or unapproved ABI import

#### Scenario: Cancellation, detach, and incomplete join preserve lifecycle truth

- **GIVEN** one queued cancellable fiber, one detached fiber, and one live
  yielding fiber
- **WHEN** cancellation, detachment, and join-status queries are issued before
  all three fibers become terminal
- **THEN** the cancelled fiber reports status `1` once observed by the scheduler,
  the live fiber reports status `4` until terminal, the detached fiber remains
  executable and tracked until completion, and no join-value call returns a
  fabricated value

#### Scenario: Every terminal status and stale handle remains observable

- **GIVEN** one normal fiber, one cancellable fiber, one fiber that panics, one
  fiber that overflows its guarded stack, and a handle whose record has become
  stale
- **WHEN** each terminal result is observed through `fiber_join_status` and
  `fiber_join_value` is requested for every handle
- **THEN** the normal, cancelled, panicked, and overflowed fibers report exactly
  `0`, `1`, `2`, and `3`, respectively; only the normal fiber exposes its
  recorded value; and the stale handle is rejected fail-closed without being
  reported as a live or completed fiber

### Requirement: Fibers 0.1.13 compatibility uses deterministic poll-driven execution

The Fibers 0.1.13 compatibility surface SHALL express runnable work as a
poll-driven unit of work, separate from the retained stackful-fiber ABI. Its
phase-one ABI SHALL use the following exact exports and no hidden host, Rust,
or process-global executor:

- `beskid_rt_v5_poll_executor_spawn(pointer poll_entry, pointer task_state,
  pointer result_slot, pointer cancel_slot) -> i64`;
- `beskid_rt_v5_poll_executor_run_once() -> i32`;
- `beskid_rt_v5_poll_executor_wake(i64 task) -> i32`;
- `beskid_rt_v5_poll_monitor_new(i64 task) -> i64`,
  `beskid_rt_v5_poll_monitor_poll(i64 monitor, pointer result_slot) -> i32`,
  and `beskid_rt_v5_poll_monitor_drop(i64 monitor) -> void`; and
- `beskid_rt_v5_poll_link_new(i64 task) -> i64`,
  `beskid_rt_v5_poll_link_clone(i64 link) -> i64`,
  `beskid_rt_v5_poll_link_poll(i64 link, pointer result_slot) -> i32`, and
  `beskid_rt_v5_poll_link_drop(i64 link) -> void`.

`poll_entry` SHALL have exactly the compiler-verified erased signature
`fn(pointer task_state, pointer wake_token, pointer result_slot) -> i32`.
It SHALL return exactly `0` (`ready_ok`), `1` (`pending`), `2` (`ready_err`),
`3` (`cancelled`), or `4` (`panicked`). The result slot SHALL be written only
for `ready_ok` or `ready_err`, and carries the opaque result or error pointer
selected by the generated caller. Any other entry tag, null required state, or
failed provenance check SHALL terminate the task as `panicked` rather than
calling arbitrary pointers or fabricating a result.

`run_once` SHALL perform at most one ready unit of work and return exactly `0`
(`ran`), `1` (`waiting`), `2` (`complete`), or `3` (`fatal`). `waiting` means
no unit is ready while at least one non-terminal unit has a registered wake
path; it SHALL NOT spin, execute a pending unit, or manufacture a wake.
`complete` means no non-terminal poll task remains. `fatal` means the executor
cannot make a truthful scheduling decision, including canonical scheduler
corruption; it SHALL NOT be reused as a task outcome.

A wake token SHALL name one exact pending task and SHALL be valid only while
that task is owned by this executor. `poll_executor_wake` SHALL return exactly
`0` (`enqueued`), `1` (`already_enqueued`), `2` (`terminal`), or `3`
(`stale_or_unknown`). Duplicate wakes MAY coalesce, but SHALL NOT cause
concurrent or duplicate polling. A stale, unknown, foreign, or terminal wake
token SHALL fail closed: it SHALL not enqueue another task or mutate queue
state.

`poll_monitor_poll` and `poll_link_poll` SHALL return exactly `0` (`pending`),
`1` (`ready_ok`), `2` (`ready_err`), `3` (`cancelled`), `4` (`panicked`), or
`5` (`stale_or_unknown`). They SHALL write their caller's result slot only for
`ready_ok` or `ready_err`. A monitor is an observation reference only:
creating, cloning, or dropping it SHALL NOT cancel or detach its task. A link
is a cancellation-owning reference: cloning adds one live link and dropping a
link removes exactly one. Dropping the final live link of a non-terminal,
non-detached task SHALL request cancellation through that task's canonical
cancellation state; it SHALL not synchronously fabricate a terminal result,
cancel unrelated tasks, or cancel because a non-final link was dropped.

The compatibility baseline SHALL include a deterministic in-place executor.
It SHALL execute no work on a host thread, Rust executor, legacy scheduler, or
hidden global queue; with the same spawn, poll, wake, cancellation, and link
drop sequence, it SHALL select ready work in stable FIFO registration order.
Its queue, wake registrations, and monitor state SHALL be owned by the same
manifest-declared canonical scheduler object used by the ABI-v5 lifecycle
exports and shall lower only through `TypedProgram` → `CodegenInput` → ISLE →
verified CLIF.

An explicit child link SHALL carry linked cancellation. Dropping the last live
link to a non-terminal child SHALL request cancellation through that child's
canonical scheduler-owned cancellation state; the child SHALL become terminal
with join status `1` at its next scheduler-observable cancellation point.
Dropping a link SHALL NOT erase the child record, publish a normal value, or
cancel an independently detached child. A stale or unknown link SHALL be
rejected fail-closed.

The prior stackful `fiber_yield` surface is deprecated for new language and
corelib APIs in Fibers 0.1.13. The ABI-v5 `beskid_rt_v5_fiber_yield` export
remains a compatibility entry point only: it SHALL map to the current unit's
not-ready-and-requeue transition on the same canonical scheduler, preserve its
resume continuation, and SHALL NOT select a separate stackful scheduler, Rust
executor, host callback, or fallback runtime. New poll-driven APIs SHALL use
the ready/not-ready protocol directly. The status mapping remains unchanged:
normal `0`, cancelled `1`, panicked `2`, stack overflow `3`, and not-terminal
`4`.

#### Scenario: Run-once distinguishes ready, waiting, and complete work

- **GIVEN** an in-place executor with one ready unit and one unit that first
  polls not-ready
- **WHEN** `run_once` is called until the ready unit completes and the other
  unit has registered its wake path
- **THEN** each call polls at most one unit, the ready unit produces `ran`, the
  unwoken unit produces `waiting`, and no call polls the not-ready unit again
  until its registered wake occurs

#### Scenario: Poll ABI tags and opaque results are exact

- **GIVEN** a canonical poll entry that returns each permitted poll tag and
  uses a distinct opaque result or error pointer
- **WHEN** it is driven through the phase-one spawn, run-once, and monitor ABI
- **THEN** only `ready_ok` and `ready_err` write the monitor result slot, every
  other permitted tag has the specified terminal or pending meaning, and an
  invalid tag becomes `panicked` without an untyped indirect call

#### Scenario: Wake resumes only the registered pending unit

- **GIVEN** two not-ready units registered in stable order
- **WHEN** only the second unit's wake is delivered and `run_once` is called
- **THEN** the second unit alone becomes eligible, it is polled once, and a
  duplicate wake cannot make it run concurrently or twice for one `run_once`

#### Scenario: Monitor preserves result and error truth

- **GIVEN** one unit that completes with a value, one that completes with an
  error, and one that remains not-ready
- **WHEN** their monitors are queried
- **THEN** the completed monitors expose their own terminal value or error,
  the not-ready monitor reports pending, and no query fabricates a terminal
  outcome

#### Scenario: Link drop requests linked cancellation without corrupting state

- **GIVEN** a non-detached linked child whose body is waiting at a cancellation
  point and an independently detached child
- **WHEN** the last link to the first child is dropped
- **THEN** the first child transitions to canonical cancellation status `1` at
  that point, its record remains available for truthful status observation,
  and the detached child remains unaffected

#### Scenario: Final-link ownership and stale wake fail closed

- **GIVEN** a pending task with two live links, a monitor, and a registered
  wake token
- **WHEN** one link is dropped, then the last link is dropped, and stale or
  duplicate wakes are delivered
- **THEN** the first drop does not cancel the task, the final drop requests
  only that task's canonical cancellation, the monitor alone does not keep a
  cancellation-owning link alive, one wake may enqueue at most once, and stale
  or terminal wakes return their fail-closed tags without queue mutation

#### Scenario: Deprecated yield remains one canonical compatibility transition

- **GIVEN** a legacy ABI-v5 caller invokes `beskid_rt_v5_fiber_yield` from a
  running canonical fiber
- **WHEN** the scheduler next selects that fiber
- **THEN** execution resumes after the yield through the same scheduler-owned
  continuation, its status mapping remains `0` through `4`, and artifact
  provenance contains neither a separate stackful executor nor Rust or host
  fallback

### Requirement: Fiber builtins share one canonical scheduler state machine

All fiber builtins SHALL act on one canonical scheduler object, including
`fiber_spawn`, `fiber_spawn_with_cancel_slot`, `fiber_yield`, `fiber_cancel`,
`fiber_detach`, `fiber_join_status`, `fiber_join_value`, `fiber_current_id`,
the monotonic clock, and processor-count builtins.
There SHALL be exactly one canonical implementation owner of each ABI export;
forwarding is permitted, duplicate stub exports are not.

#### Scenario: Canonical builtins lower through ISLE

- **GIVEN** a syntax-owned AOT or JIT fixture using spawn, yield, cancel,
  detach, and join
- **WHEN** it lowers through `TypedProgram`, `CodegenInput`, ISLE, and CLIF verification
- **THEN** its verified CLIF contains only the manifest-authorized canonical ABI calls,
  its handles and join statuses are stable, and HIR or legacy lowering is rejected

### Requirement: Scheduler preserves Phase-A and main-fiber lifecycle

The scheduler SHALL create fiber 0 before main entry, join every non-detached
child before worker-pool shutdown, enumerate every live fiber stack at GC
safepoints, and transfer the sole Phase-A mutator role only between scheduler
fibers. Blocking workers MUST NOT execute arbitrary Beskid mutator code; a
detached child panic SHALL abort the process.

#### Scenario: Main shutdown joins child work without losing GC roots

- **GIVEN** main spawns a non-detached allocating child and a blocking operation
- **WHEN** main returns while the child is live
- **THEN** a safepoint enumerates the child stack, another fiber can progress while
  the blocking worker is parked, and shutdown waits for the child before stopping workers

### Requirement: Scheduler execution claims are target-gated by an executable lifecycle test

The Linux x86-64 target SHALL be the first target eligible to claim canonical
scheduler execution support. Its claim SHALL require a native executable test
linked from the exact debug or release ABI-v5 runtime kit, rather than a
source-tree fallback, interpreter, synthetic context mock, or Rust scheduler.
The test SHALL exercise scheduler initialization before main, fiber 0 creation,
at least two spawn/yield/resume/return cycles, normal join values, cancellation,
detachment, a Phase-A safepoint that enumerates every live stack, and main
shutdown joining every non-detached child before worker-pool shutdown.

The test SHALL additionally audit the produced executable and runtime kit
against the manifest allowlist and forbidden runtime provenance. macOS arm64
and Windows x86-64 SHALL remain unsupported for canonical scheduler execution
until each independently satisfies the same target-specific context and
executable lifecycle test; a passing Linux test SHALL NOT imply their support.

#### Scenario: Linux executable scheduler conformance gate

- **GIVEN** an empty installed prefix containing the Linux x86-64 ABI-v5 kit
- **WHEN** the canonical scheduler lifecycle executable is built and run
- **THEN** it creates fiber 0 before main, completes the required fiber
  lifecycle operations, joins non-detached children before worker shutdown,
  records Phase-A stack enumeration, and passes context, allowlist, and
  forbidden-provenance audits without a source-tree or Rust-runtime fallback
