## ADDED Requirements

### Requirement: Canonical ABI-v5 managed heap
The canonical Beskid runtime corpus SHALL own the Phase-A non-moving precise
managed heap, root traversal, marking, sweeping, and write-barrier surface.
`BeskidObjectHeader`, `BeskidTypeDescriptor`, and `BeskidAllocationRequest`
layouts SHALL be derived from `runtime_manifest.bsol`; generated code SHALL
retain values across allocation-capable calls only through manifest-approved
root-frame authority. The runtime SHALL not link, instantiate, or use Abfall,
the Rust `beskid_runtime` crate, or any alternate collector in a produced
program.

#### Scenario: Canonical heap traces a rooted object graph
- **GIVEN** a root frame containing an object graph described by valid pointer
  maps
- **WHEN** the canonical runtime performs a collection
- **THEN** reachable objects remain allocated, unreachable objects are swept,
  and no Rust collector or fallback allocation path participates

### Requirement: Phase-A mutator boundary
Phase A SHALL permit one managed mutator at a time while cooperative fibers and
platform workers execute according to the scheduler contract. A platform worker
SHALL NOT perform generated allocation or execute arbitrary generated Beskid
code. Parallel-mutator collection SHALL remain unavailable until a separate
normative Phase-B change defines and verifies it.

#### Scenario: Worker allocation is rejected
- **GIVEN** a non-mutator platform worker
- **WHEN** it attempts a generated managed allocation
- **THEN** the runtime rejects the attempt before heap mutation

## REMOVED Requirements

### Requirement: Abfall tri-color heap with write barriers: Decision [D-EXEC-RT-0006]

