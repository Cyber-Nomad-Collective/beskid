<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# beskid new command Specification

## Purpose

Normative CLI for listing, installing, and instantiating Beskid templates.

## Requirements

### Requirement: beskid new command: Decision [D-TOOL-SCAFF-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Command **must** be `beskid new`.

**Stable ID:** `BSP-REQ-8CEE70953D12`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/beskid-new/adr/0001-beskid-new-command-name/content.md`  
**Source SHA-256:** `b7c93a3fd226db88075355825e313475c4c4753082e61f4cb850010bf73b0d67`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Interactive modes: Decision [D-TOOL-SCAFF-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Support interactive and non-interactive instantiation.

**Stable ID:** `BSP-REQ-70FF7E71DBDB`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/beskid-new/adr/0002-interactive-and-noninteractive/content.md`  
**Source SHA-256:** `d3311985edee800289fc3f1e9f2559024442a57116e4b59a7be3a899fc3c829a`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Update on instantiate: Decision [D-TOOL-SCAFF-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Run template update check when online.

**Stable ID:** `BSP-REQ-27CF8797D477`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/beskid-new/adr/0003-update-check-on-instantiate/content.md`  
**Source SHA-256:** `737ef7841e4becd8ac98afde35b7271c25899c89d205a58b502103cbffd79348`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: beskid new command

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/beskid-new/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/beskid-new/content.md`  
**SHA-256:** `7495365bf550e4068a63cb6eccb990619be2dee95fbe47bf1e8b38ccb9dc99e2`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
The **`beskid new`** command family — list, install, uninstall, and instantiate templates from registry, path, or git with interactive and flag-driven parameters.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/crates/beskid_cli/src/cli.rs` — subcommand tree
- `compiler/crates/beskid_cli/src/commands/new.rs` — Clap args and dispatch
- `compiler/crates/beskid_template::service` — list / install / uninstall / instantiate
- `compiler/crates/beskid_tools::registry` — shared pckg client helpers
- `compiler/crates/beskid_pckg` — registry download
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
The Beskid CLI **must** expose a top-level **`beskid new`** command family for template discovery, installation, and instantiation. This is the **only** normative user entrypoint for scaffolding; `beskid pckg` remains publish/upload only.
</SpecSection>

<SpecSection title="Command taxonomy" id="command-taxonomy">
| Command | Obligation |
| --- | --- |
| `beskid new list` | List installed and optionally online templates |
| `beskid new install <package\|path\|git>` | Cache template for offline use |
| `beskid new uninstall <shortName\|package>` | Remove cached template |
| `beskid new <shortName> [options]` | Instantiate installed template by short name |
| `beskid new --path ...` | Instantiate without prior install |
| `beskid new --git ...` | Instantiate from git source |
| `beskid new --package <id>[@version]` | Instantiate from registry (install if needed) |

Global options documented in [contracts and edge cases](./contracts-and-edge-cases/).
</SpecSection>

<SpecSection title="First-party templates" id="first-party-templates">
When the registry is reachable, the CLI **must** resolve **`beskid.templates.console`**, **`beskid.templates.lib`**, and **`beskid.templates.project`** from pckg—not from files shipped inside the CLI binary. Short names **`console`**, **`lib`**, and **`template`** map to those packages when unambiguous.
</SpecSection>

<SpecSection title="Decisions" id="decisions">
No open decisions. Closed choices: **`D-TOOL-SCAFF-0001`** (`beskid new` command), **`0002`** (interactive modes), **`0003`** (update check on instantiate)—see **`adr/`** and the **ADRs** tab.
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-TOOL-SCAFF-0001` … `D-TOOL-SCAFF-0003`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: beskid new command

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/beskid-new/adr/0001-beskid-new-command-name/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/beskid-new/adr/0001-beskid-new-command-name/content.md`  
**SHA-256:** `b7c93a3fd226db88075355825e313475c4c4753082e61f4cb850010bf73b0d67`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Scaffolding entrypoint.

## Decision

Command **must** be `beskid new`.

## Consequences

See project-templates ADRs.

## Verification anchors

CLI command table.
``````

</details>

### Source Record: Interactive modes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/beskid-new/adr/0002-interactive-and-noninteractive/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/beskid-new/adr/0002-interactive-and-noninteractive/content.md`  
**SHA-256:** `d3311985edee800289fc3f1e9f2559024442a57116e4b59a7be3a899fc3c829a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Scaffolding entrypoint.

## Decision

Support interactive and non-interactive instantiation.

## Consequences

See project-templates ADRs.

## Verification anchors

CLI tests.
``````

</details>

### Source Record: Update on instantiate

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/beskid-new/adr/0003-update-check-on-instantiate/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/beskid-new/adr/0003-update-check-on-instantiate/content.md`  
**SHA-256:** `737ef7841e4becd8ac98afde35b7271c25899c89d205a58b502103cbffd79348`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Scaffolding entrypoint.

## Decision

Run template update check when online.

## Consequences

See project-templates ADRs.

## Verification anchors

Mock registry test.
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/beskid-new/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/beskid-new/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `f3d237f6107c614bed56c3d07382dbc812dbc8ecf4a1f516192deb111c38b322`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Normative CLI flags and behaviors.

## Global flags (instantiate)

| Flag | Meaning |
| --- | --- |
| `-o`, `--output <path>` | Output directory or file (item templates) |
| `-n`, `--name <string>` | Primary name symbol (maps to default `name` symbol) |
| `--symbol <id>=<value>` | Repeatable symbol binding |
| `--no-interactive` | Fail if required symbols missing |
| `--force` | Allow non-empty output directory |
| `--path <dir>` | Template from local path |
| `--git <url>` | Template from git |
| `--git-ref <ref>` | Branch, tag, or commit |
| `--git-subpath <dir>` | Subdirectory within repo |
| `--package <id>[@version]` | Registry package (`packageKind: template`) |
| `--project <Project.proj>` | Host project for item templates |
| `--allow-yanked` | Continue after yanked warning |
| `--strict-post-actions` | Fail on unknown post-action id |
| `--allow-project-manifest` | Item template may write `Project.proj` |

## `beskid new list` flags

| Flag | Meaning |
| --- | --- |
| `--online` | Include registry search results |
| `--kind <project\|workspace\|item>` | Filter by `tags.type` |

## Interactive

When stdin is a TTY:

- Prompt for each required symbol without a CLI value.
- Confirm overwrite when output exists (unless `--force`).
- Confirm proceed when template is yanked (unless `--allow-yanked`).

## Examples

```bash
beskid new list --online
beskid new install beskid.templates.console
beskid new console -n MyApp -o ./MyApp
beskid new lib --symbol name=MyLib --no-interactive -o ./MyLib
beskid new --git https://git.example.com/templates --git-ref main --git-subpath lib -o ./Lib
beskid new contract --symbol contractName=Foo -o ./Src/Foo.bd --project ./App/Project.proj
```

## Edge cases

- **`beskid new console`** without install: auto-install latest from registry when online.
- **Ambiguous shortName**: error listing matching package ids.
- **CI**: document `beskid new ... --no-interactive` in guides.
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/beskid-new/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/beskid-new/articles/design-model/content.md`  
**SHA-256:** `6ee8c2b0bd9a74a6d54cb5d969c864a71a020c830f44604cbca6304d2432f9a5`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Tooling-side state and paths for the `beskid new` command family.

## Cache directory

| Path (under user config root) | Content |
| --- | --- |
| `templates/installed/<identity>/` | Extracted template tree + `manifest.snapshot.json` |
| `templates/git/<hash>/` | Git clone caches |
| `templates/registry-index.json` | Optional index of last-known registry versions for update checks |

Exact config root **must** match other Beskid CLI state (same resolver as `beskid pckg` auth config).

## Install record

`manifest.snapshot.json` stores:

- `identity`, `shortName`, `packageId`, `resolvedVersion`, `checksum`, `installedAt`
- `source`: `registry` \| `path` \| `git`
- `yanked`: boolean snapshot at install time

## Update check

On `beskid new <shortName>` (and `--package`):

1. Read installed `resolvedVersion`.
2. Query registry for latest non-yanked version.
3. If newer: print update message (non-fatal).
4. If current is yanked: print warning (see contracts).

## Online vs offline

| Mode | Behavior |
| --- | --- |
| Registry reachable | Prefer download of `beskid.templates.*`; update check enabled |
| Offline | Use cache only; `list` shows installed; warn if update check skipped |

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Success |
| 1 | User error (validation, collision) |
| 2 | Engine or I/O failure |
| 3 | Registry auth or network failure when required |

## Code anchors

- `compiler/crates/beskid_cli/src/cli.rs` — subcommand registration
- `compiler/crates/beskid_pckg` — download API
``````

</details>
