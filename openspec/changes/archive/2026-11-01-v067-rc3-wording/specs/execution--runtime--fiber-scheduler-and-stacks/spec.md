## MODIFIED Requirements

### Requirement: M:N cooperative fiber scheduler: Decision [D-EXEC-RT-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Model | **M:N** — many **fibers** on a pool of **OS worker threads** |
> | API surface | `fiber_*` builtins back `` `Fiber<T>` ``; no async lowering in compiler |
> | Preemption | User fibers are **cooperative**. The runtime does not preempt a fiber. The `spawn` expression always starts a fiber in the calling isolate. Parallel execution uses `Core.Parallel`, which runs work on other isolates |
> | Work stealing | Per-worker run queues; work-stealing **permitted** |
> | Parking | Fibers park on channel ops, join, cancel, and blocking syscalls |

**Stable ID:** `BSP-REQ-1CD9D5F44310`  
**Legacy source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0001-mn-cooperative-scheduler/content.md`  
**Source SHA-256:** `b050148ab6e053fa2510d5c865c08949bb591cd4fb7eedec706eda59673a1e67`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Phase A single GC mutator on scheduler threads: Decision [D-EXEC-RT-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Phase A (default) | **One** thread at a time may execute Beskid allocations as GC mutator |
> | Scheduler | Transfers mutator execution between fibers on that contract |
> | Syscall pool | Workers run blocking host work **without** arbitrary Beskid mutator code or generated allocation; runtime tags them and traps stray allocations (`assert_mutator_allowed`) |
> | Phase B | Not implemented: the runtime has no API that attaches a second Beskid mutator to a heap, and Phase A is the only mode |
> | Parallelism | Parallel execution runs on separate isolates. Each isolate has its own heap, its own scheduler and one mutator. `Core.Parallel` starts isolates, up to `BESKID_ISOLATES_MAX` (default: the host processor count) |
> 
> Aligns with [D-CORE-CONC-0007](/platform-spec/core-library/concurrency/concurrency-package/adr/0007-gc-phase-a-single-mutator/).

The "one thread" of Phase A SHALL be read per runtime instance: a process MAY hold many runtime instances, each with its own heap, scheduler table and one mutator thread (many heaps, one mutator each). The scheduler, its fiber table, the Phase-A mutator token and the external wait table SHALL hang off the runtime instance, never off process-global state. The syscall worker pool is process-wide and SHALL route completions to the owning scheduler by owner id.

**Stable ID:** `BSP-REQ-3EE23921CE98`  
**Legacy source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0003-phase-a-single-mutator/content.md`  
**Source SHA-256:** `2e87305c7dcd49eed1cf442a1e78be495f479d58d8d4ea48e474badcfe8b24cf`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: Scheduler state is per instance
- **GIVEN** two runtime instances on two threads
- **WHEN** each spawns fibers and parks on a syscall
- **THEN** each instance's fibers are listed only in its own scheduler table and each completion wakes only the owning scheduler
