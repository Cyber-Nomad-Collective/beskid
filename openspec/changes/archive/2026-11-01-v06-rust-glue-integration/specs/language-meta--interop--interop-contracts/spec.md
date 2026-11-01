## ADDED Requirements

### Requirement: Normalized Glue binding identity
Each Glue binding SHALL be a generation-bound Glue binding fact over the Glue logical type vocabulary (`GlueBindingFact`, `GlueLogicalType`) and SHALL record backend, canonical library identity, foreign symbol, import/export direction, selected target, C ABI, user FFI layout band, signature semantic shapes and ownership. Identity SHALL be deterministic from these fields, independent of AST numeric IDs or discovery order. Ambiguous or colliding identities and duplicate, repeated-argument or unknown-argument boundary metadata SHALL be rejected before lowering. The Glue logical type vocabulary SHALL be the 0.6 Glue boundary vocabulary. Its unification with Interop.Contracts `TypeShape` and `InteropSignature` is deferred to `v061-glue-extensions`. GC-managed source references SHALL NOT cross as ordinary FFI pointers or wire addresses.

#### Scenario: Identity covers semantics
- **GIVEN** two bindings differ only in ownership, direction, target or library
- **WHEN** normalization and compatibility validation run
- **THEN** they have distinct checked identities and mismatched peers fail before call (R4-BIND-01..03)

#### Scenario: Closed boundary metadata
- **GIVEN** a boundary function with two `Export` attributes, a repeated `Symbol` argument or an unknown argument
- **WHEN** the Glue binding facts are queried
- **THEN** the query rejects the declaration before generation (R4-BIND-04)
