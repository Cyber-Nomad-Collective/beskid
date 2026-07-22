# standard-content-authority Specification

## Purpose
Establish OpenSpec as the sole normative authority, require deltas for observable behavior changes, and keep legacy provenance and structural validity enforceable by repository gates.
## Requirements
### Requirement: OpenSpec is the sole normative authority
The Beskid project SHALL store current normative requirements only in `openspec/specs/<capability>/spec.md`. Book pages, READMEs, generated catalogs, application caches, source comments, and archived designs MUST be informative or provenance material and MUST NOT redefine standard behavior.

#### Scenario: Normative behavior changes
- **GIVEN** a change affects observable language, compiler, runtime, core-library, tooling, or conformance behavior
- **WHEN** the change is proposed for merge
- **THEN** the same change set contains a valid OpenSpec delta for every affected capability

#### Scenario: Informative documentation discusses a rule
- **GIVEN** an informative page explains standard behavior
- **WHEN** the page references a normative rule
- **THEN** it links or embeds the canonical OpenSpec requirement instead of maintaining a second authoritative copy

### Requirement: Legacy content migrates without loss of provenance
The migration SHALL map every custom root, domain, area, feature, article, and ADR node to an OpenSpec capability, requirement, taxonomy record, or archived design record, and SHALL retain its original path and source hash in a machine-readable catalog.

#### Scenario: A legacy node is audited
- **GIVEN** any file under `site/spec-content/platform-spec`
- **WHEN** the migration catalog is queried by its legacy slug
- **THEN** exactly one canonical destination and source hash are returned

### Requirement: OpenSpec content is structurally and substantively valid
Every canonical capability SHALL contain named normative requirements using SHALL or MUST and at least one testable scenario per requirement. Generated placeholder-only requirements MUST fail the repository quality gate.

#### Scenario: Standard validation runs
- **GIVEN** canonical specs or migration inputs changed
- **WHEN** CI validates the standard
- **THEN** OpenSpec strict validation, provenance coverage, placeholder detection, link validation, and normative-density checks all pass

### Requirement: Public standard links remain stable
The platform-spec service SHALL resolve every published legacy `/platform-spec/**` slug through `openspec/catalog.json` and SHOULD redirect aliases to canonical capability and requirement anchors without breaking fragment navigation.

#### Scenario: Existing Book link is followed
- **GIVEN** a Book, Tracker, Nexus, or external link uses a legacy standard slug
- **WHEN** the platform-spec service receives the request
- **THEN** it renders or redirects to the mapped canonical OpenSpec content

### Requirement: Platform Spec document contexts have canonical authority

Platform Spec SHALL organize canonical content using
`openspec/specs/taxonomy--<domain>/spec.md` for a provisional domain hub,
`openspec/specs/taxonomy--<domain>--<area>/spec.md` for a provisional area hub,
and `openspec/specs/<domain>--<area>--<feature>/spec.md` for a normative feature
specification. A feature MAY own only informative documents at
`openspec/documents/platform-spec/<feature>/articles/<slug>.md` and
`openspec/documents/platform-spec/<feature>/decisions/<number>-<slug>.md`.

Taxonomy hubs MUST NOT be cited as an implemented guarantee merely because
they organize a domain or area. The feature specification remains the sole
normative authority for its requirements; its articles and decisions MUST NOT
redefine standard behavior.

#### Scenario: A feature article is published

- **GIVEN** an article is added for `compiler--front-end--parser`
- **WHEN** its document identity is resolved
- **THEN** its canonical path is under
  `openspec/documents/platform-spec/compiler--front-end--parser/articles/`, its
  parent is the parser feature, and its authority is informative

#### Scenario: A taxonomy hub is rendered

- **GIVEN** a reader follows a taxonomy domain or area link
- **WHEN** the Platform Spec renders the hub
- **THEN** it presents the hub as provisional organization and does not treat it
  as a feature-level conformance guarantee

### Requirement: Platform Spec catalog identities are revisioned and validated

The OpenSpec catalog SHALL record each Platform Spec document's canonical path,
kind, title, parent capability, authority, disposition, and source hash. A
Platform Spec draft SHALL record its immutable catalog `baseRevision` when the
draft is created. The server MUST reject a draft whose base revision differs
from the current catalog revision, and MUST NOT silently rewrite or re-base it.

Catalog generation and Platform Spec server-side validation SHALL reject an
unknown document kind, an invalid canonical path, a parent mismatch, or a
feature document that is not informative.

#### Scenario: A document kind is unknown

- **GIVEN** a catalog record names a Platform Spec document kind other than
  `article` or `decision`
- **WHEN** catalog or server-side validation runs
- **THEN** validation rejects the record before it is published or proposed in
  a pull request

#### Scenario: A draft base revision is stale

- **GIVEN** a Platform Spec editor created a draft at catalog revision `A`
- **AND** the current catalog revision is `B`
- **WHEN** the editor submits the draft
- **THEN** the server rejects it as stale and retains the draft's submitted
  `baseRevision` as `A`

