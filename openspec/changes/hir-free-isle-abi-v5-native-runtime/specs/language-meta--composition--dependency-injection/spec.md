## ADDED Requirements

### Requirement: Canonical composition activates a compiler-frozen graph
The compiler SHALL resolve every executable `host`, `registry`, `scope`,
field-injection, singular/plural binding, startup, and disposal edge into the
typed-program composition snapshot before lowering. Canonical
`Runtime/Host/Composition.bd` SHALL implement the manifest-declared
`composition_*` export set as the activation and lifetime owner for that
already-validated graph. It SHALL NOT return a fabricated null container,
fabricated false status, unconditional success, or a placeholder result.

The runtime SHALL NOT accept an unvalidated service graph, discover services
from a process-global registry, or make host/registry/scope wiring decisions
that the composition snapshot did not authorize. A container owns only the
registration and activation state emitted from its frozen plan; distinct
containers SHALL NOT alias that state.

#### Scenario: Launch activates the exact composition snapshot
- **GIVEN** an executable typed program whose composition snapshot contains a
  validated host, registrations, and startup plan
- **WHEN** its `launch` statement is lowered and executed
- **THEN** the emitted plan creates one non-null canonical container, installs
  exactly its snapshot registrations before launch, activates startup in the
  snapshot order, and reports failure without activating an unknown service

#### Scenario: An unplanned service cannot be discovered at runtime
- **GIVEN** a canonical composition container for a frozen program plan
- **WHEN** generated code or an external caller requests a service or binding
  that is absent from that plan
- **THEN** canonical composition returns the documented missing/failure result,
  performs no host fallback or process-global lookup, and does not publish a
  partially activated service

### Requirement: Canonical composition owns deterministic scope and teardown state
Canonical composition state SHALL be separately allocated and owned by the
container and active fiber; it SHALL NOT use a Rust host object, legacy bridge,
handler table, literal runtime-state offset, or process-global scope stack.
`composition_scope_enter` and `composition_scope_leave` SHALL maintain a
fiber-local, properly nested scope stack derived from the frozen scope tree.
Resolution SHALL honor the validated innermost-to-global plan, while plural
resolution preserves the plan order. `composition_shutdown` and
`composition_container_drop` SHALL dispose each activated service exactly once
in reverse validated activation order, clear active state, and make stale
handles fail closed.

#### Scenario: Nested scopes do not leak across fibers
- **GIVEN** two fibers executing separate nested `with` scopes for the same
  frozen host plan
- **WHEN** one fiber enters, leaves, or fails within an inner scope
- **THEN** its scope depth and active instances change independently, the other
  fiber observes its own scope stack, and no unresolved or disposed instance is
  returned

#### Scenario: Shutdown is deterministic and stale-safe
- **GIVEN** a launched container with activated disposable services
- **WHEN** shutdown, drop, or a repeated operation is requested
- **THEN** disposal occurs once in reverse activation order, the first valid
  teardown clears the container state, and subsequent use returns failure or a
  null result without dereferencing or recreating the state

### Requirement: Composition lowering has canonical provenance
Composition lowering SHALL lower `launch`, `with`, field injection, singular
injection, and plural injection from generation-bound typed-program facts through the
sole `CodegenInput` → generated ISLE → verifier-clean CLIF path. The compiler
SHALL emit registrations, bindings, scope identifiers, activation, and teardown
from the same frozen composition snapshot that semantic analysis validated.
It SHALL reject a missing, stale, foreign-unit, or unresolved composition fact
before emitting an ABI call.

No produced program or runtime kit may use HIR composition lowering, a Rust
runtime container, host/bridge fallback, legacy handler/dispatch registration,
or an undeclared composition symbol. The canonical source export and its
manifest ABI-v5 declaration SHALL agree exactly on symbol, signature, and
ownership.

#### Scenario: Syntax facts lower a complete launch and scope lifetime
- **GIVEN** a validated `launch` containing nested `with` and field injection
  sites
- **WHEN** canonical lowering and CLIF verification run
- **THEN** the generated control flow installs the frozen bindings, brackets
  every entered scope with one leave on normal and failure paths, invokes only
  manifest-declared composition exports, and contains no HIR or Rust-container
  fallback

#### Scenario: Composition provenance is enforced in an installed kit
- **GIVEN** an installed ABI-v5 runtime kit and an AOT artifact using
  composition
- **WHEN** canonical-source, import allowlist, binary provenance, and runtime
  behavior checks run
- **THEN** every composition export originates from
  `Runtime/Host/Composition.bd`, all calls use the matching manifest ABI-v5
  declaration, and no Rust host/runtime, bridge, dispatch envelope, or
  unapproved symbol is linked
