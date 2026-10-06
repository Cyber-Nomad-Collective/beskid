## ADDED Requirements

### Requirement: Generation-owned structural contributions
Required serialization generated syntax SHALL cross the Mod ABI as structural contribution items/opaque node handles whose owner, generation, kind, bounds and lifetime are validated. The host SHALL materialize structural nodes without source-string parsing, preserve source/generated provenance, and reject stale or foreign-generation handles. Emitted expressions/types/extend helpers SHALL be validated by current semantic authority and lowered only through TypedProgram → CodegenInput → ISLE → stock-verifier-clean CLIF.

#### Scenario: Structural handle validation (MOD-06-02)
- **GIVEN** a native generator returns valid nodes and a separate stale/foreign handle
- **WHEN** the emit bridge materializes them
- **THEN** valid nodes retain provenance; invalid handles reject and no CodeString reparsing supplies an alternate path

#### Scenario: Instantiated facts authority (MOD-06-02)
- **GIVEN** generic record/enum/array/option/map generated helpers
- **WHEN** semantic and codegen validation run
- **THEN** generation-bound substituted shape/layout/call facts authorize each operation and missing facts produce a diagnostic before lowering

