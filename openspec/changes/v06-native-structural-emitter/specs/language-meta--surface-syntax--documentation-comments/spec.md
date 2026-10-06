## ADDED Requirements

### Requirement: Indented consecutive documentation lines retain a single attached comment
The parser SHALL accept consecutive `///` documentation lines with horizontal indentation before each line wherever declaration, field, parameter or enum-variant documentation is accepted. It SHALL retain their complete normalized text and source span as one attached documentation block, without recovery, deleted tokens or changed declaration semantics. Ordinary comments SHALL retain their existing non-documentation role.

#### Scenario: SDK enum variant carries an indented two-line comment [DOC0601]
- **GIVEN** an enum variant preceded by two consecutive indented `///` lines
- **WHEN** the source is parsed strictly
- **THEN** parsing SHALL produce no recovery or diagnostics and both documentation lines SHALL attach to that variant

#### Scenario: Record fields retain multiline documentation [DOC0602]
- **GIVEN** a field preceded by consecutive documentation lines with spaces or tabs
- **WHEN** the source is parsed strictly
- **THEN** all lines SHALL attach to the field and its type and name SHALL remain unchanged
