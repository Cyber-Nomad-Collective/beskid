## ADDED Requirements

### Requirement: Parsed declaration dependency authority
Compilation-unit import closure SHALL derive import and out-of-line module declaration paths from canonical parsed syntax. It SHALL recognize declaration boundaries independent of physical line placement, preserve original declaration paths independently of aliases, and traverse imports inside inline modules. Qualified-reference discovery SHALL traverse actual qualified expression and type paths, including generic arguments, from the same owned parsed program. Whole module-path prefixes SHALL be collected without inventing suffix fragments. Comments and string values SHALL NOT grant dependency authority. Artifact import metadata SHALL consume the materialized unit's owned parsed program rather than rescan source text.

#### Scenario: RES06-IMPORT-01 Same-line and multiline declarations
- **GIVEN** valid imports share a physical line with another import or type declaration, or span lines and comments
- **WHEN** import-closure assembly discovers dependencies
- **THEN** each canonical declaration path is followed and following declarations are not appended to that path

#### Scenario: RES06-IMPORT-02 Aliases and lookalikes
- **GIVEN** aliased imports, imports inside inline modules, and import-like text inside comments or string values
- **WHEN** dependency paths are collected
- **THEN** actual imports retain their original paths and comment/string text grants no dependency authority

#### Scenario: RES06-IMPORT-07 Qualified generic and transitive references
- **GIVEN** actual qualified calls and type paths with qualified generic arguments, alongside dotted comment or string text
- **WHEN** transitive import-closure discovery runs
- **THEN** actual syntax contributes its complete module-prefix candidates and comment/string text contributes none; a suffix fragment of another path is not a new candidate

### Requirement: Explicit assembly recovery authority policy
Assembly recovery policy SHALL default to Strict independently of materializer presence. Strict import-closure assembly SHALL reject malformed or recovered source before following dependency paths and SHALL retain its actual parse diagnostic message, code and source bounds. EditorRetainRecovered SHALL permit existing parser/materializer recovery for editor syntax UX while granting no import, module declaration or qualified-reference discovery authority to that malformed or recovered unit. A declared non-entry skip-parse-errors policy SHALL skip unreadable or malformed dependency units before following their paths; it SHALL NOT waive strict entry-source errors. Recovery policy SHALL participate in assembly cache identity.

#### Scenario: RES06-IMPORT-03 Strict recovery diagnostics
- **GIVEN** a source requires canonical parser recovery and a materializer is installed
- **WHEN** Strict import-closure assembly runs
- **THEN** it fails before materialization with the actual diagnostic details and the materializer does not implicitly enable editor policy

#### Scenario: RES06-IMPORT-04 Editor recovery
- **GIVEN** EditorRetainRecovered and a recoverable entry containing import-like or repaired declarations
- **WHEN** editor assembly runs
- **THEN** its recovered syntax may be materialized for UX and that unit contributes no dependency-discovery paths

#### Scenario: RES06-IMPORT-05 Non-entry skip policy
- **GIVEN** a valid entry imports an unreadable or malformed dependency and non-entry skip-parse-errors is enabled
- **WHEN** import-closure discovery runs
- **THEN** the invalid dependency is skipped before any paths in it authorize additional units and the entry remains materialized

#### Scenario: RES06-IMPORT-06 Cache policy separation
- **GIVEN** identical source and dependencies were assembled under one recovery policy
- **WHEN** the recovery policy changes
- **THEN** assembly revalidates the selected policy instead of reusing another policy's authority result
