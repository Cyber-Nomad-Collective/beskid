## MODIFIED Requirements

### Requirement: Phase A single GC mutator on scheduler threads: Decision [D-EXEC-RT-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Phase A (default) | **One** thread at a time may execute Beskid allocations as GC mutator |
> | Scheduler | Transfers mutator execution between fibers on that contract |
> | Syscall pool | Workers run blocking host work **without** arbitrary Beskid mutator code or generated allocation; runtime tags them and traps stray allocations (`assert_mutator_allowed`) |
> | Phase B | Not implemented in 0.6.0: the runtime has no API that attaches a second Beskid mutator to a heap, and Phase A is the only mode |
> | Future | Parallel execution is planned in the changes `v061-attributes-and-isolate-prerequisites` through `v065-parallel-sequences` |
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

## ADDED Requirements

### Requirement: Runtime instance lifecycle split
The runtime SHALL provide `IsolateCreate(config) -> pointer` and `IsolateDestroy(runtime)` (exports `beskid_rt_v5_isolate_create`, `beskid_rt_v5_isolate_destroy`) that perform the per-instance part of today's `ProcessInit`: allocate the heap and callback registry, attach the calling thread, initialize the scheduler, register the heap regions in the region-to-owner map and acquire the process-wide worker pool; and release them in reverse. `IsolateCreate` SHALL inherit the process limits (`BESKID_HEAP_MAX`, stack limits) already applied by `ProcessInit` and SHALL NOT read the environment again. `ProcessInit` SHALL keep its export and behavior: it SHALL perform the process-wide steps once (argument storage, environment limits, worker pool creation, region map creation), then call `IsolateCreate` for the primary instance and launch the composition container. `ProcessShutdown` SHALL call `IsolateDestroy` for the primary instance and then release the process-wide state. Exactly one instance SHALL exist per process in this release; a second `IsolateCreate` SHALL succeed only when called by the runtime corpus and no corelib or user surface SHALL reach it.

#### Scenario: ProcessInit observable behavior unchanged
- **GIVEN** the full corelib and projects test suites
- **WHEN** they run against a runtime with the split lifecycle
- **THEN** every test passes with the same outcomes as before the split

#### Scenario: IsolateCreate on a second thread
- **GIVEN** a runtime-corpus test that calls `IsolateCreate` from a thread created with `ThreadCreate` while the primary instance is active
- **WHEN** the call returns
- **THEN** it returns a non-null instance whose heap, scheduler and TLS state differ from the primary's, and `IsolateDestroy` on it leaves the primary instance running

#### Scenario: Limits inherited
- **GIVEN** `BESKID_HEAP_MAX` set before `ProcessInit`
- **WHEN** a second instance is created in a runtime-corpus test
- **THEN** its heap cap equals the primary's and no environment read occurs during `IsolateCreate`

### Requirement: Process-wide worker pool shared by runtime instances
The syscall worker pool SHALL be process-wide and reference counted. `worker_pool_init(count)` SHALL create the threads on the first call and SHALL succeed on later calls by sharing the existing pool and incrementing the instance count; it SHALL fail only when `count` is zero or above the pool maximum on the creating call. `worker_pool_shutdown()` SHALL decrement the count and SHALL stop and join the threads only when the count reaches zero. Requests SHALL carry the owner scheduler id and completions SHALL be posted to that owner's mailbox.

#### Scenario: Second init shares the pool
- **GIVEN** a process whose primary instance initialized the pool with four workers
- **WHEN** a runtime-corpus test calls `WorkerPoolInit(4)` again
- **THEN** the call returns 0, no new threads are created, and the pool keeps running after the test calls `WorkerPoolShutdown()` once

#### Scenario: Last release stops the threads
- **GIVEN** two holders of the pool
- **WHEN** both call `WorkerPoolShutdown()`
- **THEN** the worker threads exit and are joined after the second call and not before
