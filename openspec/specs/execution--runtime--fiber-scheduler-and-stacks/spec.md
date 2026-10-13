<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Fiber scheduler and stacks Specification

## Purpose

M:N cooperative scheduler, per-fiber stacks, safepoints, and runtime fiber builtins.
## Requirements
### Requirement: M:N cooperative fiber scheduler: Decision [D-EXEC-RT-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Model | **M:N** — many **fibers** on a pool of **OS worker threads** |
> | API surface | `fiber_*` builtins back `` `Fiber<T>` ``; no async lowering in compiler |
> | Preemption | User fibers are **cooperative**; 0.6.0 has no preemptive or parallel execution API for Beskid code, and `spawn` always starts a fiber |
> | Work stealing | Per-worker run queues; work-stealing **permitted** |
> | Parking | Fibers park on channel ops, join, cancel, and blocking syscalls |

**Stable ID:** `BSP-REQ-1CD9D5F44310`  
**Legacy source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0001-mn-cooperative-scheduler/content.md`  
**Source SHA-256:** `b050148ab6e053fa2510d5c865c08949bb591cd4fb7eedec706eda59673a1e67`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Fiber stack initial size and cap: Decision [D-EXEC-RT-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Parameter | Value |
> | --- | --- |
> | Initial size | **64 KiB** per fiber |
> | Growth | Growable until cap |
> | Maximum | **8 MiB** cap per fiber |
> | Overflow | `FiberError::StackOverflow` at **Join** — no undefined behavior |
> | Switching | Callee stacks ABI-aligned; callee-saved registers saved per platform ABI |
> | GC | All fiber stacks enumerable at safepoints via compiler stack maps |

**Stable ID:** `BSP-REQ-62223D68B5BA`  
**Legacy source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0002-fiber-stack-sizes/content.md`  
**Source SHA-256:** `c8da579185e7d71d9ebfdca90a3a1033796e69702387b976babadcbaf5eb9d8e`

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
> | Phase B | Not implemented in 0.6.0: the runtime has no API that attaches a second Beskid mutator to a heap, and Phase A is the only mode |
> | Future | Parallel execution is planned in the changes `v061-attributes-and-isolate-prerequisites` through `v065-parallel-sequences` |
> 
> Aligns with [D-CORE-CONC-0007](/platform-spec/core-library/concurrency/concurrency-package/adr/0007-gc-phase-a-single-mutator/).

**Stable ID:** `BSP-REQ-3EE23921CE98`  
**Legacy source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0003-phase-a-single-mutator/content.md`  
**Source SHA-256:** `2e87305c7dcd49eed1cf442a1e78be495f479d58d8d4ea48e474badcfe8b24cf`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Main fiber shutdown joins spawned children: Decision [D-EXEC-RT-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Main fiber | `main()` runs on **fiber 0**; scheduler starts before entry |
> | Normal exit | When `main` returns, runtime **Join**s every spawned fiber that was not **Detach**ed |
> | Detach | **Detach** fibers are **not** joined at shutdown |
> | Detach panic | Unjoined **Detach** child panic **still aborts** the process |
> | Pool shutdown | After joins complete, worker thread pool stops |
> 
> Matches [D-CORE-CONC-0004](/platform-spec/core-library/concurrency/concurrency-package/adr/0004-main-fiber-shutdown/).

**Stable ID:** `BSP-REQ-B7188353FDE7`  
**Legacy source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0004-main-fiber-shutdown-join/content.md`  
**Source SHA-256:** `4c75fdd340657edbdf9aba6aa3525129de6570cc19c791ae06e9c0d82c9b4c43`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: External completion is routed to the owning scheduler
Every scheduler SHALL have a stable scheduler identifier, a thread-safe inbound command queue, and an owner wake primitive. A syscall-pool worker or other external source MUST enqueue completion only to the scheduler that owns the waiting fiber and MUST wake that owner; completion MUST NOT depend on the external worker's thread-local wake queue.

**Stable ID:** `BSP-REQ-B206035816D3`

