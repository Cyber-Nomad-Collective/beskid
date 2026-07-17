## ADDED Requirements

### Requirement: Generation-safe typed program contract
The analysis boundary MUST produce `TypedProgram { project, entry, generation, assembly }`, and all type facts MUST resolve through the matching syntax generation without containing or wrapping HIR.

#### Scenario: Analysis-to-codegen handoff
- **GIVEN** an expanded program that passes semantic validation
- **WHEN** analysis completes
- **THEN** it returns one typed-program identity whose keys all belong to its project and generation

## REMOVED Requirements

### Requirement: Primary contract for Type-system pass contract: Decision [D-COMP-SEM-0015]
**Reason**: The existing contract makes `TypeResult` over typed HIR the semantic source of truth.
**Migration**: Consumers query generation-safe Salsa facts through `TypedProgram`.
