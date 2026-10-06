## ADDED Requirements

### Requirement: Delivered Glue Mod contract execution
The mod.glue phase SHALL invoke registered TypeMapping(MapType), SymbolEmission(EmitSymbol), LinkArgs(ResolveLinkArgs), SignatureReader(ReadSignatures), SignatureWriter(WriteSignatures), ToolchainProbe(ResolveTool/ValidateTool) and StdioBridge(GenerateBridge) implementations as required by the binding direction/backend. Glue rules SHALL execute from Beskid type=Mod packages through the existing registered host seam; a Rust-only bypass or annotation-counting unchanged-program scaffold SHALL NOT satisfy delivery. Inputs/outputs SHALL be typed, deterministic, normalized and validated; malformed outputs, missing required registration, duplicate conflicting registration or contract failure SHALL terminate generation with binding/source context. Generated Beskid adapters SHALL use canonical typed emitter/query authority, never rebuild retired lowering paths.

#### Scenario: Actual Mods run
- **GIVEN** a binding and registered implementations emitting observable valid outputs
- **WHEN** mod.glue runs
- **THEN** the required implementations execute and their validated output changes the resulting adapter/artifact (R4-GEN-04)

#### Scenario: Failed or absent Mod terminal
- **GIVEN** a required registration is absent or a contract returns invalid/conflicting output
- **WHEN** Glue runs
- **THEN** generation stops with contextual diagnostic and no build/call proceeds (R4-GEN-05)

#### Scenario: Deterministic invocation
- **GIVEN** equivalent inputs arrive in different source discovery orders
- **WHEN** the phase runs twice
- **THEN** normalized outputs/artifact identities are identical (R4-GEN-06)
