## ADDED Requirements

### Requirement: Structural enum attributes
Enum declarations SHALL retain leading attributes as ordered structural AST children with their original spans and arguments. Their typed SDK mirrors and syntax contributions SHALL transport the same attributes. Attribute validation SHALL apply the declaration's explicit enum target permission. Serialization Collector SHALL inspect the retained attribute nodes and canonical enum declaration authority, without reparsing source text or treating a variant or type with the same name as the enum target.

#### Scenario: Serializable payload enum
- **GIVEN** a payload enum annotated with the Mod-owned Serialize attribute
- **WHEN** collection and typed generation execute
- **THEN** the enum is selected through its current declaration and its ordered variant payloads are retained in the generated adapter.

#### Scenario: Attribute target denial
- **GIVEN** an attribute declaration excludes enum targets
- **WHEN** it is applied to an enum
- **THEN** semantic validation rejects at the original attribute span.
