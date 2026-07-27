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
its recorded argument, record its normal value before any completion state is
published, and enter the return trampoline. The return trampoline SHALL mark
the record terminal, transfer only through the manifest context switch export
to fiber 0, and trap if it is ever resumed. Generated body pointers SHALL NOT
be cast directly to the context initializer's entry signature, and no host,
Rust, or process-global result handoff is permitted.

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
  fiber 0 only through the declared context switch export, and rejects a
  resumed return trampoline without a direct function-pointer cast

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
