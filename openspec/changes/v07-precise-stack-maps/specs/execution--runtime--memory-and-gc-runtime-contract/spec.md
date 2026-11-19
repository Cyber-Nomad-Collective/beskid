## ADDED Requirements

### Requirement: Precise stack roots from compiler stack maps

The compiler SHALL emit Cranelift stack maps from typed GC-reference facts. The collector SHALL use the published maps for all active and suspended program frames. Generated program stack values SHALL rely solely on these maps in the default compiler. Hosts and runtime-owned objects SHALL retain external roots and handles.

#### Scenario: Temporary survives nested allocation

- **GIVEN** the first argument to a call is a managed temporary with no other owner
- **WHEN** evaluation of the second argument triggers collection
- **THEN** the callee can read the first argument

#### Scenario: Parked fiber resumes after collection

- **GIVEN** a parked fiber holds the sole reference to a managed object
- **WHEN** another fiber collects and the parked fiber resumes
- **THEN** the resumed fiber can read that object

#### Scenario: Native callback and dead stack reference

- **GIVEN** a managed caller keeps an object across a host callback that re-enters the runtime and collects
- **WHEN** the caller resumes
- **THEN** the object remains valid
- **AND** a later collection can reclaim it once all live references disappear
