## ADDED Requirements

### Requirement: Single lower-spine type check
Expression and declaration type checking SHALL run exactly once on the lower spine as pipeline phase id `lower.type_check` (`LOWER_TYPE_CHECK`). The reference compiler MUST NOT run a second full body-typing pass under `semantic.type_check`; that phase id is not authoritative for typed HIR or for `E12xx` type diagnostics.

#### Scenario: Type check observed once as lower.type_check
- **GIVEN** a program that requires expression and declaration typing
- **WHEN** the reference compiler runs the production semantic and lower pipeline
- **THEN** full body typing runs under `lower.type_check` and not as a second full pass under `semantic.type_check`

### Requirement: Lower type-check three-pass spine
Within `lower.type_check`, the reference compiler MUST run `index_program` first, then a three-pass spine: surface (`UnitTypeSurface` merge for entry), check (`TypeChecker::check_entry` with constraint solving writing `node_types`), and lowering prep (`LoweringPrep` with `call_kinds` and `cast_intents` keyed by `HirNodeId`). `TypeResult` assembly MUST follow those three passes.

#### Scenario: Index before surface check prep
- **GIVEN** a compilation unit entering `lower.type_check`
- **WHEN** the phase executes
- **THEN** `index_program` completes before the surface, check, and lowering-prep passes assemble `TypeResult`

### Requirement: Structural semantic rules without duplicate typing
Staged semantic rules MAY emit diagnostics that mention types when the check is structural and does not require a completed `TypeResult`, but MUST NOT duplicate full expression typing already performed at `lower.type_check`. CLI analyze, LSP, and `prepare_compilation_diagnostics` MUST surface type errors via the lower spine (or `LowerResolveTypeError::Type` via `emit_type_error`), and consumers MUST treat stable `E12xx` codes as the conformance surface.

#### Scenario: Structural immutability without second type pass
- **GIVEN** staged semantic rule `E1214` immutable-assignment checking
- **WHEN** the semantic pipeline emits that diagnostic
- **THEN** the check remains structural and does not perform a second full expression-typing pass

## REMOVED Requirements

### Requirement: Semantic pipeline stage ordering conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