#### Scenario: Syscall worker completes an owner wait
- **GIVEN** a fiber parked on scheduler A for a syscall performed by a worker thread
- **WHEN** the worker completes the syscall
- **THEN** scheduler A is woken and resumes only its owned fiber

### Requirement: External waits suppress false deadlock
The scheduler SHALL maintain an active-external-wait count from external-work submission through that work's terminal completion or cancellation cleanup. Deadlock detection MUST report deadlock only when no runnable fibers exist, all remaining fibers are parked, and the active-external-wait count is zero.

**Stable ID:** `BSP-REQ-6CF93216D4C9`

#### Scenario: Pending syscall is not deadlock
- **GIVEN** no fiber is runnable and one fiber is parked for submitted external work
- **WHEN** the scheduler evaluates deadlock
- **THEN** it does not report deadlock while the external wait is active

### Requirement: External waits block their fiber, not the scheduler
Submitting an external wait SHALL park only the submitting fiber. The owner scheduler MUST continue to execute every other runnable fiber while the external source is pending, and the external source MUST NOT occupy a scheduler worker thread or block the scheduler run loop.

**Stable ID:** `BSP-REQ-52284EABE5E1`

#### Scenario: A second fiber runs during an external wait
- **GIVEN** fiber A is parked for an active external wait and fiber B is runnable on the same owner scheduler
- **WHEN** the scheduler selects its next runnable fiber
- **THEN** it executes fiber B before the external wait for fiber A completes

### Requirement: External-wait capacity derives from live fiber capacity
An owner scheduler SHALL admit at most one active external-wait registration for each live valid fiber. Its usable external-wait capacity SHALL be derived from the scheduler's live-fiber capacity, so every live valid fiber can hold its one registration simultaneously. Implementations MAY retain additional physical record storage, but it SHALL NOT introduce a lower normal admission limit. A repeated registration for the same valid fiber SHALL be rejected as a duplicate without changing active accounting, timer state, or the original registration's winner. A terminal release SHALL make that fiber's one registration available again; stale generations remain harmless under `BSP-REQ-896BA6C917E9`.

**Stable ID:** `BSP-REQ-A0D58F1B3E21`

#### Scenario: Full legal admission remains distinct from duplicate rejection
- **GIVEN** every live valid fiber owns one active external-wait registration
- **WHEN** a second registration is attempted for one of those fibers
- **THEN** the attempt SHALL be rejected as a duplicate, all existing registrations SHALL remain active and unchanged, and a terminal release SHALL permit one subsequent valid registration

### Requirement: Monotonic timers use generation-tagged registrations
`Sleep`, timeout, and deadline waits SHALL use monotonic absolute deadlines. Every timer registration and cancellation MUST carry a generation that makes an obsolete fire harmless; wall-clock changes MUST NOT advance, delay, or reclassify a monotonic deadline.

**Stable ID:** `BSP-REQ-896BA6C917E9`

#### Scenario: Cancelled timer fires late
- **GIVEN** a timer registration is cancelled and its slot is reused with a new generation
- **WHEN** an event for the cancelled generation arrives
- **THEN** it does not wake or complete the new registration

### Requirement: Each wait has exactly one winner
Every wait operation SHALL centralize completion in one atomic winner transition shared by readiness, close, cancellation, timeout, and duplicate-wake paths. The winning transition MUST resume the fiber once and schedule idempotent cleanup; every losing transition MUST perform no user-visible completion.

**Stable ID:** `BSP-REQ-A371B8519429`

#### Scenario: Timeout races readiness
- **GIVEN** readiness and timeout are delivered for the same wait
- **WHEN** they race to complete it
- **THEN** exactly one terminal outcome resumes the fiber and the other outcome performs no second resume

### Requirement: Reactor has one portable contract and required native backends
The runtime SHALL route Internet socket readiness through one internal reactor
contract. Linux production builds MUST use epoll, macOS production builds MUST
use kqueue, and Windows production builds MUST use IOCP. A fallback MAY exist
only in tests and MUST NOT replace a required production backend. Backend
selection MUST NOT alter the public Network API or error vocabulary.

