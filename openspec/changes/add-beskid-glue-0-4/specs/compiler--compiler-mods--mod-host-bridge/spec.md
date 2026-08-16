## MODIFIED Requirements

### Requirement: Glue mod contract ids in the closed SDK set
The `SDK_MOD_CONTRACTS` set SHALL include seven `Beskid.Glue.*` contract ids alongside the existing six compiler mod contract ids: `Beskid.Glue.TypeMapping` (entry method `MapType`), `Beskid.Glue.SymbolEmission` (entry method `EmitSymbol`), `Beskid.Glue.LinkArgs` (entry method `ResolveLinkArgs`), `Beskid.Glue.SignatureReader` (entry method `ReadSignatures`), `Beskid.Glue.SignatureWriter` (entry method `WriteSignatures`), `Beskid.Glue.ToolchainProbe` (entry method `ResolveTool`), and `Beskid.Glue.StdioBridge` (entry method `GenerateBridge`). The seven contract ids SHALL be discovered by the same registration scan as the existing six. The set SHALL remain closed: no contract id is accepted outside the declared set.

**Stable ID:** `BSP-REQ-MOD-HOST-GLUE-CONTRACTS`

#### Scenario: Seven glue contract ids are in the closed set
- **GIVEN** the `SDK_MOD_CONTRACTS` array
- **WHEN** it is enumerated
- **THEN** it contains all seven `Beskid.Glue.*` contract ids with their entry methods alongside the existing six compiler mod contracts

#### Scenario: A glue contract id is discovered by the registration scan
- **GIVEN** a Beskid mod package that implements `Beskid.Glue.TypeMapping`
- **WHEN** the registration scan runs
- **THEN** the mod is registered with the `Beskid.Glue.TypeMapping` contract id and the `MapType` entry method

### Requirement: mod.glue phase id
The pipeline SHALL define a `mod.glue` phase id between `mod.rewrite` and `lower.ready`. The `mod.glue` phase SHALL be inserted into `FULL_BUILD_PHASE_ORDER`, `JIT_RUN_PHASE_ORDER`, and `RUN_AOT_PHASE_ORDER` between `MOD_REWRITE` and `LOWER_READY`. The phase ordering SHALL be asserted: `MOD_REWRITE < MOD_GLUE < LOWER_READY`. 0.4 declares the phase id and ordering; 0.5 wires the orchestrator. Existing phases SHALL NOT be reordered.

**Stable ID:** `BSP-REQ-MOD-HOST-GLUE-PHASE`

#### Scenario: mod.glue is ordered between mod.rewrite and lower.ready
- **GIVEN** the `FULL_BUILD_PHASE_ORDER` array
- **WHEN** the phase indices are compared
- **THEN** `MOD_GLUE` appears after `MOD_REWRITE` and before `LOWER_READY`

#### Scenario: mod.glue is in the JIT and AOT run phase orders
- **GIVEN** the `JIT_RUN_PHASE_ORDER` and `RUN_AOT_PHASE_ORDER` arrays
- **WHEN** they are enumerated
- **THEN** `MOD_GLUE` appears in both arrays between `MOD_REWRITE` and the lowering tail
