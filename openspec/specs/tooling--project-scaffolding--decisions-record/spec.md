<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Project scaffolding - Decisions record (legacy index) Specification

## Purpose

Migration index for ADRs under project-scaffolding features—normative text lives in adr/ files.

## Requirements

### Requirement: Project scaffolding - Decisions record (legacy index) conformance status
This capability SHALL remain non-conformant and MUST NOT be cited as an implemented Beskid guarantee until a validated OpenSpec change adds explicit behavioral requirements.

**Stable ID:** `BSP-REQ-D809909BECE9`

#### Scenario: Capability has descriptive material only
- **GIVEN** the migrated sources contain no uppercase BCP-14 obligation or accepted ADR decision
- **WHEN** an implementation reports Beskid conformance
- **THEN** it MUST NOT claim conformance based on this capability

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Project scaffolding - Decisions record (legacy index)

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/decisions-record/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/decisions-record/content.md`  
**SHA-256:** `239a991bffbb59c14174086abd0c7e6bda7320d126e1fe2a5946d223d107a594`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Legacy URL for bookmarks. Normative decisions **must** be read from feature **`adr/`** files and each feature hub **ADRs** reader tab.

## Project templates (`D-TOOL-SCAFF-0001` … `0010`)

| adrId | Title |
| --- | --- |
| D-TOOL-SCAFF-0001 | [Beskid-native template engine](./project-templates/adr/0001-beskid-template-v1-engine/) |
| D-TOOL-SCAFF-0002 | [{{ }} placeholders](./project-templates/adr/0002-placeholder-delimiters/) |
| D-TOOL-SCAFF-0003 | [No runnable template root](./project-templates/adr/0003-no-runnable-template-root/) |
| D-TOOL-SCAFF-0004 | [corelib always on](./project-templates/adr/0004-corelib-always-on/) |
| D-TOOL-SCAFF-0005 | [Template kinds v1](./project-templates/adr/0005-template-kinds-v1/) |
| D-TOOL-SCAFF-0006 | [Path and git sources](./project-templates/adr/0006-path-and-git-sources/) |
| D-TOOL-SCAFF-0007 | [No constraint blocks](./project-templates/adr/0007-no-constraint-blocks/) |
| D-TOOL-SCAFF-0008 | [Post-actions catalog](./project-templates/adr/0008-unrestricted-post-actions/) |
| D-TOOL-SCAFF-0009 | [Update check on use](./project-templates/adr/0009-update-check-on-use/) |
| D-TOOL-SCAFF-0010 | [Yanked template warning](./project-templates/adr/0010-yanked-template-warning/) |

## beskid new (`D-TOOL-SCAFF-0001` … `0003` per feature)

| adrId | Title |
| --- | --- |
| D-TOOL-SCAFF-0001 | [beskid new command](./beskid-new/adr/0001-beskid-new-command-name/) |
| D-TOOL-SCAFF-0002 | [Interactive modes](./beskid-new/adr/0002-interactive-and-noninteractive/) |
| D-TOOL-SCAFF-0003 | [Update on instantiate](./beskid-new/adr/0003-update-check-on-instantiate/) |

## Template packages

| adrId | Title |
| --- | --- |
| D-TOOL-SCAFF-0001 | [Explicit packageKind](./template-packages/adr/0001-explicit-package-kind/) |
| D-TOOL-SCAFF-0002 | [Template registry UI](./template-packages/adr/0002-template-registry-ui-mode/) |
| D-TOOL-SCAFF-0003 | [No api.json for templates](./template-packages/adr/0003-no-api-json-for-templates/) |

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
