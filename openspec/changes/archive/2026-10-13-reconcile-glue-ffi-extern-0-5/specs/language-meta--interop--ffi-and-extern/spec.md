## MODIFIED Requirements

### Requirement: Extern is the direct C ABI import surface
`Extern` on a `contract` declaration SHALL be the direct C ABI import surface. A `contract` declaration annotated with `Extern` MUST NOT also carry `[GlueImport]`. The reference compiler MUST emit a diagnostic when both `Extern` and `[GlueImport]` apply to the same `contract` declaration and MUST NOT lower the declaration through either path until the conflict is resolved. The diagnostic SHALL be terminal for that declaration; the reference compiler SHALL NOT silently prefer one surface over the other.

**Stable ID:** `BSP-REQ-GLUE-FFI-001`

#### Scenario: Extern-only contract lowers through the direct C ABI
- **GIVEN** a `contract` declaration annotated with `Extern(Abi:"C", Library:"libc")` and no `[GlueImport]`
- **WHEN** the reference compiler lowers the declaration
- **THEN** it produces a link-time `ExternImport` row and does not produce a `GlueTag` binding

#### Scenario: GlueImport-only contract lowers through the glue mod
- **GIVEN** a `contract` declaration annotated with `[GlueImport(Library:"foreign_lib")]` and no `Extern`
- **WHEN** the reference compiler lowers the declaration
- **THEN** it produces a `GlueTag` binding for the foreign library and does not produce a link-time `ExternImport` row

#### Scenario: Dual-annotated contract is rejected
- **GIVEN** a `contract` declaration annotated with both `Extern(Abi:"C", Library:"libc")` and `[GlueImport(Library:"foreign_lib")]`
- **WHEN** the reference compiler processes the declaration
- **THEN** it emits a diagnostic naming the conflict, lowers the declaration through neither path, and does not silently prefer one surface
