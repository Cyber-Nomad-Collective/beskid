## MODIFIED Requirements

### Requirement: Ship Phase A GC before parallel mutators: Decision [D-EXEC-RT-0005]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Phase | Mutators | Ship order |
> | --- | --- | --- |
> | **A (v0.2)** | One Beskid mutator; many cooperative fibers | **Default ship** |
> | **B** | Parallel mutators | Not implemented: the runtime has no Phase B switch. Parallel execution runs on separate isolates, each with its own heap and one mutator |
> 
> Phase B **must not** become the default without updating this feature hub and fiber
> scheduler contracts.

Phase A SHALL be read per heap, not per process: a process holds many heaps, one per runtime instance, and each heap has one allocator, one collector and one mutator thread. One object SHALL be written by at most one runtime instance at any time. Phase A per heap is preserved when several runtime instances run in parallel, because no two of them share an allocator, a collector or a mutable object.

**Stable ID:** `BSP-REQ-46C4422DC096`  
**Legacy source:** `site/spec-content/platform-spec/execution/runtime/memory-and-gc-runtime-contract/adr/0005-phase-a-before-phase-b/content.md`  
**Source SHA-256:** `e1c463259520657e4c81b6420e3a90e87afaea20ee7f12314a79dec3275d8563`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

#### Scenario: Two runtime instances keep one mutator each
- **GIVEN** two runtime instances created by `IsolateCreate` on two threads
- **WHEN** both allocate at the same time
- **THEN** each allocation lands in its own instance's heap and neither instance's collector marks, sweeps or frees an object in the other heap
