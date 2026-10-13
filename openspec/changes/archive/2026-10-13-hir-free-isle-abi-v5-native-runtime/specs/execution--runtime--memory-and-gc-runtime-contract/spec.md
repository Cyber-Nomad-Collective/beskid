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

### Requirement: Canonical external-root registry count
The canonical Beskid runtime SHALL expose exactly one
`gc_external_root_count` C-ABI export. Its result SHALL equal the number of
currently registered external root slots in the canonical root registry; it
SHALL NOT report temporary handle-table occupancy. Registering one previously
unregistered root slot SHALL change the count from zero to one, and
unregistering that slot SHALL restore the count to zero. Collection SHALL trace
the same registry represented by this count.

#### Scenario: External-root count follows registry lifetime
- **GIVEN** an initialized canonical heap with no registered external roots
- **WHEN** a host registers one root slot, collects, and unregisters that slot
- **THEN** `gc_external_root_count` reports `0`, then `1`, then `0`, and the
  registered object remains reachable during the collection

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
