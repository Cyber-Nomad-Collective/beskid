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

### Requirement: Bundled default application creation
New SHALL accept new <name> [--template <template>], using <name> as output directory and primary name by default. With no template override it SHALL create a usable bundled app offline without prior template installation or prompts. New --list and --help SHALL expose available templates without provisioning. Existing nonempty output SHALL be rejected unchanged unless scoped force or interactive overwrite is authorized. Template cache management SHALL use package template list/install/uninstall rather than new subcommand dispatch. Online update checks SHALL be advisory and SHALL NOT replace selected template bytes or block offline bundled creation.

#### Scenario: CLI06-02 Offline default
- **GIVEN** empty template cache, network disabled and installed CLI
- **WHEN** new hello runs
- **THEN** hello contains a valid app manifest/source and requires no manual manifest edit or prompt

#### Scenario: CLI06-02 Template override
- **GIVEN** an installed named template
- **WHEN** new hello --template <template> runs
- **THEN** that template is used with explicit name/output binding

#### Scenario: CLI06-02 Existing output
- **GIVEN** a nonempty hello directory and noninteractive stdin
- **WHEN** new hello runs without force
- **THEN** it fails and leaves every existing byte unchanged

### Requirement: Offline template lifecycle preserves verified source authority
New --offline SHALL permit bundled templates, explicitly selected local template directories, and installed templates whose recorded identity and checksum match their current manifest and complete payload. Offline resolution SHALL reject absent, ambiguous, unverified or tampered installed selections before creating output. Offline SHALL perform no Git or registry requests, including advisory version checks. Remote selectors lacking a verified installed match SHALL fail with cache guidance. Template post-actions SHALL preserve offline dependency policy; arbitrary command actions lacking enforceable offline behavior SHALL fail before output creation rather than execute or silently skip.

#### Scenario: CLI06-NEW-OFFLINE-LOCAL Local selection
- **GIVEN** a valid local template directory and an unreachable registry
- **WHEN** new local --offline --path selects that directory
- **THEN** it creates the selected local payload without any network request

#### Scenario: CLI06-NEW-OFFLINE-CACHE Verified installed selection
- **GIVEN** an installed template whose identity and payload checksum match its installation snapshot
- **WHEN** new warm --offline --template selects its short name
- **THEN** it creates the verified payload without registry advisory requests

#### Scenario: CLI06-NEW-OFFLINE-TAMPER Changed installed payload
- **GIVEN** an installed template with changed payload bytes or mismatched manifest identity
- **WHEN** new tampered --offline selects it
- **THEN** it reports an integrity failure before creating output and performs no network request

#### Scenario: CLI06-NEW-OFFLINE-ACTION Dependency post-action
- **GIVEN** a local template with a dependency lock post-action and unavailable dependency cache
- **WHEN** new --offline instantiates it
- **THEN** the post-action receives offline resolution policy, fails with a cache diagnostic, and makes no network request

#### Scenario: CLI06-NEW-OFFLINE-COMMAND Unconstrained post-action
- **GIVEN** a selected template containing an arbitrary command post-action
- **WHEN** new --offline is requested
- **THEN** it rejects that unsupported action before creating output without executing the command

### Requirement: Installed template digest binds the copied regular-file inventory
Template installation SHALL preflight a single regular-file inventory before replacing existing installed state. It SHALL reject symbolic links, directory cycles and special files. Copying and checksum computation SHALL use the same inventory, excluding Git metadata and only the root installation receipt. Nested files named manifest.snapshot.json SHALL remain payload. Digests SHALL include an explicit algorithm version and unambiguous framing of normalized relative paths and content lengths. Unsupported historical digest versions SHALL fail offline verification with explicit reinstall guidance. Installation SHALL verify staged payload before switching installed state and restore previous state if switching fails.

#### Scenario: CLI06-CACHE-GIT Git metadata is not installed payload
- **GIVEN** a valid local template containing Git metadata
- **WHEN** it is installed and subsequently selected offline
- **THEN** Git metadata is excluded consistently from copied payload and digest, and the verified template succeeds offline

#### Scenario: CLI06-CACHE-LINK Invalid replacement preserves installation
- **GIVEN** a verified installed template and a replacement source containing a symbolic link or directory cycle
- **WHEN** installation is requested
- **THEN** it rejects the replacement before modifying the existing installed payload or receipt

#### Scenario: CLI06-CACHE-FRAMING Distinct path and byte boundaries
- **GIVEN** trees whose raw concatenated relative paths and content are equal but their path/content boundaries differ
- **WHEN** their digests are computed
- **THEN** their versioned framed digests differ

#### Scenario: CLI06-CACHE-NESTED Nested receipt-like filenames are payload
- **GIVEN** an installed template containing nested/manifest.snapshot.json
- **WHEN** that nested file changes
- **THEN** offline verification rejects the changed payload

#### Scenario: CLI06-CACHE-OLD Unsupported historical digest
- **GIVEN** an installed template with an unversioned historical checksum
- **WHEN** it is selected offline
- **THEN** selection fails before output with explicit reinstall guidance

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
- **Noninteractive use**: document `beskid new ... --no-interactive` in guides.
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
