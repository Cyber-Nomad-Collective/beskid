<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# beskid import lib command Specification

## Purpose

CLI workflow for mapping foreign libraries into Project.proj link metadata (v0.3).

## Requirements

### Requirement: Import lib command responsibilities
`beskid import lib <logical> [options]` (or an implementation alias such as `beskid link import`) MUST accept a logical library string matching or intended for `Extern` `Library` fields, select an `ExternalLibrary` provider for the current host (default `c-posix` on tier-1), emit or update `project.link` manifest entries, and print resolved linker args and search paths without requiring authors to hand-edit `-l` flags.

#### Scenario: Resolve and merge link entry
- **GIVEN** a project with a writable `Project.proj` and a known logical library name for the `c-posix` provider
- **WHEN** the user runs `beskid import lib <logical>` against that project
- **THEN** the command updates `project.link` entries and prints resolved linker args and search paths

### Requirement: Import lib options minimum
The command SHALL support `--provider <id>` to choose an `ExternalLibrary` implementation, `--dry-run` to show resolution without writing the manifest, and `--project <path>` to target a `Project.proj` (default: cwd discovery).

#### Scenario: Dry-run does not write manifest
- **GIVEN** a project whose `Project.proj` link section is unchanged on disk
- **WHEN** the user runs `beskid import lib <logical> --dry-run`
- **THEN** resolution output is printed and the manifest file is not modified

### Requirement: Extern allow/deny enforcement for imported libraries
Imported libraries MUST be subject to `BESKID_EXTERN_ALLOW` / `BESKID_EXTERN_DENY` at link/run drivers when those variables are set.

#### Scenario: Denied library blocked at link driver
- **GIVEN** `BESKID_EXTERN_DENY` includes a logical library previously imported into `project.link`
- **WHEN** a link or run driver evaluates extern libraries
- **THEN** that library is rejected according to the deny list

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: beskid import lib command

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/foreign-library-import/cli-import-lib-command/`  
**Source:** `site/spec-content/platform-spec/tooling/foreign-library-import/cli-import-lib-command/content.md`  
**SHA-256:** `81135801506f187be8f1fd61389fc3494199b826a2ce4603fff8b13ddde89ccc`

<details>
<summary>Migrated source text</summary>

``````markdown
## Command (reserved name)

```bash
beskid import lib <logical> [options]
```

Exact spelling may alias `beskid link import` in implementation; platform-spec reserves **`import lib`** as the user-facing verb.

## Responsibilities

The command **must**:

1. Accept a **logical library** string matching or intended for `Extern` `Library` fields.
2. Select an **`ExternalLibrary`** provider for the current host (default **`c-posix`** on tier-1).
3. Emit or update **`project.link`** manifest entries (see **[project link libraries](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/project-link-libraries/)**).
4. Print resolved **linker args** and **search paths** without requiring authors to hand-edit `-l` flags.

## Options (normative minimum)

| Flag | Meaning |
| --- | --- |
| `--provider <id>` | Choose `ExternalLibrary` implementation |
| `--dry-run` | Show resolution only; do not write manifest |
| `--project <path>` | Target `Project.proj` (default cwd discovery) |

## Non-goals (v0.3)

- Parsing C headers into `contract` declarations (future compiler mod / tool).
- Downloading SDKs (registry / package manager concerns).

## Security

Imported libraries **must** be subject to **`BESKID_EXTERN_ALLOW` / `BESKID_EXTERN_DENY`** at link/run drivers when those variables are set.

## Verification anchors

- **CLI surface:** `compiler/crates/beskid_cli/src/commands/import.rs` (`Commands::Import` in `cli.rs` advertises `import` in `beskid --help`).
- **Manifest mutation contract:** `compiler/crates/beskid_analysis/src/external_library/manifest_merge.rs` (idempotent merge; preserves non-`link` content).
- **End-to-end behavior:** `compiler/crates/beskid_tests/src/cli/import_lib.rs` (creates a temp `Project.proj`, runs the resolve + merge pipeline, asserts the resulting `link.libraries` round-trips through the manifest parser).
- **Closed registry rejection:** the same suite asserts unknown providers (for example `msvc`) and unknown logical names surface as structured `LibraryResolveError` values instead of panics.

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
