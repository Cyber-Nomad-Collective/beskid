## ADDED Requirements

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
