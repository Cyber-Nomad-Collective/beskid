<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Command surface Specification

## Purpose

Normative command taxonomy for the Beskid CLI and behavior expectations per command family.

## Requirements

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

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Command surface

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/cli/command-surface/`  
**Source:** `site/spec-content/platform-spec/tooling/cli/command-surface/content.md`  
**SHA-256:** `b39ee4bdeee31fbd3be3353c0af291da4818445c233d7fe1f0b5b084c0fea5ae`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative platform contract

1. The CLI shall expose stable command families for `run`, `build`, `test`, `repl`, `analyze`, `parse`, `format`, `clif`, `doc`, `corelib`, `lock`, `fetch`, `tree`, `update`, **`hi`** (pluggable dashboard shell), and **`new`** (project, workspace, and item templates).
2. Commands that invoke compilation shall route through shared frontend and analysis services to preserve diagnostic parity.
3. Manifest and dependency commands shall operate on the same project graph policy as compile flows.
4. CLI documentation generation (`doc`) shall remain aligned with corelib and platform-spec evolution.

## Implementation anchors

- `compiler/crates/beskid_cli/src/commands`
- `compiler/crates/beskid_cli/src/cli.rs`
- `compiler/crates/beskid_tools` — shared pipeline UI, pluggable shell (`beskid_tools::shell`), diagnostics, session, registry helpers
- `compiler/crates/beskid_cli/src/commands/hi.rs` — `beskid hi` dashboard entrypoint

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>
