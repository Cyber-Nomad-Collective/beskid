## MODIFIED Requirements

### Requirement: Glue-backend extraction path for foreign-library imports
A foreign-library import declared with `[GlueImport]` SHALL be extracted during lowering as a `GlueTag` carrying the backend kind (`GlueBackendKind::Rust` or `GlueBackendKind::DotNet`) and the library identity. The `GlueTag` SHALL drive an emission path through the seven atomized glue contracts (`TypeMapping`, `SymbolEmission`, `LinkArgs`, `SignatureReader`, `SignatureWriter`, `ToolchainProbe`, `StdioBridge`) rather than a link-time `ExternImport` row. The extraction SHALL NOT produce an `ExternImport` record for a `[GlueImport]` import. The CLIF extraction path SHALL remain the path for `Extern` imports and SHALL produce `ExternImport` rows. A single import SHALL use exactly one extraction path; the CLIF and glue paths SHALL NOT mix for a single import. For 0.4, the glue extraction path SHALL fail closed with `BackendError::NotImplementedFor0_4` until the 0.5 implementation lands; the CLIF path SHALL remain the production path.

**Stable ID:** `BSP-REQ-GLUE-EXTRACT-001`

#### Scenario: GlueImport import extracts to a GlueTag
- **GIVEN** a `contract` declaration annotated with `[GlueImport(Library:"foreign_lib")]` compiled with a glue backend
- **WHEN** the codegen pipeline extracts the import during lowering
- **THEN** it produces a `GlueTag` carrying the backend kind and library identity `foreign_lib` and does not produce an `ExternImport` row

#### Scenario: Extern import extracts to an ExternImport row
- **GIVEN** a `contract` declaration annotated with `Extern(Abi:"C", Library:"libc")` compiled with the CLIF backend
- **WHEN** the codegen pipeline extracts the import during lowering
- **THEN** it produces an `ExternImport` row with the symbol, abi, and library and does not produce a `GlueTag`

#### Scenario: Glue extraction drives the emission path
- **GIVEN** an extracted `GlueTag` for a `[GlueImport]` import
- **WHEN** the codegen pipeline runs the glue emission
- **THEN** it drives the emission through the seven glue mod contracts and does not resolve the import through the platform linker

#### Scenario: Glue extraction fails closed in 0.4
- **GIVEN** a `[GlueImport]` import compiled with a glue backend in 0.4
- **WHEN** the codegen pipeline attempts the glue emission
- **THEN** it fails closed with `BackendError::NotImplementedFor0_4` and the CLIF path remains the production path
