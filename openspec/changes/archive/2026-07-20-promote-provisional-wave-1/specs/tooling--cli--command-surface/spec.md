## ADDED Requirements

### Requirement: Stable CLI command families
The Beskid CLI SHALL expose stable command families for `run`, `build`, `test`, `repl`, `analyze`, `parse`, `format`, `clif`, `doc`, `corelib`, `lock`, `fetch`, `tree`, `update`, `hi` (pluggable dashboard shell), and `new` (project, workspace, and item templates).

#### Scenario: Required families are present
- **GIVEN** an installed Beskid CLI
- **WHEN** a user lists or invokes top-level commands
- **THEN** the stable families listed above are available, including `hi` and `new`

### Requirement: Shared frontend for compilation commands
Commands that invoke compilation SHALL route through shared frontend and analysis services to preserve diagnostic parity across the command surface.

#### Scenario: Diagnostic parity across compile commands
- **GIVEN** a source file that produces an analysis diagnostic
- **WHEN** that file is processed by distinct compilation-invoking CLI commands that share the frontend
- **THEN** the diagnostic identity and messaging remain aligned via the shared frontend and analysis services

### Requirement: Manifest commands share project graph policy
Manifest and dependency commands (`lock`, `fetch`, `tree`, `update`, and related) SHALL operate on the same project graph policy as compile flows.

#### Scenario: Dependency command uses compile graph policy
- **GIVEN** a project with a resolvable dependency graph
- **WHEN** the user runs a manifest or dependency CLI command
- **THEN** resolution follows the same project graph policy used by compile flows

### Requirement: Doc command alignment
CLI documentation generation (`doc`) SHALL remain aligned with corelib and platform-spec evolution.

#### Scenario: Doc tracks platform evolution
- **GIVEN** corelib or platform-spec content that the `doc` command surfaces
- **WHEN** those sources evolve
- **THEN** `beskid doc` output remains aligned with the evolved corelib and platform-spec material

## REMOVED Requirements

### Requirement: Command surface conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
