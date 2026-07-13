## ADDED Requirements

### Requirement: Standard entities have stable typed identifiers
Every canonical capability and requirement SHALL have a stable identifier that can be referenced by Book pages, implementation anchors, conformance tests, Tracker bugs, Nexus nodes, and CI evidence.

#### Scenario: A capability is renamed
- **GIVEN** external consumers reference its stable identifier
- **WHEN** its display name or legacy slug changes
- **THEN** the catalog preserves resolution through an explicit alias or rename record

### Requirement: Nexus indexes standard and documentation relations
Beskid Nexus SHALL ingest the OpenSpec catalog and typed Markdown directives as revisioned graph entities and relations, and SHALL invalidate cached links when the catalog revision changes.

#### Scenario: OpenSpec content changes
- **GIVEN** Nexus has indexed an older catalog revision
- **WHEN** a different catalog hash is observed
- **THEN** stale standard links are rebuilt before being served

### Requirement: Traceability distinguishes authority
Traceability views SHALL label OpenSpec requirements as normative, Book and repository documentation as informative, implementation symbols as evidence, and Tracker bugs as observations.

#### Scenario: User opens a cross-linked topic
- **GIVEN** the topic has standard, Book, code, test, and bug relations
- **WHEN** Nexus renders the relation graph
- **THEN** each relation shows its authority type and canonical destination

