# Handoff — tooling-package-kind-tool-and-formatter-spec (A8)

## Branches and SHAs

- **superrepo** (`github.com/Cyber-Nomad-Collective/beskid`): `orch/beskid-v0-3/tooling-package-kind-tool-and-formatter-spec` @ **`c2dece3`** (base `09c13b9` / `main`).
- **compiler** (`github.com/Cyber-Nomad-Collective/beskid_compiler`): `orch/beskid-v0-3/tooling-package-kind-tool-and-formatter-spec` @ **`4579bab`** (base `6ae272b` / `main`).
- **pckg** (`github.com/Cyber-Nomad-Collective/beskid_pckg`): `orch/beskid-v0-3/tooling-package-kind-tool-and-formatter-spec` @ **`135f7c9`** (base `2337393` / `main`).

All three remote branches are up to date with the local work; the superrepo gitlinks point at the published submodule commits.

## Mission summary

Land the v0.3 tooling deliverables that did not fit the other A1–A7 tracks:

1. **`packageKind: tool` lifted from Reserved to Standard** — normative validator profile in `pckg`, registry dashboard surface (Fluent UI Blazor `_isToolPackage` mirror of `_isTemplatePackage`), Rust `PackProfile::Tool` plus `beskid pckg pack --package-kind tool`.
2. **Formatter feature hub** — new `platform-spec/tooling/formatter/` (index + design-model + verification-and-traceability + two ADRs) anchored at the existing `beskid_analysis::format::format_program` / `beskid format` implementation.
3. **`tooling/index.mdx` linkage** — feature index calls out Formatter and the now-Standard Package kinds entry.

ADR record:

- **D-TOOL-PCKG-0002** — `tool reserved` → marked **Superseded** with status, history, and pointer to 0004.
- **D-TOOL-PCKG-0004** — `tool kind Standard` — new ADR with full verification anchors.
- **D-FORMAT-0001** — `Canonical pretty-printer (no user knobs)`.
- **D-FORMAT-0002** — `Emit trait + policy split`.

## What changed (by repo)

### Superrepo

- `site/website/src/content/docs/platform-spec/tooling/registry-client/package-kinds/index.mdx` — rewritten for the Tool kind: validator profile, CLI routing, dashboard surface, verification anchors, and an updated Decisions index.
- `site/website/src/content/docs/platform-spec/tooling/registry-client/package-kinds/adr/0002-tool-kind-reserved.mdx` — marked Superseded.
- `site/website/src/content/docs/platform-spec/tooling/registry-client/package-kinds/adr/0004-tool-kind-standard.mdx` — new ADR.
- `site/website/src/content/docs/platform-spec/tooling/formatter/` — new feature hub:
  - `index.mdx` (normative, Status: Standard)
  - `layout.json`
  - `design-model.mdx`
  - `verification-and-traceability.mdx`
  - `adr/0001-canonical-pretty-printer.mdx`
  - `adr/0002-emit-trait-policy-split.mdx`
- `site/website/src/content/docs/platform-spec/tooling/index.mdx` — feature index now links Formatter and Package kinds.
- Gitlinks: `compiler` → `4579bab`, `pckg` → `135f7c9`.

### compiler

- `compiler/crates/beskid_pckg/src/pack.rs`
  - `PACKAGE_KIND_TOOL` / `PACKAGE_KIND_LIBRARY` constants.
  - `PackProfile::Tool` variant + `is_tool()` helper.
  - `build_package_json` Tool arm (no `documentation.apiJson`).
  - `strip_tool_pack_excludes` to remove generated `.beskid/docs/**` from tool artifacts.
  - `PackProfileOverride` enum + `detect_pack_profile_with_override` (Auto / Tool, with mutual-exclusion check vs `type = Template` manifests).
  - New unit tests: `pack_profile_helpers_track_variant`, `build_package_json_tool_profile_omits_api_doc_pointer`, `strip_tool_pack_excludes_removes_generated_docs`, `detect_pack_profile_with_override_forces_tool_when_no_manifest`, `detect_pack_profile_with_override_rejects_template_project`, `detect_pack_profile_auto_matches_legacy_behavior`.
- `compiler/crates/beskid_pckg/src/cli.rs`
  - `PackArgsPackageKind` (clap `ValueEnum`: `auto`, `tool`) + `PackArgs::package_kind_override()`.
  - `execute_pack` calls `detect_pack_profile_with_override` and `strip_tool_pack_excludes` when the resolved profile is `Tool`.
  - Unit tests for clap parsing: `pack_args_default_package_kind_is_auto`, `pack_args_package_kind_tool_flag_parses`, `pack_args_package_kind_rejects_unknown_value`.
- `compiler/crates/beskid_pckg/src/lib.rs` — re-exports the new public surface.
- `compiler/crates/beskid_analysis/docs/formatter.md` — implementation-side companion to the new platform-spec feature hub (module organisation, public surface, layout policy, CLI behaviour, error handling, maintenance checklist).

### pckg

