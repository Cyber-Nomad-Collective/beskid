# tracker-bug-integration Specification

## Purpose
Limit GitHub synchronization to bugs, remove legacy task mirroring after migration, and require Tracker to resolve standard relations from the versioned OpenSpec catalog.
## Requirements
### Requirement: GitHub synchronization is limited to bugs
Tracker SHALL use GitHub only for public bug intake, bug discussion/status synchronization, and bug references. Roadmap tasks, workstreams, versions, milestones, deliverables, and standard relations SHALL remain in Tracker's SQLite domain model and SHALL NOT be mirrored to GitHub Issues.

#### Scenario: Roadmap task changes
- **GIVEN** a user creates or edits a non-bug Tracker item
- **WHEN** the outbox and webhook processors run
- **THEN** no GitHub issue is created, updated, imported, or linked for that item

#### Scenario: Public bug changes
- **GIVEN** a public bug has a GitHub issue link
- **WHEN** either side changes supported bug fields
- **THEN** the bug-only synchronization pipeline applies the update idempotently

### Requirement: Legacy task sync is removed after migration
Tracker SHALL first disable new task sync, preserve existing GitHub links as read-only migration metadata, migrate issue-number consumers to bug-specific APIs, and only then remove legacy mirror services, UI, scripts, and tables.

#### Scenario: Existing task link is encountered
- **GIVEN** a pre-migration roadmap task contains GitHub metadata
- **WHEN** Tracker reads the task after cutover
- **THEN** the metadata is shown as historical provenance and no synchronization is attempted

### Requirement: Tracker consumes the OpenSpec catalog
Tracker SHALL resolve standard relations from the versioned OpenSpec catalog API rather than the generated legacy navigation-tree file.

#### Scenario: User links a bug to the standard
- **GIVEN** the catalog API is available
- **WHEN** the user searches for a requirement
- **THEN** Tracker stores its stable identifier, canonical URL, revision, and relation type

