## ADDED Requirements

### Requirement: Expanded source-unit program assembly
Program assembly MUST own the immutable expanded source units, project identity, generation identities, and import closure consumed by semantic queries and codegen; it MUST NOT persist or expose HIR units.

#### Scenario: Multi-unit assembly identity
- **GIVEN** an entry unit and its dependency import closure
- **WHEN** program assembly completes
- **THEN** every addressable node has a source-unit and generation identity unique within the assembly

## REMOVED Requirements

### Requirement: Primary contract for Program assembly: Decision [D-COMP-BUILD-0015]
**Reason**: The existing primary contract exposes per-unit HIR as assembly state.
**Migration**: Use expanded syntax units and generation-safe semantic facts owned by the assembly session.