- `src/Server/Services/PackageKinds.cs` — `Tool` constant, `IsTool()` predicate, `IsSupported()` now accepts `tool`.
- `src/Server/Services/PackagePublishDocumentation.cs` — `tool` packages skip the structured api.json publish requirement (same path as `template`).
- `src/Server/Services/PackageArtifactValidator.cs` — `_isToolPackage` short-circuits the `RequireStructuredApiDoc` check; tool artifacts containing `.beskid/template.json` are rejected with a deterministic error message; unknown `packageKind` values are rejected.
- `src/Server/Components/Pages/PackageDetails.razor`(`.cs`) — Fluent UI badge + "Tool package" install-instructions card (`beskid pckg download …`), `_isToolPackage` mirrors `_isTemplatePackage`, Documentation / Source tabs hidden for tool packages, doc-page navigation skipped.
- `src/Server.Tests/TestUtils/BpkTestArtifactBuilder.cs` — `CreateValidToolArtifact` helper.
- `src/Server.Tests/Unit/PackageArtifactValidatorTests.cs` — new tests: `ValidateAsync_Accepts_Tool_Artifact_Without_Api_Json`, `ValidateAsync_Accepts_Tool_Artifact_With_Optional_Api_Json`, `ValidateAsync_Rejects_Tool_With_Template_Json`, `ValidateAsync_Rejects_Unknown_Package_Kind`.
- `src/Server.Tests/Unit/PackagePublishDocumentationTests.cs` — `EnsureStructuredApiDoc_skips_tool_packages`.
- `src/Server.Tests/Integration/ToolPackagePublishIntegrationTests.cs` — end-to-end publish test for a tool artifact (kind persisted, no structured doc required).

## Verification

### Rust — compiler

Worktree: `/tmp/compiler-tooling` (isolated from concurrent A4/A6 agents that kept resetting the main checkout).

| Command | Result |
| --- | --- |
| `cargo test -p beskid_pckg --lib` | **15 passed, 0 failed** (`6` pre-existing pack/template tests + `9` new tool tests across pack & cli). |
| `BESKID_CORELIB_SOURCE=/Users/mikserek/Projects/beskid/compiler/corelib cargo test -p beskid_cli format` | **2 passed, 0 failed, 17 filtered out.** |

### .NET — pckg Server.Tests

| Command | Result |
| --- | --- |
| `dotnet test src/Server.Tests/Server.Tests.csproj --nologo -v quiet --filter "FullyQualifiedName~PackageArtifactValidatorTests\|FullyQualifiedName~PackagePublishDocumentationTests\|FullyQualifiedName~ToolPackagePublishIntegrationTests"` | **21 passed, 0 failed** (all new and validator-related tests). |
| `dotnet test src/Server.Tests/Server.Tests.csproj --nologo -v quiet` (full suite) | **108 passed, 2 failed, 110 total** — the two failures are **pre-existing on `main`** (`PackageDocsIntegrationTests.DocsStructured_ApiJson_Above_MarkdownCap_Below_StructuredCap_Returns_Ok`, `PackageDocsIntegrationTests.DocsIndex_Includes_BeskidCliGenerated_Docs_Under_DotBeskid_Docs`), not caused by this branch (confirmed by re-running them on `main` with `git stash`/`git checkout`). |

### Platform-spec / trudoc

| Command | Result |
| --- | --- |
| `cd site/website && bun run verify:trudoc -- --preset ci` | **Passed.** 791 layout nodes, 993 docs files scanned, 803 platform-spec files scanned, 102 language-meta files verified. |
| `cd site/website && bun run verify:trudoc -- --preset ci --strict` | **Passed.** |
| `cd site/website && bun run verify:platform-spec-content -- --strict` | **Passed.** Strict mode confirms no scaffold-only / circular-canon / missing-Decisions issues on the new content. |

## Operational notes (lessons learned for the aggregator)

This task collided heavily with other concurrent A-series subplanners (A4 / A6) that reset the **shared** compiler and superrepo working trees out from under us mid-edit. Recovery required moving compiler work into an isolated worktree at `/tmp/compiler-tooling` (using the existing `git worktree` pattern other tracks already follow) and rebuilding the superrepo work in `/tmp/superrepo-tooling`. The committed branches survived; only working-tree state was at risk. The lesson for the aggregate merge worker: do **not** trust the main checkouts at `/Users/mikserek/Projects/beskid`, `/Users/mikserek/Projects/beskid/compiler`, or `/Users/mikserek/Projects/beskid/pckg` for the latest A8 content — always read the remote branch (`orch/beskid-v0-3/tooling-package-kind-tool-and-formatter-spec`).

## Open follow-ups (out of A8 scope)

- The two failing `PackageDocsIntegrationTests` cases pre-date this branch; they look like a `Pckg:Publish:RequireStructuredApiDoc` interaction with empty `{}` api.json payloads. Not in A8 paths-allowed.
- The platform-spec hub mentions `beskid pckg download <name> --version <v> --output <path>` as the consumer surface for tool packages; the command already exists. Surfacing it under a higher-level `beskid pckg install` umbrella for tool packages can land in a later v0.3 polish pass.

## Paths

- Plan: `.orchestrate/beskid-v0-3/plan.json` (task `tooling-package-kind-tool-and-formatter-spec`).
- Handoff: `.orchestrate/beskid-v0-3/handoffs/tooling-package-kind-tool-and-formatter-spec.md` (this file).
