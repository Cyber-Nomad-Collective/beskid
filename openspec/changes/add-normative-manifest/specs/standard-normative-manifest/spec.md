## ADDED Requirements

### Requirement: The manifest is composed of chaptered JSON documents
The Normative Manifest SHALL be composed of chapters, each a separate JSON document, covering at minimum an Introduction chapter, a Syntax Index chapter, a Corelib and Runtime chapter, and an ISLE and Lowering chapter. Each chapter JSON document SHALL declare its chapter identifier, title, and an ordered list of entries, and SHALL NOT embed normative requirement text that duplicates a canonical OpenSpec requirement.

#### Scenario: A reader opens the manifest
- **GIVEN** the platform-spec site serves the Normative Manifest
- **WHEN** a reader requests the manifest
- **THEN** at least the Introduction, Syntax Index, Corelib and Runtime, and ISLE and Lowering chapters are present and addressable as distinct JSON documents

#### Scenario: A chapter duplicates a canonical requirement
- **GIVEN** a manifest chapter entry describes behavior already normatively defined in an OpenSpec capability
- **WHEN** the chapter is authored
- **THEN** the entry references the canonical capability and requirement by stable identifier instead of restating the normative obligation text

### Requirement: The manifest is viewable as a rendered page
The platform-spec site SHALL render the Normative Manifest as a single navigable page that presents the chapters in declared order, lists each chapter's entries, and resolves every platform spec capability reference and source code file reference to a reachable link or anchor.

#### Scenario: A reader views the rendered manifest
- **GIVEN** the manifest chapter JSON documents are present
- **WHEN** the platform-spec site renders the manifest page
- **THEN** chapters appear in declared order, each entry is visible with its description and references, and platform spec and source code references are rendered as links

#### Scenario: A referenced capability does not exist
- **GIVEN** a manifest entry references a platform spec capability identifier
- **WHEN** the rendered page resolves the reference
- **THEN** the link points at the canonical capability path or is reported as an unresolved reference rather than silently omitted

### Requirement: The manifest is exportable as a complete normative document
The platform-spec site SHALL provide an export of the complete Normative Manifest as a single JSON document containing every chapter in declared order, and SHALL provide a rendered export of the same content as a self-contained normative document. The JSON export SHALL be deterministic for a given catalog revision.

#### Scenario: A consumer downloads the JSON export
- **GIVEN** the manifest is served at a given catalog revision
- **WHEN** a consumer requests the JSON export
- **THEN** a single JSON document is returned containing every chapter and entry in declared order

#### Scenario: The same revision is exported twice
- **GIVEN** the catalog revision is unchanged
- **WHEN** the JSON export is generated twice
- **THEN** both exports are byte-identical for the same revision

### Requirement: The Syntax Index chapter enumerates every syntax structure
The Syntax Index chapter SHALL enumerate each Beskid surface syntax structure with a human-readable description, at least one concrete example, a reference to the platform spec capability that normatively defines it, and a reference to the source code file that implements or declares it. The enumeration SHALL cover the structures defined by the canonical grammar and parser contract capabilities.

#### Scenario: A syntax structure is catalogued
- **GIVEN** a Beskid surface syntax structure is defined by a canonical OpenSpec capability
- **WHEN** the Syntax Index chapter is authored
- **THEN** the structure has an entry with a description, at least one example, a platform spec capability reference, and a source code file reference

#### Scenario: A syntax structure lacks a source reference
- **GIVEN** a Syntax Index entry omits its source code file reference
- **WHEN** the manifest is validated
- **THEN** the entry is rejected until a source code file path is supplied

### Requirement: Each chapter entry references capabilities and source files
Every manifest chapter entry SHALL reference one or more platform spec capability identifiers and one or more source code file paths. Capability references SHALL use stable capability identifiers resolvable through `openspec/catalog.json`, and source code file references SHALL be repository-relative paths.

#### Scenario: An entry references a capability by stable identifier
- **GIVEN** a manifest entry names a platform spec capability
- **WHEN** the reference is resolved through `openspec/catalog.json`
- **THEN** exactly one canonical capability is returned

#### Scenario: An entry references a source file
- **GIVEN** a manifest entry names a source code file path
- **WHEN** the reference is resolved
- **THEN** the path is repository-relative and points at an existing source file

### Requirement: The Introduction chapter documents compiler dependencies
The Introduction chapter SHALL document the open-source projects and compiler dependencies used by Beskid and SHALL describe how each is used. The chapter SHALL cover at minimum abfall, pest, cranelift and ISLE, salsa, and fibers, and SHALL reference the platform spec capabilities and source code files that govern each dependency's integration.

#### Scenario: A compiler dependency is documented
- **GIVEN** Beskid depends on an open-source project in its compiler or runtime
- **WHEN** the Introduction chapter is authored
- **THEN** the project is named, its role in Beskid is described, and a platform spec capability and source code file reference are provided

#### Scenario: A required dependency is missing
- **GIVEN** the Introduction chapter omits abfall, pest, cranelift or ISLE, salsa, or fibers
- **WHEN** the manifest is validated
- **THEN** validation fails until every required dependency is documented

### Requirement: The manifest is served from platform-spec and linked from reader navigation
The platform-spec site SHALL serve the Normative Manifest at a stable public route and SHALL link to it from the reader navigation so the manifest is reachable without knowing its URL. The served manifest SHALL reflect the current `openspec/catalog.json` revision.

#### Scenario: A reader reaches the manifest from navigation
- **GIVEN** a reader is on any platform-spec page
- **WHEN** the reader uses the navigation
- **THEN** a link to the Normative Manifest is present and resolves to the stable manifest route

#### Scenario: The manifest reflects the current catalog revision
- **GIVEN** `openspec/catalog.json` is regenerated at a new revision
- **WHEN** the platform-spec site serves the manifest
- **THEN** the rendered and exported manifest reflects the new revision's capabilities and source references
