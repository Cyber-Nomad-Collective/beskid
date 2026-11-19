## ADDED Requirements

### Requirement: Preserving dependency intent mutation
Add SHALL accept package[@version] and optional --project or --path, reject incompatible selectors, unsupported range expressions and dependency Git sources, and record exact selected registry intent or selected path intent. Identical repeated add and absent repeated remove SHALL be no-ops; conflicting source/version add SHALL fail with guidance to use explicit update --version or remove. Edits SHALL preserve comments, attributes, line endings, Unicode and unrelated BSOL bytes outside edited dependency spans, and SHALL validate edited text before resolution.

#### Scenario: DEP06-01 Text preservation
- **GIVEN** CRLF/Unicode/comments and unrelated blocks around a manifest dependency section
- **WHEN** add/remove changes one dependency
- **THEN** all untouched byte spans remain identical and edited BSOL validates

#### Scenario: DEP06-01 Repetition and conflict
- **GIVEN** a declared exact registry dependency
- **WHEN** same add is repeated then a conflicting source add is attempted
- **THEN** repeat makes no writes and conflict fails without overwriting intent

#### Scenario: DEP06-01 Unsupported sources
- **GIVEN** a Git or range selector
- **WHEN** add parses it
- **THEN** the CLI returns usage guidance without claiming materialization support

### Requirement: Unambiguous mutation targeting
Mutation SHALL select a unique project inferred from input context or explicit --project; multiple candidates SHALL fail with sorted candidate manifests and exact --project guidance without interactive selection. An explicit member SHALL modify only that member. Relative path dependency intent SHALL resolve from the selected manifest parent, including paths with spaces; malformed or duplicate dependency declarations SHALL fail before edits.

#### Scenario: DEP06-01 Workspace ambiguity
- **GIVEN** a workspace with multiple equally eligible projects
- **WHEN** add runs without --project
- **THEN** it fails listing candidates and leaves all member manifests/locks unchanged

#### Scenario: DEP06-01 Explicit member path
- **GIVEN** two members and a relative path containing spaces
- **WHEN** add --project selects one member with --path
- **THEN** only selected member changes and path base is its manifest parent