**Stable ID:** `BSP-REQ-5B97C4F1D3A8`

#### Scenario: Target backend is selected
- **GIVEN** a production runtime built for macOS
- **WHEN** it registers a TCP accept wait
- **THEN** the wait is registered through kqueue and exposes no kqueue detail to the caller

### Requirement: Socket operations share the Foundation terminal winner
Every socket readiness, DNS completion, cancellation, deadline expiry, and close SHALL settle through the Foundations change's owner-routed completion and atomic one-winner operation contract. A winning transition MUST resume the waiting fiber once and perform idempotent deregistration; every losing or stale transition MUST perform no user-visible completion. Networking MUST NOT add an alternate scheduler wake, timer, or cancellation path.

**Stable ID:** `BSP-REQ-F902B81D6E4C`

#### Scenario: Close races readiness
- **GIVEN** a fiber waiting to read from a TCP stream
- **WHEN** close and readiness race for the same operation
- **THEN** exactly one typed terminal outcome resumes the fiber and late readiness is discarded

### Requirement: Network shutdown is idempotent and leak-audited
Closing a network resource SHALL invalidate its active handle generation,
cancel or deregister its pending operations, and release its native socket at
most once. Debug and conformance modes MUST report each live network handle at
runtime shutdown and MUST fail the leak check. Runtime diagnostics MUST include
slot, generation, owner scheduler, backend, operation kind, and winner but
MUST NOT reveal a native descriptor.

**Stable ID:** `BSP-REQ-8A21D67C43FE`

#### Scenario: Duplicate close does not leak or double-close
- **GIVEN** a TCP stream with a pending read
- **WHEN** its owner invokes close twice
- **THEN** the socket is released once, the read receives one terminal outcome, and the leak check reports no live handle

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Fiber scheduler and stacks

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/execution/runtime/fiber-scheduler-and-stacks/`  
**Source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/content.md`  
**SHA-256:** `003d7c9c575a1605a5674aa18d9018b382f998e3ab3f20a3d093ce8b3bc00873`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
Cooperative **M:N** scheduling: many **fibers** on an OS worker pool, **growable stacks** (64 KiB initial, 8 MiB cap), and **compiler stack maps** at safepoints. **`fiber_*` builtins** back corelib `Fiber<T>`; `main` runs on fiber 0 and shutdown **Join**s non-**Detach** children. Phase A documents a **single GC mutator**; Phase B adds parallel mutators without API break.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/crates/beskid_runtime/src/scheduler/` — split scheduler state, TLS, spawn/cancel, run loop, and syscall parking modules
- `compiler/crates/beskid_abi/` — generated ABI-v5 runtime import tables from `compiler/runtime_manifest.bsol`
- `compiler/crates/beskid_analysis/src/builtins.rs` — `__fiber_*` injected paths
- `compiler/crates/beskid_codegen/` — safepoints, stack maps
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
The Beskid runtime provides a **cooperative M:N scheduler**: many **fibers** multiplexed on a pool of **OS worker threads**. Fiber code uses **growable stacks** and **compiler-emitted stack maps** at safepoints. The runtime exports **`fiber_*` builtins** consumed by `Fiber<T>` in corelib—no async/await lowering.

**Preemptive** parallelism for user code uses `System.Threading` (OS threads), not preempted fibers in v1.
</SpecSection>

<SpecSection title="Architecture" id="architecture">

```arch
flowchart LR
  subgraph runtime [beskid_runtime]
    SCH[Scheduler]
    POOL[OS thread pool]
    FB[fiber stacks]
    SCH --> POOL
    SCH --> FB
  end
  subgraph corelib [corelib_concurrency]
    FT[Fiber T struct]
    FT -->|fiber_* builtins| SCH
  end
  subgraph compiler [beskid_codegen]
    SP[spawn lowering]
    SM[stack maps]
    SP --> SM
  end
