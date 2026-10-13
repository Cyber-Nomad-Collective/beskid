## ADDED Requirements

### Requirement: Platform Spec edits are pull-request-backed
Platform Spec SHALL create or update normative OpenSpec edits only through an
authenticated GitHub pull request. Each edit batch SHALL record the catalog
revision from which it was created.

#### Scenario: An editor submits an OpenSpec change
- **GIVEN** the editor has GitHub write access and a current catalog revision
- **WHEN** the editor submits a deterministic batch of changes
- **THEN** Platform Spec creates or reuses one pull request for that batch and
  does not directly mutate normative OpenSpec content

#### Scenario: An editor uses a stale catalog revision
- **GIVEN** the submitted edit batch names a catalog revision different from
  the current revision
- **WHEN** Platform Spec validates the batch
- **THEN** it rejects the batch with a catalog revision conflict

### Requirement: Tracker links are revisioned
Tracker SHALL persist each OpenSpec link with a stable `standardId`, the
resolved `catalogRevision`, and a typed relationship.

#### Scenario: A catalog revision changes
- **GIVEN** a Tracker task links to an earlier OpenSpec catalog revision
- **WHEN** Tracker reconciles delivery data against a newer revision
- **THEN** it identifies the link as stale rather than silently resolving it
  against the newer catalog

### Requirement: Tracker is the delivery version authority
Tracker SHALL own delivery version status and visibility. A public latest
delivery SHALL reference only a version with `Released` status and `public`
visibility.

#### Scenario: A planned version is public
- **GIVEN** a Tracker version has `Planned` status and `public` visibility
- **WHEN** a public latest delivery is selected
- **THEN** the version is excluded

#### Scenario: A released public version is selected
- **GIVEN** a Tracker version has `Released` status and `public` visibility
- **WHEN** a public latest delivery is selected
- **THEN** the version is eligible for selection

### Requirement: GitHub synchronization is bug-only
Tracker SHALL synchronize GitHub issues only for bugs and their references. It
SHALL NOT synchronize delivery versions, tasks, workstreams, or specification
links to or from GitHub.

#### Scenario: A Tracker task changes
- **GIVEN** a non-bug Tracker task is edited
- **WHEN** synchronization is evaluated
- **THEN** Tracker does not enqueue a GitHub operation for that task
