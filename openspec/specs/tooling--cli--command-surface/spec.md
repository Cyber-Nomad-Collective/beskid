<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Command surface Specification

## Purpose

Normative command taxonomy for the Beskid CLI and behavior expectations per command family.

## Requirements

### Requirement: Command surface conformance status
This capability SHALL remain non-conformant and MUST NOT be cited as an implemented Beskid guarantee until a validated OpenSpec change adds explicit behavioral requirements.

**Stable ID:** `BSP-REQ-4EBAD9576795`

#### Scenario: Capability has descriptive material only
- **GIVEN** the migrated sources contain no uppercase BCP-14 obligation or accepted ADR decision
- **WHEN** an implementation reports Beskid conformance
- **THEN** it MUST NOT claim conformance based on this capability

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
