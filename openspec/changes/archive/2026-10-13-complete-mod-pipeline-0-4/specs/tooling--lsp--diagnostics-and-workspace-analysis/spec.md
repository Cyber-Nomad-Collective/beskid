## MODIFIED Requirements

### Requirement: Mod analyzer diagnostic bridge to LSP
The LSP server SHALL surface mod analyzer diagnostics as LSP `Diagnostic` values. Each mod diagnostic SHALL map to a `Diagnostic` whose range is derived from the mod diagnostic span, or from a whole-file span when the mod diagnostic carries no span. The LSP SHALL preserve the mod diagnostic code, message, and severity in the `Diagnostic`. The LSP SHALL refresh mod diagnostics whenever the mod host invalidates a document generation. Mod diagnostics SHALL be merged with semantic and documentation diagnostics into the single unified per-URI list using the same stable sort (by span then code) as existing diagnostics.

**Stable ID:** `BSP-REQ-LSP-MOD-DIAG-BRIDGE`

#### Scenario: Spanned mod diagnostic surfaces with its range
- **GIVEN** a mod analyzer diagnostic with span `(start = 10, end = 14)`
- **WHEN** the LSP publishes diagnostics for that URI
- **THEN** the published list contains a `Diagnostic` whose range covers bytes `10..14` with the mod diagnostic's code, message, and severity

#### Scenario: Spanless mod diagnostic surfaces as whole-file
- **GIVEN** a mod analyzer diagnostic with no span
- **WHEN** the LSP publishes diagnostics for that URI
- **THEN** the published list contains a `Diagnostic` whose range covers the whole file

#### Scenario: Mod diagnostics refresh on host invalidation
- **GIVEN** an open buffer with published mod diagnostics
- **WHEN** the mod host invalidates the document generation
- **THEN** the LSP republishes mod diagnostics for that URI

#### Scenario: Mod diagnostics merge into the unified list
- **GIVEN** a URI with semantic, documentation, and mod diagnostics
- **WHEN** the LSP publishes diagnostics for that URI
- **THEN** the published list is the union of all three, stably sorted by span then code
