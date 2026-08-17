## MODIFIED Requirements

### Requirement: Export is the direct C ABI export surface
`[Export]` on a `pub` function SHALL be the direct C ABI export surface. A function annotated with `[Export]` MUST NOT also carry `[GlueExport]`. The reference compiler MUST emit a diagnostic when both `[Export]` and `[GlueExport]` apply to the same function declaration and MUST NOT lower the declaration through either path until the conflict is resolved. The diagnostic SHALL be terminal for that declaration; the reference compiler SHALL NOT silently prefer one surface over the other.

**Stable ID:** `BSP-REQ-GLUE-FFI-002`

#### Scenario: Export-only function lowers through the direct C ABI
- **GIVEN** a `pub` function annotated with `[Export(Abi:"C", Symbol:"beskid_plugin_init")]` and no `[GlueExport]`
- **WHEN** the reference compiler lowers the declaration
- **THEN** it emits a globally linked export symbol and does not produce a glue-mod export binding

#### Scenario: GlueExport-only function lowers through the glue mod
- **GIVEN** a `pub` function annotated with `[GlueExport]` and no `[Export]`
- **WHEN** the reference compiler lowers the declaration
- **THEN** it produces a glue-mod export binding for the foreign library and does not emit a globally linked export symbol

#### Scenario: Dual-annotated function is rejected
- **GIVEN** a `pub` function annotated with both `[Export(Abi:"C")]` and `[GlueExport]`
- **WHEN** the reference compiler processes the declaration
- **THEN** it emits a diagnostic naming the conflict, lowers the declaration through neither path, and does not silently prefer one surface
