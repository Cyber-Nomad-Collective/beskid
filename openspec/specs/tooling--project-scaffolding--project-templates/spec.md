<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Project templates Specification

## Purpose

Beskid template engine (`beskid.template.v1`), project and item templates, workspace scaffolds, and instantiation semantics.

## Requirements

### Requirement: Beskid-native template engine schema: Decision [D-TOOL-SCAFF-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The platform **must** use **`beskid.template.v1`** only. Foreign engine schemas are forbidden in spec, CLI, and pckg.

**Stable ID:** `BSP-REQ-FB3A4BD6BB5D`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0001-beskid-template-v1-engine/content.md`  
**Source SHA-256:** `a9b5835b19b02598646b6129f5b0acd8964a8fb505ea110d61f3a3b79b0c1f29`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Human-readable {{ }} placeholders: Decision [D-TOOL-SCAFF-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Text files **must** use **`{{symbolName}}`** placeholders; optional **`sourceName`** rewriting applies to paths and identifiers.

**Stable ID:** `BSP-REQ-BFCF440720C4`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0002-placeholder-delimiters/content.md`  
**Source SHA-256:** `3ed3651cc936a19e90960b3f3a80c38958f8f2ee2812adc0d2987c4692ae5679`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Templates need not build at template root: Decision [D-TOOL-SCAFF-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Template packages **need not** compile at the template project root. Tooling **must** validate via instantiation output builds.

**Stable ID:** `BSP-REQ-BD6B78D79821`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0003-no-runnable-template-root/content.md`  
**Source SHA-256:** `e015a9fa54650dc994d0dde94bd28b9b2fbd0db593ce5fcfc7efc292b2cf0130`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Implicit corelib: Decision [D-TOOL-SCAFF-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Inject corelib; forbid noCorelib flags.

**Stable ID:** `BSP-REQ-FC2577A63315`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0004-corelib-always-on/content.md`  
**Source SHA-256:** `cb39fe4bcaaf78240c2a6940bb153e4b4dbffe142e499269d613feeb55ce18d9`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Three template kinds: Decision [D-TOOL-SCAFF-0005]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Support all three via tags.type.

**Stable ID:** `BSP-REQ-34EFB272A162`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0005-template-kinds-v1/content.md`  
**Source SHA-256:** `5d7cdb365da8b26065721bf63ded7fb5f57fa44a3487c4f035b4c26b51bbdd5a`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Path and git sources: Decision [D-TOOL-SCAFF-0006]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Resolve registry, path, and git.

**Stable ID:** `BSP-REQ-FB3B998BE6B5`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0006-path-and-git-sources/content.md`  
**Source SHA-256:** `f862a47ae372fd6057017d9d3c56c63fe2542e7da5ce53a46e6553e26e5153bd`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: No constraints: Decision [D-TOOL-SCAFF-0007]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> No constraint blocks in schema.

**Stable ID:** `BSP-REQ-C5A07BB7E838`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0007-no-constraint-blocks/content.md`  
**Source SHA-256:** `557f2a3f6255e1b9536fb781bf2277d45437cee008e8c40d87fd2863f54136b5`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Post-actions: Decision [D-TOOL-SCAFF-0008]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Documented action ids, no v1 whitelist.

**Stable ID:** `BSP-REQ-12AD223BBC13`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0008-unrestricted-post-actions/content.md`  
**Source SHA-256:** `1ad088d737a8c4f00c6124868c0eb756ae980f4c9aa5d63b6710b175e7e610f4`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Update on use: Decision [D-TOOL-SCAFF-0009]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Compare cache on every use when online.

**Stable ID:** `BSP-REQ-D1B27D8A4357`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0009-update-check-on-use/content.md`  
**Source SHA-256:** `09bd4a0943e1d45e32489ed7993b869747f990dec4690e67a49b6d4c04e9e7c3`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Yanked warning: Decision [D-TOOL-SCAFF-0010]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Warn on yanked; optional continue flag.

**Stable ID:** `BSP-REQ-2D58D52056EA`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0010-yanked-template-warning/content.md`  
**Source SHA-256:** `bb92e83cf111f651ac9039e6e045e4a868310ad9319bb89640b3125c8473fcc5`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Project templates

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/content.md`  
**SHA-256:** `528b7d6a435a280ae90ab6850e72e3afbd4ee749f1720469fb3cce2bb52763c9`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
**Project templates** — `beskid.template.v1`, project/workspace/item scaffolding, `{{ }}` placeholders, GUID regeneration, path/git/registry sources, update checks, and corelib policy on instantiated hosts.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/crates/beskid_template` — `beskid.template.v1` engine and `service` orchestration
- `compiler/crates/beskid_cli/src/commands/new.rs` — Clap wrapper for `beskid new`
- `compiler/crates/beskid_analysis/src/projects/model.rs` — `ProjectKind::Template`
- `compiler/crates/beskid_pckg_server/Services/PackageArtifactValidator.cs` — template profile
- First-party packages `beskid.templates.console`, `beskid.templates.lib`, `beskid.templates.project`
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
Beskid **templates** are versioned trees of files plus a **`beskid.template.v1`** manifest that drives **project**, **workspace**, and **item** scaffolding. Templates **may** be sourced from a **pckg template package**, a **local directory**, or a **git URL** (with optional subdirectory and ref). Instantiation **must** support **interactive prompts** and **non-interactive CLI flags** for the same symbol set.

Template content is **not** required to build as a standalone runnable project before instantiation; authors validate templates by instantiating into a scratch directory and running `beskid build` / `beskid test` on the **output**.

Any host project shape (**`Host`**, **`Mod`**, or future kinds) **may** appear in template output—templates impose no restriction on scaffolded `project.type` or targets.
</SpecSection>

<SpecSection title="Inputs and outputs" id="inputs-and-outputs">
| Input | Description |
| --- | --- |
| Template source | Registry package (`packageKind: template`), filesystem path, or git remote + ref |
| User parameters | Symbol values from flags and/or prompts |
| Output location | New directory, existing project root (item templates), or workspace root |
| **Output** | Files on disk: optional **`Workspace.proj`**, one or more **`Project.proj`** trees, `.bd` sources, supporting assets |
| Side effects | **Post-actions** (see [flow](./flow-and-algorithm/)); **`beskid lock`** recommended for project/workspace outputs |
| **Corelib** | Every instantiated **host** project **must** resolve **corelib** implicitly—see [design model](./design-model/#corelib-policy) |
</SpecSection>

<SpecSection title="State model" id="state-model">
| State | Location | Lifecycle |
| --- | --- | --- |
| **Installed template snapshot** | User-level tooling cache (exact path normative in [beskid new](./../beskid-new/design-model/)) | Updated on `beskid new install` and when **update check** finds a newer registry version |
| **Template manifest** | `.beskid/template.json` at template root inside package or git checkout | Immutable for a given package version / git ref |
| **Authoring project** | `Project.proj` with **`type: Template`** | Published as template package; excluded from normal app compile graphs |
| **Instantiation session** | Ephemeral | Symbol table → file operations → post-actions |
</SpecSection>

<SpecSection title="Algorithms and flow" id="algorithms-and-flow">
High-level flow is specified in **[flow and algorithm](./flow-and-algorithm/)**. Update detection runs **on each use** of a template (registry, path, or git) before instantiation.
</SpecSection>

<SpecSection title="Edge cases and errors" id="edge-cases-and-errors">
- **Yanked** registry template version: CLI **must** emit a **warning** and **may** continue if the user does not abort (see [contracts](./contracts-and-edge-cases/)).
- **Output exists**: project/workspace templates **must** fail by default when the target directory is non-empty unless `--force` (exact flag in [beskid new](../beskid-new/)).
- **Item template** target not inside a discovered `Project.proj`: **must** error with E19xx diagnostic.
- **Invalid `{{ }}`**: unresolved placeholders after substitution **must** fail instantiation.
- **GUID list**: every guid in the `guids` array **must** be replaced with a newly generated guid preserving source format—see [design model](./design-model/#guids).
</SpecSection>

<SpecSection title="Compatibility and versioning" id="compatibility-and-versioning">
- Engine schema: **`beskid.template.v1`** (breaking changes require new schema id and migration notes).
- Template packages use the same **registry-assigned semver** as library packages; template identity string includes package id and version.
- **No host constraints** block (OS, SDK version, etc.)—templates are always eligible when installed.
</SpecSection>

<SpecSection title="Security and performance notes" id="security-and-performance-notes">
- **Post-actions** are **not** whitelist-gated; manifest declares action ids and arguments. Hosts **must** document supported actions; unknown actions **should** warn and skip (not fail entire run) unless `--strict-post-actions` is set (see [beskid new](../beskid-new/)).
- Git templates **must** pin ref by default (`--git-ref`); floating default branch is allowed only when explicitly requested.
- Large template trees **should** use `sources.exclude` aggressively to avoid copying build artifacts.
</SpecSection>

<SpecSection title="Examples" id="examples">
See **[examples](./examples/)** for console app, class library, workspace, item, and template-authoring samples.
</SpecSection>

<SpecSection title="Verification and traceability" id="verification-and-traceability">
- Schema fixtures: `beskid.template.v1` golden files under planned `compiler/crates/beskid_tests/src/projects/templates/`
- Round-trip: instantiate → `beskid lock` → `beskid build` for first-party `beskid.templates.*`
- Item template: add file under existing `Project.proj` → `beskid analyze` clean
</SpecSection>

<SpecSection title="Decisions" id="decisions">
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-TOOL-SCAFF-0001` … `D-TOOL-SCAFF-0010`); use the reader **ADRs** tab for detail. Legacy [decisions record](./decisions-record/) is a migration index only.
</SpecSection>

<SpecSection title="Related features" id="related-features">
- **[Template packages](../template-packages/)** — `packageKind`, `.bpk` layout, pckg UI
- **[beskid new](../beskid-new/)** — commands and cache
- **[Package kinds](/platform-spec/tooling/registry-client/package-kinds/)** — `template` vs `library` vs reserved `tool`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-TOOL-SCAFF-0001` … `D-TOOL-SCAFF-0010`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Decisions record (legacy index)](./articles/decisions-record/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Beskid-native template engine schema

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/adr/0001-beskid-template-v1-engine/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0001-beskid-template-v1-engine/content.md`  
**SHA-256:** `a9b5835b19b02598646b6129f5b0acd8964a8fb505ea110d61f3a3b79b0c1f29`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Foreign template engines would split validation and documentation across ecosystems.

## Decision

The platform **must** use **`beskid.template.v1`** only. Foreign engine schemas are forbidden in spec, CLI, and pckg.

## Consequences

Single parser and validator in tooling; template docs stay in-repo.

## Verification anchors

CI grep excluding foreign schema identifiers under `compiler/` and platform-spec tooling tree.
``````

</details>

### Source Record: Human-readable {{ }} placeholders

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/adr/0002-placeholder-delimiters/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0002-placeholder-delimiters/content.md`  
**SHA-256:** `3ed3651cc936a19e90960b3f3a80c38958f8f2ee2812adc0d2987c4692ae5679`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Template authors need delimiter syntax distinct from Beskid source.

## Decision

Text files **must** use **`{{symbolName}}`** placeholders; optional **`sourceName`** rewriting applies to paths and identifiers.

## Consequences

Editors can highlight unmatched braces; substitution tests stay deterministic.

## Verification anchors

Golden substitution tests under planned `beskid_tests` template fixtures.
``````

</details>

### Source Record: Templates need not build at template root

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/adr/0003-no-runnable-template-root/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0003-no-runnable-template-root/content.md`  
**SHA-256:** `e015a9fa54650dc994d0dde94bd28b9b2fbd0db593ce5fcfc7efc292b2cf0130`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Requiring `beskid build` on template sources slows authoring and blocks non-host template layouts.

## Decision

Template packages **need not** compile at the template project root. Tooling **must** validate via instantiation output builds.

## Consequences

Faster template iteration; CI runs instantiate-then-build on consumer output.

## Verification anchors

`beskid.templates.*` CI pipeline; planned `beskid_tests` template fixtures.
``````

</details>

### Source Record: Implicit corelib

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/adr/0004-corelib-always-on/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0004-corelib-always-on/content.md`  
**SHA-256:** `cb39fe4bcaaf78240c2a6940bb153e4b4dbffe142e499269d613feeb55ce18d9`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Hosts need standard library.

## Decision

Inject corelib; forbid noCorelib flags.

## Consequences

Simpler manifests.

## Verification anchors

E18xx linter.
``````

</details>

### Source Record: Three template kinds

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/adr/0005-template-kinds-v1/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0005-template-kinds-v1/content.md`  
**SHA-256:** `5d7cdb365da8b26065721bf63ded7fb5f57fa44a3487c4f035b4c26b51bbdd5a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Workspace, project, item flows.

## Decision

Support all three via tags.type.

## Consequences

One engine.

## Verification anchors

Three beskid_tests fixtures.
``````

</details>

### Source Record: Path and git sources

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/adr/0006-path-and-git-sources/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0006-path-and-git-sources/content.md`  
**SHA-256:** `f862a47ae372fd6057017d9d3c56c63fe2542e7da5ce53a46e6553e26e5153bd`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Local workflows.

## Decision

Resolve registry, path, and git.

## Consequences

beskid new flags.

## Verification anchors

Git/path integration tests.
``````

</details>

### Source Record: No constraints

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/adr/0007-no-constraint-blocks/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0007-no-constraint-blocks/content.md`  
**SHA-256:** `557f2a3f6255e1b9536fb781bf2277d45437cee008e8c40d87fd2863f54136b5`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

DSL delay.

## Decision

No constraint blocks in schema.

## Consequences

Simpler v1.

## Verification anchors

Reject constraints key.
``````

</details>

### Source Record: Post-actions

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/adr/0008-unrestricted-post-actions/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0008-unrestricted-post-actions/content.md`  
**SHA-256:** `1ad088d737a8c4f00c6124868c0eb756ae980f4c9aa5d63b6710b175e7e610f4`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Extensibility.

## Decision

Documented action ids, no v1 whitelist.

## Consequences

Operator sandbox policy.

## Verification anchors

Action registry docs.
``````

</details>

### Source Record: Update on use

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/adr/0009-update-check-on-use/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0009-update-check-on-use/content.md`  
**SHA-256:** `09bd4a0943e1d45e32489ed7993b869747f990dec4690e67a49b6d4c04e9e7c3`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Stale cache.

## Decision

Compare cache on every use when online.

## Consequences

Update prompts.

## Verification anchors

Mock HTTP test.
``````

</details>

### Source Record: Yanked warning

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/adr/0010-yanked-template-warning/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/adr/0010-yanked-template-warning/content.md`  
**SHA-256:** `bb92e83cf111f651ac9039e6e045e4a868310ad9319bb89640b3125c8473fcc5`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Yank policy.

## Decision

Warn on yanked; optional continue flag.

## Consequences

Registry alignment.

## Verification anchors

Yank API test.
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `fd20102eb686b7651e09cb54855d7d6b3e8aac09459c6ae09012491c81a0d0b9`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Testable rules for template resolution, instantiation, registry interaction, and diagnostics (**E1901–E1999**).

## Resolution

| ID | Rule |
| --- | --- |
| T-R01 | `beskid new` **must** accept exactly one template selector: `shortName`, `--package <id>[@version]`, `--path <dir>`, or `--git <url>` (with optional `--git-ref`, `--git-subpath`). |
| T-R02 | Registry resolution **must** require `packageKind: template` on the resolved `package.json`. |
| T-R03 | First-party ids under **`beskid.templates.*`** **must** be preferred when `shortName` is ambiguous and registry is configured. |
| T-R04 | On **every** template use, tooling **must** compare cached install (if any) to latest non-yanked registry version and **must** print an informational message when a newer version exists. |
| T-R05 | When the resolved version is **yanked**, tooling **must** print a **warning** naming the package and version; exit code **0** if the user proceeds via `--allow-yanked` or interactive confirmation. |

## Instantiation

| ID | Rule |
| --- | --- |
| T-I01 | **Project** templates **must** create the output directory when missing; **must** error when non-empty without `--force`. |
| T-I02 | **Workspace** templates **must** emit `Workspace.proj` at the workspace root and member `Project.proj` files at declared member paths. |
| T-I03 | **Item** templates **must** require `-o` / `--output` pointing at a file or directory under a folder containing `Project.proj` (or pass `--project` to disambiguate). |
| T-I04 | After substitution, **no** `{{` `}}` placeholder tokens **may** remain in output files. |
| T-I05 | All `guids` entries **must** be replaced in output; leftover source guids **must** fail with **E1906**. |
| T-I06 | Instantiated host projects **must** receive corelib per [design model](./design-model/#corelib-policy); templates **must not** emit opt-out flags. |
| T-I07 | Templates **may** scaffold **`Mod`**, multi-target, or FFI-heavy projects without restriction. |

## Interactive and flags

| ID | Rule |
| --- | --- |
| T-U01 | When stdin is a TTY and `preferInteractive` is true or any required symbol lacks a value, the CLI **must** prompt. |
| T-U02 | When `--no-interactive` is set, only flags and defaults **may** be used; missing required symbols **must** fail with **E1903**. |
| T-U03 | `--symbol` (repeatable) and `-n` / `--name` for the primary name symbol **must** be supported. |

## Post-actions

| ID | Rule |
| --- | --- |
| T-P01 | `postActions` is an ordered array of `{ "actionId": string, "args": object }`. |
| T-P02 | There is **no** platform whitelist; hosts **must** document supported `actionId` values. |
| T-P03 | Unknown `actionId` **should** log a warning and continue unless `--strict-post-actions`. |
| T-P04 | Built-in actions **must** include at minimum: `runCommand`, `beskidLock`, `beskidFetch`, `openReadme`. |

## Builtin forms

| Form id | Input | Output |
| --- | --- | --- |
| `identity` | string | unchanged |
| `lowerCase` | string | lowercase |
| `upperCase` | string | uppercase |
| `safeName` | string | filesystem-safe identifier |
| `namespace` | string | dotted namespace from path-like name |

## Edge cases

- **Git shallow clone failure** → **E1907** with remediation (network, auth, ref).
- **Template package contains `packageKind: library`** → **E1902** reject for `beskid new install`.
- **Item template overwrites existing file** → require `--force` or interactive confirm.
- **Workspace template with duplicate member ids** → **E1908** at validation time (before write).

## Diagnostic band E1901–E1999

| Code | Meaning |
| --- | --- |
| E1901 | Template manifest missing or invalid schema |
| E1902 | Package kind is not `template` |
| E1903 | Required symbol not provided |
| E1904 | Output path conflict |
| E1905 | Item template outside project root |
| E1906 | GUID replacement incomplete |
| E1907 | Git template source failed |
| E1908 | Workspace template invalid member graph |
| E1999 | Reserved internal template engine error |
``````

</details>

### Source Record: Decisions record (legacy index)

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/articles/decisions-record/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/articles/decisions-record/content.md`  
**SHA-256:** `ac999cee7f05c73739d9cf00e37b23eef2ce6ee3f893da86e3e7c1713a0ba784`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Legacy URL retained for bookmarks. Normative decision text **must** be read from **`adr/`** (`D-TOOL-SCAFF-0001` … `D-TOOL-SCAFF-0010`) and the feature hub **ADRs** tab.

## Canonical ADR index

| adrId | Title |
| --- | --- |
| D-TOOL-SCAFF-0001 | [Beskid-native template engine](./adr/0001-beskid-template-v1-engine/) |
| D-TOOL-SCAFF-0002 | [{{ }} placeholders](./adr/0002-placeholder-delimiters/) |
| D-TOOL-SCAFF-0003 | [No runnable template root](./adr/0003-no-runnable-template-root/) |
| D-TOOL-SCAFF-0004 | [corelib always on](./adr/0004-corelib-always-on/) |
| D-TOOL-SCAFF-0005 | [Template kinds v1](./adr/0005-template-kinds-v1/) |
| D-TOOL-SCAFF-0006 | [Path and git sources](./adr/0006-path-and-git-sources/) |
| D-TOOL-SCAFF-0007 | [No constraint blocks](./adr/0007-no-constraint-blocks/) |
| D-TOOL-SCAFF-0008 | [Post-actions catalog](./adr/0008-unrestricted-post-actions/) |
| D-TOOL-SCAFF-0009 | [Update check on use](./adr/0009-update-check-on-use/) |
| D-TOOL-SCAFF-0010 | [Yanked template warning](./adr/0010-yanked-template-warning/) |
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/articles/design-model/content.md`  
**SHA-256:** `9ccc5455b25dab56a9f67880fef0a701253674f22c986bfdb72ffced2b1ced33`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

This article defines the **normative data model** for Beskid templates: manifest file location, `beskid.template.v1` top-level keys, symbol types, content manipulation, and **corelib** behavior on instantiated projects.

## Manifest location

| Context | Path |
| --- | --- |
| Template package or git/path tree | **`.beskid/template.json`** at the template root |
| Optional author metadata in `Project.proj` | `project.template { shortName, identity }` when **`type: Template`** |

The engine **must** read **`.beskid/template.json`** as authoritative. `project.template` keys are hints for discovery and packaging; if both exist, **`template.json` wins** on conflict.

## Top-level `beskid.template.v1` keys

| Key | Required | Meaning |
| --- | --- | --- |
| `schema` | yes | Literal **`beskid.template.v1`** |
| `identity` | yes | Stable id: `packageId::version` or path/git fingerprint |
| `name` | yes | Display name in `beskid new list` |
| `shortName` | yes | CLI selector: `beskid new <shortName>` |
| `author` | no | Author string |
| `description` | no | Short summary |
| `classifications` | no | Search tags |
| `tags` | no | Object; **`type`** **must** be one of: `project`, `workspace`, `item` |
| `sourceName` | no | Default token replaced in paths and file bodies (in addition to `{{ }}`) |
| `symbols` | no | Parameter definitions |
| `sources` | no | File copy rules; default single mapping `./` → output |
| `guids` | no | GUIDs to regenerate in output |
| `forms` | no | Value transforms (see below) |
| `postActions` | no | Ordered post-instantiation actions |
| `preferInteractive` | no | When true, prompt for symbols without CLI values before using defaults |

**Forbidden in v1:** `constraints`, foreign schema imports, or alternate placeholder delimiters.

## Tags.type semantics

| `tags.type` | Output |
| --- | --- |
| `project` | Creates a directory tree with **`Project.proj`** (and `Src/` or template-defined layout) |
| `workspace` | Creates **`Workspace.proj`** plus member project trees |
| `item` | Adds or overwrites files **inside** an existing project directory; **must not** emit a new root `Project.proj` unless `sources` explicitly includes one and the CLI passed `--allow-project-manifest` |

## Symbols

Each symbol is an object keyed by symbol id (used in `{{symbolId}}`):

| Field | Required | Meaning |
| --- | --- | --- |
| `type` | yes | `string`, `choice`, `bool`, `integer` |
| `description` | no | Prompt text |
| `defaultValue` | no | Used when non-interactive and flag omitted |
| `choices` | for `choice` | Allowed values |
| `isRequired` | no | Default false; when true, interactive mode **must** collect a value |

CLI mapping: `--symbol <id>=<value>` and short forms documented in [beskid new](../beskid-new/contracts-and-edge-cases/).

## Placeholders

1. **`{{symbolId}}`** — replaced in all processed text files after `forms` are applied.
2. **`sourceName`** — when set at template level, every occurrence of the `sourceName` string in **paths and file contents** is replaced with the primary name symbol (default symbol id **`name`** unless `nameSymbol` specifies another).

Hosts **must** fail if any `{{...}}` remains after substitution.

## Forms

`forms` define named transforms applied to symbol values before substitution (for example `lowerCase`, `safeName`, `namespace`). Built-in form ids are listed in [contracts and edge cases](./contracts-and-edge-cases/#builtin-forms).

## Sources

Each source entry:

| Field | Default | Meaning |
| --- | --- | --- |
| `source` | `./` | Path inside template root |
| `target` | `./` | Relative to user output directory |
| `include` | `["**/*"]` | Glob includes |
| `exclude` | build artifacts, `.beskid/template.json` copy to wrong place | Glob excludes |
| `copyOnly` | `[]` | Copy without text processing |
| `rename` | `{}` | Explicit renames after symbol resolution |
| `condition` | true | When false, skip this source block |
| `modifiers` | `[]` | Conditional patches to include/exclude |

**`.beskid/template.json`** **must not** appear in generated output unless a source block intentionally copies it to a documentation path.

## Guids

The `guids` array lists GUID strings appearing in template sources. For each entry, the engine **must** generate a new GUID and replace **all** occurrences in output, preserving **format and casing** of each occurrence (same rules as common template GUID rewriting: match `N`, `D`, `B`, `P`, `X` representations independently).

## corelib policy

| Rule | Normative statement |
| --- | --- |
| Implicit dependency | Every **instantiated** project with `project.type` absent or **`Host`** **must** treat **corelib** as an **implicit registry dependency** resolved by the toolchain—equivalent to today’s std/corelib discovery path. |
| Manifest surface | **`Project.proj` emitted by templates must not** declare a `noCorelib`, `useCorelib: false`, or any flag that disables corelib. |
| Template author docs | Templates **may** omit an explicit `dependency "corelib"` block from generated manifests; the **first** `beskid lock` / `fetch` **must** materialize corelib anyway. |
| Mod / workspace | **Mod** projects in template output follow mod resolution rules; corelib policy applies to **host** members that execute Beskid user code. |

If the compiler today requires an explicit dependency for some workflows, tooling **must** inject the dependency during instantiation or in post-action **`addCorelib`**—without exposing a user-facing opt-out.

## Authoring: `project.type = Template`

```text
project {
  name    = "beskid-templates-console"
  version = "0.0.0"
  type    = Template
  template {
    shortName = "console"
    identity  = "beskid.templates.console"
  }
}
```

`Template` projects **must not** be selected as compile targets for `beskid build` at the template package root; only their packaged `.beskid/template.json` is consumed by consumers.

## Diagram

```arch
flowchart TB
  TJ[.beskid/template.json]
  SYM[symbols]
  SRC[sources]
  PH["{{ }} + sourceName"]
  GD[guids]
  OUT[Output tree]
  TJ --> SYM --> PH
  TJ --> SRC --> PH
  TJ --> GD --> OUT
  PH --> OUT
```

## Code anchors

- Planned: `compiler/crates/beskid_cli/src/template/` (engine)
- Manifest parse: extend `compiler/crates/beskid_analysis/src/projects/model.rs` with `ProjectKind::Template`
- Registry: `pckg` template package profile
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/articles/examples/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/articles/examples/content.md`  
**SHA-256:** `54cc75666f0e70f0be842abe0aca3a0277dfc1b4a50f674cec7b42a9aaac4904`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Illustrative templates for the three first-party packages and common user flows.

## Console application (`beskid.templates.console`)

**`tags.type`:** `project`

```json
{
  "schema": "beskid.template.v1",
  "identity": "beskid.templates.console::1.0.0",
  "name": "Beskid Console Application",
  "shortName": "console",
  "description": "Executable app with Main.bd and App target",
  "tags": { "type": "project" },
  "sourceName": "MyApp",
  "symbols": {
    "name": {
      "type": "string",
      "description": "Project name",
      "defaultValue": "MyApp",
      "isRequired": true
    }
  },
  "sources": [{ "source": "./content/", "target": "./" }],
  "postActions": [
    { "actionId": "beskidLock", "args": {} },
    { "actionId": "openReadme", "args": { "path": "README.md" } }
  ]
}
```

Generated `Project.proj` (excerpt—note **no** corelib opt-out; no explicit corelib dependency required in template):

```text
project {
  name    = "{{name}}"
  version = "0.1.0"
  root    = "Src"
}

target "app" {
  kind  = App
  entry = "Main.bd"
}
```

**CLI:** `beskid new console -n MyGame -o ./MyGame`

## Class library (`beskid.templates.lib`)

**`tags.type`:** `project`

```json
{
  "schema": "beskid.template.v1",
  "identity": "beskid.templates.lib::1.0.0",
  "name": "Beskid Class Library",
  "shortName": "lib",
  "tags": { "type": "project" },
  "sourceName": "MyLib",
  "symbols": {
    "name": { "type": "string", "isRequired": true, "defaultValue": "MyLib" }
  },
  "sources": [{ "source": "./content/", "target": "./" }]
}
```

```text
target "lib" {
  kind  = Lib
  entry = "Lib.bd"
}
```

## Template authoring (`beskid.templates.project`)

**`tags.type`:** `project` (scaffolds a `type: Template` authoring tree)

```json
{
  "schema": "beskid.template.v1",
  "identity": "beskid.templates.project::1.0.0",
  "name": "Beskid Template Package",
  "shortName": "template",
  "tags": { "type": "project" },
  "symbols": {
    "name": { "type": "string", "isRequired": true },
    "shortName": { "type": "string", "isRequired": true }
  },
  "sources": [{ "source": "./content/", "target": "./" }]
}
```

Emitted author `Project.proj`:

```text
project {
  name    = "{{name}}"
  version = "0.1.0"
  type    = Template
  template {
    shortName = "{{shortName}}"
    identity  = "{{name}}"
  }
}
```

Includes stub **`.beskid/template.json`** with placeholders for the author to complete.

## Workspace template (illustrative)

```json
{
  "schema": "beskid.template.v1",
  "identity": "beskid.templates.workspace-demo::1.0.0",
  "name": "Two-member workspace",
  "shortName": "workspace-demo",
  "tags": { "type": "workspace" },
  "symbols": {
    "workspaceName": { "type": "string", "defaultValue": "MyWorkspace" }
  },
  "sources": [
    { "source": "./workspace/", "target": "./" }
  ]
}
```

## Item template — contract file

```json
{
  "schema": "beskid.template.v1",
  "identity": "beskid.templates.contract-item::1.0.0",
  "name": "Contract stub",
  "shortName": "contract",
  "tags": { "type": "item" },
  "symbols": {
    "contractName": { "type": "string", "isRequired": true }
  },
  "sources": [
    {
      "source": "./item/Contract.bd",
      "target": "./Src/{{contractName}}.bd"
    }
  ]
}
```

**CLI:** `beskid new contract --symbol contractName=Payment -o ./Src/Payment.bd --project ./MyApp`

## Git and path usage

```bash
beskid new --path ./local-templates/console -n Demo -o ./Demo
beskid new --git https://example.com/templates.git --git-ref v1.2.0 --git-subpath console -n Demo -o ./Demo
beskid new install beskid.templates.console
```
``````

</details>

### Source Record: FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `e03ae9c6263a7e6f02c6ae041d46db4a4db698412e569e4d54d3991b15888644`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Operator and author FAQs.

## Why is there no `useCorelib: false`?

Host projects always receive **corelib** through toolchain resolution. Templates must not document or generate an opt-out; see [design model](./design-model/#corelib-policy).

## How do first-party templates ship?

Only as **`beskid.templates.*`** packages on **pckg**. The CLI downloads them when the registry is available; it does not embed stale copies when updates exist.

## Can I scaffold a compiler mod?

Yes. Template output may set `type: Mod` and include `project.mod { ... }` per [Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/).

## Item vs project template?

| Kind | Command shape |
| --- | --- |
| Project | `beskid new console -o ./MyApp` |
| Item | `beskid new contract -o ./Src/File.bd --project ./MyApp` |
| Workspace | `beskid new workspace-demo -o ./MyWs` |

## Template build fails at template root

Expected: **`type: Template`** projects are not app compile targets. Run `beskid new` into a scratch folder to validate.

## Update message on every run

By design. Install with `beskid new install <package>` to refresh the cache.

## Yanked template still works

You received a **warning**. Prefer installing a non-yanked version; use `--allow-yanked` only when intentional.

## Placeholder left in file

**E1904** — a `{{symbol}}` was not bound. Pass `--symbol` or run interactive mode.

## pckg page shows no API docs for my template

Correct for `packageKind: template`. See [template packages](../template-packages/).
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/articles/flow-and-algorithm/content.md`  
**SHA-256:** `9f66e0813b80de86d87659581c8da88e38a3a790d4615feb48fb2453ef9a5c22`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Normative ordering for `beskid new install`, `beskid new list`, and `beskid new <shortName>` (and equivalents).

## Install (`beskid new install`)

1. Resolve source (registry id, `--path`, or `--git`).
2. For registry: download `.bpk` or extract template roots per [template packages](../template-packages/); verify `packageKind: template`.
3. Locate `.beskid/template.json`; parse and validate `beskid.template.v1`.
4. Store snapshot in tooling cache keyed by `identity`.
5. Register `shortName` → cache entry for `beskid new list`.

## List (`beskid new list`)

1. Merge **installed cache** entries with optional **registry search** (when `--online`).
2. Display: `shortName`, `name`, `tags.type`, package id + version, yanked marker if applicable.

## Instantiate (`beskid new`)

```arch
sequenceDiagram
  participant User
  participant CLI as beskid new
  participant Cache
  participant Registry as pckg
  participant Engine as template engine
  participant FS as output filesystem
  User->>CLI: select template + output path
  CLI->>Cache: load snapshot
  alt registry template
    CLI->>Registry: query latest version
    Registry-->>CLI: version metadata
    CLI-->>User: warn if yanked or update available
  end
  CLI->>Engine: load template.json
  Engine->>User: interactive prompts optional
  CLI->>Engine: symbol values
  Engine->>FS: apply sources, placeholders, guids
  Engine->>CLI: postActions list
  CLI->>CLI: run postActions
  CLI->>CLI: ensure corelib via lock/fetch policy
```

### Step detail

1. **Resolve template** — cache hit by `shortName`, or one-shot path/git without install.
2. **Update check** — for registry-backed templates, query latest semver; if greater than cached, print: `A newer template version is available: <id>@<ver>. Run 'beskid new install <id>' to update.`
3. **Yanked check** — if requested version is yanked, emit warning (see contracts).
4. **Load manifest** — `beskid.template.v1`.
5. **Collect symbols** — merge CLI flags, defaults, interactive prompts.
6. **Evaluate conditions** — skip source blocks whose `condition` is false.
7. **Process sources** — copy, text-process, rename; apply `copyOnly` without substitution.
8. **Substitute** — `{{ }}`, `sourceName`, `forms`.
9. **Regenerate guids** — per `guids` array.
10. **Post-actions** — sequential; failures honor `--strict-post-actions`.
11. **Corelib** — run default post-action `beskidLock` (or equivalent) so corelib is materialized without user declaring opt-out.

## Workspace templates

1. Write `Workspace.proj` first (substituted).
2. For each member in `workspaceMembers` symbol or fixed layout in `sources`, write member `Project.proj` and sources.
3. Post-action `beskidLock` at workspace root **must** lock all members.

`workspaceMembers` is a `choice` or structured symbol when the template offers optional members; fixed layouts **may** omit the symbol.

## Item templates

1. Resolve host `Project.proj` root.
2. Apply `sources` with `target` relative to chosen file path.
3. **Must not** run workspace-level lock unless `--lock` passed.

## Git and path sources

| Source | Behavior |
| --- | --- |
| `--path` | Read `.beskid/template.json` directly; no cache unless `--install` |
| `--git` | Clone to cache subdirectory keyed by url+ref; optional sparse checkout for `subpath` |

## Implementation anchors

- `compiler/crates/beskid_cli/src/commands/new.rs` (planned)
- `compiler/crates/beskid_pckg` registry fetch (existing client)
``````

</details>

### Source Record: Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/project-templates/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/project-templates/articles/verification-and-traceability/content.md`  
**SHA-256:** `15eabdd4ebd1722ca2932031e16b70577549a62614f418b0704b0cf5ea1e672d`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

How implementers prove template engine and first-party package compliance.

## Conformance matrix

| Requirement | Verification |
| --- | --- |
| `beskid.template.v1` parse | JSON schema fixture tests in `beskid_tests` |
| `{{ }}` exhaustion | Golden output diff tests |
| GUID rewrite | Multi-format guid fixture files in template content |
| corelib after instantiate | `beskid lock` + compile smoke without `noCorelib` manifest key |
| Update check on use | Mock registry returning newer semver → expect stdout message |
| Yanked warning | Publish yanked version → `beskid new` warns |
| Item template | Instantiate into temp project → `beskid analyze` |
| Workspace template | Two members resolve in `beskid tree` |

## First-party packages

| Package id | shortName | tags.type |
| --- | --- | --- |
| `beskid.templates.console` | `console` | `project` |
| `beskid.templates.lib` | `lib` | `project` |
| `beskid.templates.project` | `template` | `project` |

CI **must** pack and publish these under the **`beskid.templates.*`** namespace when registry credentials are available, matching [corelib publish](/platform-spec/core-library/compiler-integration/corelib-discovery-and-packaging/) workflow patterns.

## pckg server

- Template `.bpk` **must** reject `packageKind: library` when `template.json` present (or require `template`).
- Template package page **must not** mount API documentation viewer (see [template packages](../template-packages/verification-and-traceability/)).

## Spec drift

Changes to `beskid.template.v1` **must** update this article and [design model](./design-model/) in the same change set.
``````

</details>
