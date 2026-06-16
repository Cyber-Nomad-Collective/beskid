---
title: tool kind lifted to Standard
description: Normative validator profile, CLI routing, and dashboard surface for
  packageKind tool.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-TOOL-PCKG-0004
adrStatus: Accepted
adrDate: 2026-05-23
lastReviewed: 2026-05-23
---

## Context

D-TOOL-PCKG-0002 reserved **`tool`** as a forbidden **`packageKind`** while validator profiles, CLI routing, and registry UI surfaces remained undefined. By the v0.3 baseline, three concrete needs converged:

1. **External tool packs** (custom diagnostics, formatter rule packs, language-server extensions) want to ship through pckg without being mis-classified as **`library`** (which forces `api.json` generation) or **`template`** (which forces `.beskid/template.json`).
2. The registry dashboard already routes **`library`** and **`template`** kinds to distinct surfaces via `PackageDetails.razor`. A third surface — with no Docs / Source tabs — is straightforward to add given the existing `_isTemplatePackage` pattern.
3. The Beskid CLI already supports per-profile packing in `beskid_pckg::pack::PackProfile`. Extending the enum with a **`Tool`** variant and a **`--package-kind tool`** CLI flag is a localized change.

The platform-spec leads code: this ADR makes the validator profile, CLI routing, and dashboard surface normative so the implementation can land without ambiguity.

## Decision

Lift **`packageKind: tool`** from Reserved to **Standard** with the following normative profile:

1. **Server validator** (**`PackageArtifactValidator`**) **must** accept **`packageKind: tool`** artifacts. The artifact **must not** contain **`.beskid/template.json`**; the artifact **may** contain **`.beskid/docs/api.json`**, but it **must not** be required by `Pckg:Publish:RequireStructuredApiDoc`. The packed **`package.json`** **must not** include **`documentation.apiJson`** for the tool kind.
2. **Publish persistence** **must** record the resolved **`packageKind`** in the version metadata via the existing `PackageManifestMetadataReader` path.
3. **Dashboard routing** (**`PackageDetails.razor`**) **must** mirror the template-kind pattern: an `_isToolPackage` flag selects an install/usage card and suppresses the Docs / Source tabs by default. The Ratings tab and Versions tab remain unchanged.
4. **Rust pack flow** (`beskid_pckg::pack`) **must** add a **`PackProfile::Tool`** variant and the `build_package_json` path **must** emit `"packageKind": "tool"` without a `documentation` block. A new `strip_tool_pack_excludes` helper **must** remove `.beskid/docs/api.json` from the artifact body when the tool profile is selected.
5. **CLI surface** (`beskid_pckg::cli`) **must** add a **`--package-kind <library|template|tool>`** flag to `pack`. When set to `tool`, the CLI **must** skip the **`api.json`** pre-generation pass in `beskid_cli::cli::maybe_generate_docs_for_pack`. The flag **must** refuse to combine with a `Project.proj` whose `project.type = Template`.

## Consequences

- **Forwards-compatible:** Existing **`library`** and **`template`** artifacts are unaffected; pre-existing `tool`-rejection tests are updated rather than removed.
- **Server-side migration:** `PackageKinds.IsSupported` now returns true for `tool`. Operators running validator policy `RequireStructuredApiDoc = true` see no behavior change for library packages; tool packages explicitly bypass that requirement.
- **CLI ergonomics:** Publishers who want to ship a developer tool through the registry no longer need to hand-author **`package.json`**; the **`beskid pckg pack --package-kind tool`** flow handles it.
- **Dashboard parity:** The pckg UI uses Fluent UI Blazor patterns for the new tool card, matching the existing template install card. No new design tokens are introduced.

## Verification anchors

- `pckg/src/Server.Tests/Unit/PackageArtifactValidatorTests.cs::ValidateAsync_Accepts_Tool_Artifact_Without_Api_Json`
- `pckg/src/Server.Tests/Unit/PackageArtifactValidatorTests.cs::ValidateAsync_Rejects_Tool_With_Template_Json`
- `pckg/src/Server.Tests/Integration/ToolPackagePublishIntegrationTests.cs`
- `compiler/crates/beskid_pckg/src/pack.rs::tests::build_package_json_tool_profile_omits_api_doc_pointer`
- `compiler/crates/beskid_pckg/src/pack.rs::tests::strip_tool_pack_excludes_removes_api_json`
- `compiler/crates/beskid_pckg/src/cli.rs::tests::pack_args_accepts_package_kind_tool`