```

</SpecSection>

<SpecSection title="Phase A vs Phase B" id="phase-a-vs-phase-b">
| Phase | Mutator threads | GC | Fiber scheduler |
| --- | --- | --- | --- |
| **A (v0.2 target)** | **One** GC mutator; fibers may run on multiple OS threads but GC obeys single-mutator rules | Existing arena; document barriers as no-op until Phase B | Cooperative; park at **Send**/**Receive**/**syscall** |
| **B (documented)** | Multiple parallel mutators | Concurrent mark/sweep + real **gc_write_barrier** | Optional function-entry preemption |

Phase B **must** be specified in **[memory-and-gc-runtime-contract](/platform-spec/execution/runtime/memory-and-gc-runtime-contract/)** before implementation; Phase A ships first.
</SpecSection>

<SpecSection title="Runtime builtins (normative names)" id="runtime-builtins">
Illustrative ABI symbols (exact names in `beskid_abi/src/symbols.rs`):

- `fiber_spawn`, `fiber_spawn_with_cancel_slot`, `fiber_join_status`, `fiber_join_value`, `fiber_detach`, `fiber_cancel`, `fiber_yield`
- `fiber_current_id` (diagnostics), `fiber_processor_count` (scheduler sizing)
- Monotonic clock builtin for `Concurrency.NowMillis()` (replaces `rt_now_millis`)

Deprecated: `rt_yield` (`sched` feature) → `fiber_yield`.
</SpecSection>

<SpecSection title="Syscall Parking" id="syscall-parking">
M6 completion requires blocking runtime syscalls to enqueue host blocking work on the syscall pool, park only the current fiber, and wake that fiber when the worker finishes. Worker threads must not execute generated Beskid code or perform generated-runtime allocation directly; any runtime object creation happens after the fiber resumes on the scheduler thread.
</SpecSection>

<SpecSection title="Main fiber" id="main-fiber">
`main()` runs on **fiber 0**. Runtime starts scheduler before `main`. When `main` returns, the runtime **Join**s every spawned fiber that was not **Detach**ed, then shuts down the thread pool. **Detach** fibers are not joined at shutdown; their panic still aborts the process.
</SpecSection>

<SpecSection title="Stacks" id="stacks">
- Initial stack **64 KiB**, growable, cap **8 MiB**
- Stack overflow → `FiberError::StackOverflow` surfaced at **Join** on the affected fiber (no undefined behavior)
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-EXEC-RT-0001` … `D-EXEC-RT-0004`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Fiber scheduler and stacks - Design model](./articles/design-model/)
- [Fiber scheduler and stacks - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: M:N cooperative fiber scheduler

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0001-mn-cooperative-scheduler/`  
**Source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0001-mn-cooperative-scheduler/content.md`  
**SHA-256:** `b050148ab6e053fa2510d5c865c08949bb591cd4fb7eedec706eda59673a1e67`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Beskid rejects Rust-style `async`/`await` state machines at the language level ([D-INC-0008](/platform-spec/community/project-inception/adr/0008-fibers-not-async-await/)). The runtime must provide cooperative concurrency primitives consumed by `corelib_concurrency`.

## Decision

| Rule | Detail |
| --- | --- |
| Model | **M:N** — many **fibers** on a pool of **OS worker threads** |
| API surface | `fiber_*` builtins back `` `Fiber<T>` ``; no async lowering in compiler |
| Preemption | User fibers are **cooperative**; preemptive parallelism uses `System.Threading` (OS threads) |
| Work stealing | Per-worker run queues; work-stealing **permitted** |
| Parking | Fibers park on channel ops, join, cancel, and blocking syscalls |

## Consequences

Scheduler modules live under `beskid_runtime/src/scheduler/`. Deprecated `rt_yield` (`sched` feature) is superseded by `fiber_yield`.

## Verification anchors

`compiler/crates/beskid_runtime/tests/concurrency.rs`; corelib concurrency tests; git: `12ee673`, `76a58f5`.
``````

</details>

### Source Record: Fiber stack initial size and cap

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0002-fiber-stack-sizes/`  
**Source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0002-fiber-stack-sizes/content.md`  
**SHA-256:** `c8da579185e7d71d9ebfdca90a3a1033796e69702387b976babadcbaf5eb9d8e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Fiber stacks must balance memory use against deep call chains from generated code and corelib. GC needs precise stack maps at safepoints on every fiber stack.

## Decision

| Parameter | Value |
| --- | --- |
| Initial size | **64 KiB** per fiber |
| Growth | Growable until cap |
| Maximum | **8 MiB** cap per fiber |
| Overflow | `FiberError::StackOverflow` at **Join** — no undefined behavior |
| Switching | Callee stacks ABI-aligned; callee-saved registers saved per platform ABI |
| GC | All fiber stacks enumerable at safepoints via compiler stack maps |

## Consequences

Documentation and corelib **must** cite these limits. Stack switching may use manual swap techniques documented in [design model](../design-model/).

## Verification anchors

Scheduler stack allocator; fiber spawn/join integration tests.
``````

</details>

### Source Record: Phase A single GC mutator on scheduler threads

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0003-phase-a-single-mutator/`  
**Source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0003-phase-a-single-mutator/content.md`  
**SHA-256:** `2e87305c7dcd49eed1cf442a1e78be495f479d58d8d4ea48e474badcfe8b24cf`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Fibers may run on multiple OS threads while Phase A GC still uses one process-wide arena (`enter_runtime_scope`). Syscall pool workers must not become second mutators.

## Decision

| Rule | Detail |
| --- | --- |
| Phase A (default) | **One** thread at a time may execute Beskid allocations as GC mutator |
| Scheduler | Transfers mutator execution between fibers on that contract |
| Syscall pool | Workers run blocking host work **without** arbitrary Beskid mutator code or generated allocation; runtime tags them and traps stray allocations (`assert_mutator_allowed`) |
| Phase B (opt-in, v0.3) | Multiple Beskid mutators may share one heap by holding a `MutatorAttachGuard` from `attach_phase_b_mutator`; pointer-payload channel ops apply `gc_write_barrier` on send and receive |
| Future | Phase B becomes the default once preemption code emission and full concurrent-mark stress coverage land |

Aligns with [D-CORE-CONC-0007](/platform-spec/core-library/concurrency/concurrency-package/adr/0007-gc-phase-a-single-mutator/).

## Consequences

`run_blocking` paths park fibers and resume on scheduler threads for mutator work.

## Verification anchors

`beskid_runtime` scheduler + `enter_runtime_scope`; concurrency runtime tests
(`tests/concurrency.rs`, `tests/gc_concurrency.rs`); Phase B opt-in coverage in
`tests/phase_b_concurrency.rs` exercises multi-mutator allocation, pointer-payload
channel write barriers, and the syscall-pool allocation guard.
``````

</details>

### Source Record: Main fiber shutdown joins spawned children

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0004-main-fiber-shutdown-join/`  
**Source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/adr/0004-main-fiber-shutdown-join/content.md`  
**SHA-256:** `4c75fdd340657edbdf9aba6aa3525129de6570cc19c791ae06e9c0d82c9b4c43`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Process exit must not leak running fibers that share the GC heap. Fire-and-forget tasks still need defined failure behavior.

## Decision

| Rule | Detail |
| --- | --- |
| Main fiber | `main()` runs on **fiber 0**; scheduler starts before entry |
| Normal exit | When `main` returns, runtime **Join**s every spawned fiber that was not **Detach**ed |
| Detach | **Detach** fibers are **not** joined at shutdown |
| Detach panic | Unjoined **Detach** child panic **still aborts** the process |
| Pool shutdown | After joins complete, worker thread pool stops |

Matches [D-CORE-CONC-0004](/platform-spec/core-library/concurrency/concurrency-package/adr/0004-main-fiber-shutdown/).

## Consequences

Hosts and tests **must** account for shutdown latency from outstanding joins.

## Verification anchors

Runtime main harness; corelib concurrency shutdown tests.
``````

</details>

### Source Record: Fiber scheduler and stacks - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/execution/runtime/fiber-scheduler-and-stacks/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/articles/design-model/content.md`  
**SHA-256:** `fccab2ee4ea41c5700209b86793efc9d1de2acba740a73562aad1c6bf1d2e48e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Scheduler model

- **Run queue(s)** per worker OS thread; work-stealing permitted.
- **Parked** fibers live off-run-queue until **wake** (channel ready, cancel, join completion).
- **`fiber_yield`** — cooperative requeue of current fiber.
- Blocking **syscall** paths park fiber; blocking work runs on thread pool threads that **do not** execute arbitrary Beskid mutator code without attaching GC scope (Phase A: mutator attachment rules stay strict).

## Stack switching

Implementation may use **manual stack swap** coroutines (see [lightweight coroutines in Rust (fibers)](https://medium.com/@ksaritek/building-lightweight-coroutines-in-rust-introducing-rust-fibers-53b91625a9de) for techniques). Requirements:

1. Callee stack aligned to platform ABI.
2. On switch, save callee-saved registers per ABI.
3. GC can enumerate **all fiber stacks** at safepoint (stack maps required).

## Reentrancy (Phase A — closed)

Phase A uses **one process-wide GC arena** (existing `enter_runtime_scope` model). OS worker threads in the pool **must not** execute arbitrary Beskid mutator code concurrently; they run scheduler bookkeeping or blocking syscalls without a second mutator attachment.

Only **one** thread at a time may hold the mutator role for GC allocation in Phase A. The scheduler transfers mutator execution between fibers on that contract. Phase B revisits parallel mutators under **[memory-and-gc-runtime-contract](/platform-spec/execution/runtime/memory-and-gc-runtime-contract/)**.

## Processor count

`ProcessorCount` / `SetProcessorCount` map to worker pool size (Go **GOMAXPROCS** analogue); default logical CPUs.

## Implementation anchors
- `compiler/crates/beskid_runtime/src/scheduler/` — scheduler run queue, parking, and GC safepoints
- `compiler/crates/beskid_runtime/src/fiber/` — fiber lifecycle (spawn, yield, cancel, join)
- `compiler/crates/beskid_abi/src/symbols.rs` — `fiber_spawn`, `fiber_yield`, `fiber_join_value` export symbols
``````

</details>

### Source Record: Fiber scheduler and stacks - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/execution/runtime/fiber-scheduler-and-stacks/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/execution/runtime/fiber-scheduler-and-stacks/articles/verification-and-traceability/content.md`  
**SHA-256:** `e5f9562d489d385405c75804ba5a84ee00c4d1873baf6f43e22af68e2663611b`

<details>
<summary>Migrated source text</summary>

``````markdown
## v0.2 minimum conformance (Q30)

- [ ] `spawn` + **Join** returns `Result` with child value
- [ ] Bounded **Channel** **Send**/**Receive** rendezvous
- [ ] **Yield** schedules another runnable fiber
- [ ] Blocking syscall path parks fiber (thread pool smoke test)
- [ ] **Cancel** surfaces on **Join** and blocked **Receive**
- [ ] Phase A: stress test under single mutator with N fibers
- [ ] **Hub** round-robin: two channels, hot/cold traffic — cold channel receives within bounded turns
- [ ] **Cancel**: **OnCancelled** runs before **Join** returns **Cancelled**
- [ ] Default **Channel** is unbounded (no capacity until **Bounded** set)
- [ ] **JoinWouldDeadlock** diagnostic for child joining parent
- [ ] `Hub<T>` rejects mixed element types at compile time
- [ ] **Mutex.TryLock** returns `None` under contention without parking
- [ ] Unhandled panic in **OnCancelled** aborts process (conformance policy)

## Anchors

- `compiler/crates/beskid_abi/src/symbols.rs`
- `compiler/crates/beskid_analysis/src/builtins.rs`
- `compiler/crates/beskid_runtime/` scheduler module
- Scheduler implementation lives in `compiler/crates/beskid_runtime/src/scheduler/`
``````

</details>
