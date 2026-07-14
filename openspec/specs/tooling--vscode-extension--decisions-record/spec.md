<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# VS Code extension - Decisions record (legacy index) Specification

## Purpose

Migration index for ADRs under vscode-extension features.

## Requirements

### Requirement: VS Code extension - Decisions record (legacy index) conformance status
This capability SHALL remain non-conformant and MUST NOT be cited as an implemented Beskid guarantee until a validated OpenSpec change adds explicit behavioral requirements.

**Stable ID:** `BSP-REQ-7A546B0B3E1C`

#### Scenario: Capability has descriptive material only
- **GIVEN** the migrated sources contain no uppercase BCP-14 obligation or accepted ADR decision
- **WHEN** an implementation reports Beskid conformance
- **THEN** it MUST NOT claim conformance based on this capability

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: VS Code extension - Decisions record (legacy index)

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/decisions-record/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/decisions-record/content.md`  
**SHA-256:** `1b35d64794f4fc3223b4634c4c55851750281fcae5ce4a374b49ca84e57bc590`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Legacy URL for bookmarks. Read normative text from feature **`adr/`** files and the **ADRs** reader tab on each feature hub.

## Extension surface (`D-TOOL-VSC-0001` … `0005`)

| adrId | Title |
| --- | --- |
| D-TOOL-VSC-0001 | [Four activity-bar views](./extension-surface/adr/0001-four-activity-bar-views/) |
| D-TOOL-VSC-0002 | [focusedProjectUri](./extension-surface/adr/0002-focused-project-uri/) |
| D-TOOL-VSC-0003 | [pckgClient only](./extension-surface/adr/0003-pckg-client-only-http/) |
| D-TOOL-VSC-0004 | [LSP graph only](./extension-surface/adr/0004-lsp-graph-data-only/) |
| D-TOOL-VSC-0005 | [Shared status controller](./extension-surface/adr/0005-shared-status-controller/) |

## Package manager panel

| adrId | Title |
| --- | --- |
| D-TOOL-VSC-0001 | [pckgClient boundary](./package-manager-panel/adr/0001-single-pckg-client-boundary/) |
| D-TOOL-VSC-0002 | [CLI for lock](./package-manager-panel/adr/0002-cli-for-lock-mutations/) |

## Workspace and project explorer

| adrId | Title |
| --- | --- |
| D-TOOL-VSC-0001 | [LSP-backed graph](./workspace-project-explorer/adr/0001-lsp-backed-graph/) |
| D-TOOL-VSC-0002 | [Focus without restart](./workspace-project-explorer/adr/0002-focus-without-lsp-restart/) |

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
