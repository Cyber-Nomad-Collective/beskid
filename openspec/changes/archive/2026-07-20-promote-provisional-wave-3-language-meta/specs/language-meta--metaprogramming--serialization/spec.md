## ADDED Requirements

### Requirement: Serialization package split
Serialization MUST be split across three package roles: Serialization Mod (`type: Mod`) defines `[Serialize]` via `AttributeGenerator` and implements `Generator` for serializer emission; Serialization (library) references Serialization Mod and exposes common metadata APIs; Json (library) provides format-specific read/write primitives consumed by generated serializers.

#### Scenario: Host depends on Serialization library
- **GIVEN** a host project that depends on the Serialization library
- **WHEN** the dependency graph is resolved
- **THEN** Serialization Mod is loaded transitively and `[Serialize]` is available without depending on Compiler Mod SDK core for the attribute definition

### Requirement: Attribute ownership and generation model
The `[Serialize]` attribute MUST be defined in Serialization Mod, not in Compiler Mod SDK core. Serialization Mod generators MUST collect types annotated with `[Serialize]` through `Collector` contracts, emit typed AST (for example `extend type` helpers and format adapters) through incremental `Generator` contracts, and MUST NEVER emit formatted source text. Analyzers in Serialization Mod MUST validate serializable shape constraints before lowering.

#### Scenario: Generator emits AST not source text
- **GIVEN** a type annotated with `[Serialize]`
- **WHEN** Serialization Mod generation runs
- **THEN** the mod emits typed AST contributions only and validates serializable shape before lowering

## REMOVED Requirements

### Requirement: Serialization packages conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
