---
title: Project templates
description: Beskid template engine (`beskid.template.v1`), project and item
  templates, workspace scaffolds, and instantiation semantics.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
**Project templates** — `beskid.template.v1`, project/workspace/item scaffolding, `{{ }}` placeholders, GUID regeneration, path/git/registry sources, update checks, and corelib policy on instantiated hosts.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/crates/beskid_template` — `beskid.template.v1` engine and `service` orchestration
- `compiler/crates/beskid_cli/src/commands/new.rs` — Clap wrapper for `beskid new`
- `compiler/crates/beskid_analysis/src/projects/model.rs` — `ProjectKind::Template`
- `pckg/src/Server/Services/PackageArtifactValidator.cs` — template profile
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
