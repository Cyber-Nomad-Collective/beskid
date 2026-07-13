<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# beskid import lib command Specification

## Purpose

CLI workflow for mapping foreign libraries into Project.proj link metadata (v0.3).

## Requirements

### Requirement: beskid import lib command conformance status
This capability SHALL remain non-conformant and MUST NOT be cited as an implemented Beskid guarantee until a validated OpenSpec change adds explicit behavioral requirements.

**Stable ID:** `BSP-REQ-6278D45B55DE`

#### Scenario: Capability has descriptive material only
- **GIVEN** the migrated sources contain no uppercase BCP-14 obligation or accepted ADR decision
- **WHEN** an implementation reports Beskid conformance
- **THEN** it MUST NOT claim conformance based on this capability

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
