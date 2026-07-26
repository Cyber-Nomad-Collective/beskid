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

### Requirement: Fiber builtins share one canonical scheduler state machine

`fiber_spawn`, `fiber_spawn_with_cancel_slot`, `fiber_yield`, `fiber_cancel`,
`fiber_detach`, `fiber_join_status`, `fiber_join_value`, `fiber_current_id`,
the monotonic clock, and processor-count builtins SHALL act on one canonical
scheduler object. There SHALL be exactly one canonical implementation owner of
each ABI export; forwarding is permitted, duplicate stub exports are not.

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
