## MODIFIED Requirements

### Requirement: Span-preserving mod diagnostic transport
Diagnostics emitted during the mod analyze phase SHALL preserve source spans through the query and diagnostics facades. A mod analyzer diagnostic that carries a span SHALL reach the facade with that span intact. A mod analyzer diagnostic that carries no span SHALL reach the facade as a whole-file diagnostic anchored from byte `0` to the source length. The facade SHALL NOT strip, coalesce, or fabricate a span for a mod diagnostic. The facade SHALL use the same transport, code strings, and severity mapping as semantic diagnostics from `beskid_analysis` so CLI and LSP remain interchangeable.

**Stable ID:** `BSP-REQ-MOD-DIAG-FACADE-SPAN`

#### Scenario: Spanned mod diagnostic preserves its span
- **GIVEN** a mod analyzer diagnostic with span `(start = 10, end = 14)`
- **WHEN** the diagnostic is read through the query/diagnostics facade
- **THEN** the facade exposes the same span `(10, 14)` and the same code, message, and severity

#### Scenario: Spanless mod diagnostic becomes whole-file
- **GIVEN** a mod analyzer diagnostic with no span
- **WHEN** the diagnostic is read through the query/diagnostics facade
- **THEN** the facade exposes a whole-file span from `0` to the source length and does not drop the diagnostic

#### Scenario: Mod diagnostics use the same transport as semantic diagnostics
- **GIVEN** a mod analyzer diagnostic and a semantic diagnostic with the same code and severity
- **WHEN** both are read through the facade
- **THEN** they use the same transport shape, code string, and severity mapping
