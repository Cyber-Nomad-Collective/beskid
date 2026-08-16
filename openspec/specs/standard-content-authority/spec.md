# standard-content-authority Specification

## Purpose
This specification establishes OpenSpec as the sole normative authority. It requires deltas for observable behavior changes. It keeps legacy provenance and structural validity enforceable by repository gates.
## Requirements
### Requirement: OpenSpec is the sole normative authority
The Beskid project SHALL store current normative requirements only in `openspec/specs/<capability>/spec.md`. Book pages, READMEs, generated catalogs, application caches, source comments, and archived designs MUST be informative or provenance material. They MUST NOT redefine standard behavior.

#### Scenario: Normative behavior changes
- **GIVEN** a change affects observable language, compiler, runtime, core-library, tooling, or conformance behavior
- **WHEN** the change is proposed for merge
- **THEN** the same change set contains a valid OpenSpec delta for every affected capability

#### Scenario: Informative documentation discusses a rule
- **GIVEN** an informative page explains standard behavior
- **WHEN** the page references a normative rule
- **THEN** it links or embeds the canonical OpenSpec requirement instead of maintaining a second authoritative copy

### Requirement: Legacy content migrates without loss of provenance
The migration SHALL map every custom root, domain, area, feature, article, and ADR node to an OpenSpec capability, requirement, taxonomy record, or archived design record. The migration SHALL retain the original path and source hash in a machine-readable catalog.

#### Scenario: A legacy node is audited
- **GIVEN** any file under `site/spec-content/platform-spec`
- **WHEN** the migration catalog is queried by its legacy slug
- **THEN** exactly one canonical destination and source hash are returned

### Requirement: OpenSpec content is structurally and substantively valid
Every canonical capability SHALL contain named normative requirements that use SHALL or MUST. Each requirement SHALL have at least one testable scenario. Generated placeholder-only requirements MUST fail the repository quality gate.

#### Scenario: Standard validation runs
- **GIVEN** canonical specs or migration inputs changed
- **WHEN** CI validates the standard
- **THEN** OpenSpec strict validation, provenance coverage, placeholder detection, link validation, and normative-density checks all pass

### Requirement: Public standard links remain stable
The platform-spec service SHALL resolve every published legacy `/platform-spec/**` slug through `openspec/catalog.json`. The service SHOULD redirect aliases to canonical capability and requirement anchors. The redirects do not break fragment navigation.

#### Scenario: Existing Book link is followed
- **GIVEN** a Book, Tracker, Nexus, or external link uses a legacy standard slug
- **WHEN** the platform-spec service receives the request
- **THEN** it renders or redirects to the mapped canonical OpenSpec content

