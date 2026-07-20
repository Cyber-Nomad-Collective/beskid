<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Template packages Specification

## Purpose

Registry package kind `template`, `.bpk` artifact layout, validation profile, and pckg UI behavior.

## Requirements

### Requirement: Explicit packageKind: Decision [D-TOOL-SCAFF-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Explicit packageKind on beskid.package.v1.

**Stable ID:** `BSP-REQ-EF28FF4FC9C4`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/template-packages/adr/0001-explicit-package-kind/content.md`  
**Source SHA-256:** `3aa6c72b945204586b6fb6bcb422db42a248e1b88854d9d9ce44d7b543e37c9f`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Template UI mode: Decision [D-TOOL-SCAFF-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Template pages hide API docs.

**Stable ID:** `BSP-REQ-ABBA6244E997`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/template-packages/adr/0002-template-registry-ui-mode/content.md`  
**Source SHA-256:** `b55ef1079528ec217eca00a738e78c37d180dbb9112191efe5b709b3426c9bb1`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: No api.json: Decision [D-TOOL-SCAFF-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> template kind must not require api.json.

**Stable ID:** `BSP-REQ-A9EDDF3703C4`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/template-packages/adr/0003-no-api-json-for-templates/content.md`  
**Source SHA-256:** `6841129b2165d9a29a63c27bc31c4a4ef1bd46226a3b3e89a33b96319d5b863a`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Contracts and edge cases: Purpose and scope [tooling/project-scaffolding/template-packages/articles/contracts-and-edge-cases]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Registry validator and UI MUST rules.

**Stable ID:** `BSP-REQ-BC228B8A50A8`  
**Legacy source:** `site/spec-content/platform-spec/tooling/project-scaffolding/template-packages/articles/contracts-and-edge-cases/content.md`  
**Source SHA-256:** `46336b1e12449f07603f8e4eeffdb58a238d50e240f5356c938bc909fe522dda`

#### Scenario: Conformance exercises Purpose and scope
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Template packages

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/template-packages/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/template-packages/content.md`  
**SHA-256:** `ebccc6524f80e5d5b20b639bb998a60b6618efe795c885c04d6d562e98c9a40d`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
**Template packages** — `packageKind: template` on **`beskid.package.v1`**, `.bpk` validation without `api.json`, and pckg registry UI that hides API documentation.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/crates/beskid_pckg_server/Services/PackageArtifactValidator.cs`
- `pckg` package detail components (template page mode)
- `beskid pckg pack` — emit `packageKind` and `.beskid/template.json`
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
A **template package** is a published **`.bpk`** artifact whose root **`package.json`** declares **`packageKind: template`**. Template packages distribute **`.beskid/template.json`** and scaffold sources. They use the **same versioning, yank, checksum, and registry-assigned publish semver** as library packages, but **different validation** and **pckg UI**.
</SpecSection>

<SpecSection title="Inputs and outputs" id="inputs-and-outputs">
| Field | Rule |
| --- | --- |
| `schema` | **`beskid.package.v1`** (unchanged) |
| `id` | Package id; first-party **`beskid.templates.*`** |
| `packageKind` | **`template`** (required for this profile) |
| `version` | Present in artifact; registry may assign publish version independently |
| **Output** | Downloaded `.bpk` → extracted template root for `beskid new install` |
</SpecSection>

<SpecSection title="State model" id="state-model">
Template packages **must not** be required to expose structured API documentation on the registry. The package detail route **must** use **template page mode**: readme, template metadata (`shortName`, `tags.type`, classifications), install command, and version history—**no** `api.json` viewer, **no** docs tree tabs for API reference.
</SpecSection>

<SpecSection title="Algorithms and flow" id="algorithms-and-flow">
**Pack:** `beskid pckg pack` on a **`type: Template`** project **must** set `packageKind: template` in generated `package.json` and include `.beskid/template.json` plus template `sources` roots.

**Publish:** Same `POST /api/packages/<id>/publish` and workspace publish flows; server selects validator profile by `packageKind`.

**Consume:** `beskid new install <id>` downloads version, verifies kind, registers cache entry.
</SpecSection>

<SpecSection title="Edge cases and errors" id="edge-cases-and-errors">
- Library package accidentally packed without `api.json` — existing rule; template profile **must not** require `api.json`.
- Template package missing `.beskid/template.json` — reject at publish with HTTP 400.
- `packageKind: library` with template manifest present — reject or require repack as `template`.
</SpecSection>

<SpecSection title="Compatibility and versioning" id="compatibility-and-versioning">
Identical to library packages: immutable versions, yank semantics, registry-assigned bumps on upload.
</SpecSection>

<SpecSection title="Decisions" id="decisions">
No open decisions. ADRs **`D-TOOL-SCAFF-0001`** … **`0003`** (explicit `packageKind`, template registry UI, no `api.json`) under **`adr/`**; use the **ADRs** tab.
</SpecSection>

<SpecSection title="Verification and traceability" id="verification-and-traceability">
- `compiler/crates/beskid_pckg_server/Services/PackageArtifactValidator.cs` — template profile branch
- `pckg` React package detail routing by `packageKind`
- Server tests: template `.bpk` publish without `api.json`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-TOOL-SCAFF-0001` … `D-TOOL-SCAFF-0003`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Explicit packageKind

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/template-packages/adr/0001-explicit-package-kind/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/template-packages/adr/0001-explicit-package-kind/content.md`  
**SHA-256:** `3aa6c72b945204586b6fb6bcb422db42a248e1b88854d9d9ce44d7b543e37c9f`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Registry taxonomy.

## Decision

Explicit packageKind on beskid.package.v1.

## Consequences

pckg validators.

## Verification anchors

Validator tests.
``````

</details>

### Source Record: Template UI mode

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/template-packages/adr/0002-template-registry-ui-mode/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/template-packages/adr/0002-template-registry-ui-mode/content.md`  
**SHA-256:** `b55ef1079528ec217eca00a738e78c37d180dbb9112191efe5b709b3426c9bb1`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Registry taxonomy.

## Decision

Template pages hide API docs.

## Consequences

pckg validators.

## Verification anchors

Validator tests.
``````

</details>

### Source Record: No api.json

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/template-packages/adr/0003-no-api-json-for-templates/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/template-packages/adr/0003-no-api-json-for-templates/content.md`  
**SHA-256:** `6841129b2165d9a29a63c27bc31c4a4ef1bd46226a3b3e89a33b96319d5b863a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Registry taxonomy.

## Decision

template kind must not require api.json.

## Consequences

pckg validators.

## Verification anchors

Validator tests.
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/template-packages/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/template-packages/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `46336b1e12449f07603f8e4eeffdb58a238d50e240f5356c938bc909fe522dda`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Registry validator and UI MUST rules.

## Publish validation

| ID | Rule |
| --- | --- |
| PK-T01 | When `packageKind` is **`template`**, validator **must not** require `.beskid/docs/api.json`. |
| PK-T02 | Validator **must** require `.beskid/template.json` with `schema: beskid.template.v1`. |
| PK-T03 | `Project.proj` **must** be present and **should** declare `type: Template` for author packages. |
| PK-T04 | `package.json` `id` **must** match `Project.proj` `name` (same rule as libraries). |
| PK-T05 | Versioning, checksum, forbidden paths, and yank semantics **must** match library packages. |

## Registry UI

| ID | Rule |
| --- | --- |
| PK-U01 | Package detail for `template` **must not** render API documentation components. |
| PK-U02 | Search and catalog **may** filter by `packageKind`. |
| PK-U03 | Dashboard publish flows **must** allow selecting template projects for pack. |

## Edge cases

- Upload library `.bpk` to template-only route — reject if `packageKind` mismatch when enforced server-side.
- Template package with `documentation.apiJson` in `package.json` — strip at publish or reject as invalid for template profile.
- **Yanked** template: catalog shows yank; `beskid new` warns per [project templates contracts](../project-templates/contracts-and-edge-cases/).
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/template-packages/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/template-packages/articles/design-model/content.md`  
**SHA-256:** `c0fb40d5a25f76852b378d05b1b76670595051da274aa719dabb30e4cb743b43`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Normative **`beskid.package.v1`** extensions and artifact layout for template packages.

## `package.json` fields

| Key | Required | Meaning |
| --- | --- | --- |
| `schema` | yes | `beskid.package.v1` |
| `id` | yes | Registry package name |
| `version` | yes | Artifact version string |
| `packageKind` | yes for template profile | **`template`** |
| `template` | recommended | Summary: `shortName`, `identity`, `tags.type` copied from `.beskid/template.json` at pack time |
| `documentation` | — | **Must not** include `apiJson` pointer for `packageKind: template` |

Default **`packageKind`** when omitted remains **`library`** for backward compatibility.

## Reserved kinds

| `packageKind` | Status |
| --- | --- |
| `library` | Current default; requires `api.json` when server policy `RequireStructuredApiDoc` is true |
| `template` | This feature |
| `tool` | Reserved; normative contract deferred to [Package kinds](/platform-spec/tooling/registry-client/package-kinds/) |

## `.bpk` required entries (template profile)

| Entry | Required |
| --- | --- |
| `package.json` with `packageKind: template` | yes |
| `Project.proj` | yes (authoring manifest; may be `type: Template`) |
| `checksums.sha256` | yes |
| `.beskid/template.json` | yes |
| `src/**` or template content roots | yes — at least one scaffold file |
| `.beskid/docs/api.json` | **no** |

## pckg package page (template mode)

When `packageKind === template`, the server and dashboard **must**:

1. **Hide** API documentation tabs, symbol browser, and `api.json` download.
2. **Show** template metadata card: `shortName`, `tags.type`, `classifications`, `description`.
3. **Show** install snippet: `beskid new install <id>` and `beskid new <shortName>`.
4. **Show** readme / root markdown when present.
5. **Show** version list with yank badges (same as libraries).

Category field on `PackageEntity` **may** mirror `tags.type` for filtering (`Template`, `Console`, etc.) but **`packageKind`** is authoritative for routing.

## Workspace publish

Workspace bundles **may** include template member packages. Each member `.bpk` **must** declare its own `packageKind`. Mixed workspaces (libraries + templates) are allowed.

## Diagram

```arch
flowchart LR
  PACK[beskid pckg pack]
  BPK[.bpk artifact]
  VAL[PackageArtifactValidator]
  REG[pckg registry]
  UI[Template package page]
  NEW[beskid new install]
  PACK --> BPK --> VAL --> REG --> UI
  REG --> NEW
```

## Code anchors

- `compiler/crates/beskid_pckg_server/Services/PackageArtifactValidator.cs`
- `compiler/crates/beskid_pckg_server/Components/Pages/` package detail views
- `compiler/crates/beskid_pckg` pack command (planned `packageKind` emission)
``````

</details>

### Source Record: Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/project-scaffolding/template-packages/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/tooling/project-scaffolding/template-packages/articles/verification-and-traceability/content.md`  
**SHA-256:** `b515a456155eb2d7ad214260d61b6eedb0fa935d45f1c0524aa348dc086a9e14`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Traceability for pckg template profile implementation.

## Tests

| Test | Location (planned) |
| --- | --- |
| Template `.bpk` validates without `api.json` | `compiler/crates/beskid_pckg_server/tests/Unit/PackageArtifactValidatorTests.cs` |
| Library `.bpk` still requires `api.json` when policy on | same |
| Template package page hides docs | `Server.Tests` integration or bUnit on package detail |
| Pack sets `packageKind: template` | `beskid_tests` pack golden `package.json` |

## Manual QA

1. Publish `beskid.templates.console` to test registry.
2. Open package page — confirm no API docs tab.
3. `beskid new install beskid.templates.console` — success.
4. Yank version — `beskid new console` prints warning.
``````

</details>
