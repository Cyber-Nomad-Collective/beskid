## MODIFIED Requirements

### Requirement: Fiber stack initial size and cap: Decision [D-EXEC-RT-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Parameter | Value |
> | --- | --- |
> | Initial size | **64 KiB** per fiber |
> | Growth | Growable until cap |
> | Maximum | **8 MiB** per fiber by default; `BESKID_FIBER_STACK_MAX` sets another whole multiple of 64 KiB for the process |
> | Overflow | `FiberError::StackOverflow` at **Join** — no undefined behavior |
> | Switching | Callee stacks ABI-aligned; callee-saved registers saved per platform ABI |
> | GC | All fiber stacks enumerable at safepoints via compiler stack maps |

The runtime SHALL read `BESKID_FIBER_STACK_MAX` during `beskid_rt_v5_process_init` as a decimal byte count with an optional `k`, `m` or `g` suffix (powers of 1024, either case). The value SHALL apply to every fiber spawned afterwards. A value that is not a whole multiple of 64 KiB, is below 64 KiB, or does not parse SHALL terminate initialization through the runtime trap path with the variable name as the diagnostic message.

**Stable ID:** `BSP-REQ-62223D68B5BA`  
**Legacy source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0002-fiber-stack-sizes/content.md`  
**Source SHA-256:** `c8da579185e7d71d9ebfdca90a3a1033796e69702387b976babadcbaf5eb9d8e`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: Stack maximum from the environment
- **GIVEN** a process started with `BESKID_FIBER_STACK_MAX=1M`
- **WHEN** it spawns a fiber and joins it
- **THEN** the fiber's reservation is 1 MiB and the join succeeds

#### Scenario: Misaligned stack maximum is rejected
- **GIVEN** a process started with `BESKID_FIBER_STACK_MAX=100000`
- **WHEN** `beskid_rt_v5_process_init` runs
- **THEN** the process terminates through the trap path with exit status 101 and `BESKID_FIBER_STACK_MAX` in the diagnostic

## ADDED Requirements

### Requirement: Scheduler tables grow on demand
The scheduler SHALL keep its fiber records, run queue, and pending spawn, cancel and wake lists in storage that grows on demand from the system allocator. The scheduler SHALL NOT impose a fixed maximum on the number of live fibers, queued fibers or pending operations. A fiber record SHALL keep its address for the life of the scheduler once allocated, so a public fiber handle (slot index in the low 32 bits, generation in the high 32 bits) and every traced slot inside the record stay valid across growth. Slot reuse SHALL keep the generation discipline: a released slot SHALL be reused only with an advanced generation, and a stale handle SHALL be rejected. The no-fiber sentinel SHALL lie outside the 32-bit slot range.

The only failure of fiber allocation SHALL be the system allocator refusing more memory, reported to the spawner as the existing `-1` handle. A wake that cannot be recorded because the allocator refused SHALL trap as `out_of_memory`; the scheduler SHALL NOT drop a wake.

The `BeskidSchedulerState` layout SHALL be a fixed header of pointers and counters without inline arrays; its generated constants SHALL name `fiber_table` and `fiber_stack_max`.

#### Scenario: Ten thousand fibers
- **GIVEN** a program that spawns fibers in fifty nested chains of 200, each parent joining its child
- **WHEN** every chain completes
- **THEN** 10,000 fibers have spawned and joined with their values and the heap verifies clean

#### Scenario: Seventeenth live fiber
- **GIVEN** sixteen fibers parked on a join
- **WHEN** a seventeenth fiber is spawned
- **THEN** the spawn returns a valid handle and the fiber runs
