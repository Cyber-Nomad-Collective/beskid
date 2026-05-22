#!/usr/bin/env python3
"""One-off generator for tooling domain ADRs. Safe to delete after backfill."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src/content/docs/platform-spec/tooling"
OWNER = """owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it"""


def adr_mdx(
    title: str,
    desc: str,
    adr_id: str,
    adr_date: str,
    feature_title: str,
    feature_href: str,
    context: str,
    decision: str,
    consequences: str,
    verification: str,
) -> str:
    return f"""---
title: {title}
description: {desc}
specLevel: adr
status: Standard
adrId: {adr_id}
adrStatus: Accepted
adrDate: {adr_date}
lastReviewed: 2026-05-22
{OWNER}
relatedTopics:
  - type: Feature
    title: {feature_title}
    href: {feature_href}
    relation: Parent feature hub
---

import SpecAdrChrome from '@beskid/docs-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

{context}

## Decision

{decision}

## Consequences

{consequences}

## Verification anchors

{verification}
"""


def write_adr(
    feature_rel: str,
    filename: str,
    *,
    title: str,
    desc: str,
    adr_id: str,
    adr_date: str,
    feature_title: str,
    feature_href: str,
    context: str,
    decision: str,
    consequences: str,
    verification: str,
) -> Path:
    d = ROOT / feature_rel / "adr"
    d.mkdir(parents=True, exist_ok=True)
    path = d / filename
    path.write_text(
        adr_mdx(
            title,
            desc,
            adr_id,
            adr_date,
            feature_title,
            feature_href,
            context,
            decision,
            consequences,
            verification,
        ),
        encoding="utf-8",
    )
    return path


def main() -> None:
    # project-templates
    feat = "project-scaffolding/project-templates"
    ft, fh = "Project templates", "/platform-spec/tooling/project-scaffolding/project-templates/"
    rows = [
        (
            "0001-beskid-template-v1-engine.mdx",
            "Beskid-native template engine schema",
            "Use beskid.template.v1 only",
            "Foreign template engines would split validation across ecosystems.",
            "The platform **must** use **`beskid.template.v1`** only.",
            "Single parser in tooling.",
            "CI grep excluding foreign schema identifiers.",
        ),
        (
            "0002-placeholder-delimiters.mdx",
            "Human-readable {{ }} placeholders",
            "Use {{symbolId}} delimiters",
            "Authors need syntax distinct from Beskid source.",
            "Text files **must** use **`{{symbolName}}`** placeholders.",
            "Editors can highlight unmatched braces.",
            "Golden substitution tests.",
        ),
        (
            "0003-no-runnable-template-root.mdx",
            "Templates need not build at template root",
            "Validation via instantiation output",
            "Requiring build on template sources slows authoring.",
            "Template packages **need not** compile at template root.",
            "CI validates instantiate-then-build.",
            "`beskid.templates.*` CI pipeline.",
        ),
        (
            "0004-corelib-always-on.mdx",
            "Implicit corelib on instantiated projects",
            "No opt-out manifest flag",
            "Hosts should always have standard library access.",
            "Tooling **must** inject corelib; **must not** allow `noCorelib` / `useCorelib: false`.",
            "Simpler beginner manifests.",
            "Manifest linter E18xx on opt-out keys.",
        ),
        (
            "0005-template-kinds-v1.mdx",
            "Project, workspace, and item kinds",
            "All three via tags.type",
            "Scaffolding covers workspace, project, and item flows.",
            "v1 **must** support project, workspace, and item template kinds.",
            "One engine for all template shapes.",
            "Three fixtures in `beskid_tests`.",
        ),
        (
            "0006-path-and-git-sources.mdx",
            "Path and git template sources",
            "Parity with registry packages",
            "Local workflows need path and git resolution.",
            "Templates **must** resolve from registry, **path**, and **git URL**.",
            "`beskid new --path` and `--git` supported.",
            "Integration tests with temp dir and bare git.",
        ),
        (
            "0007-no-constraint-blocks.mdx",
            "No constraint blocks in template schema",
            "Reject constraints key",
            "Constraint DSL delays v1.",
            "Schema **must not** include constraint blocks.",
            "Simpler authoring.",
            "Validator rejects `constraints`.",
        ),
        (
            "0008-unrestricted-post-actions.mdx",
            "Extensible post-action catalog",
            "Documented action ids",
            "Hosts need extensible post-instantiation hooks.",
            "Post-actions use documented action ids without a v1 whitelist.",
            "Enterprise sandboxes are operator policy.",
            "Action registry in tooling docs.",
        ),
        (
            "0009-update-check-on-use.mdx",
            "Update check on every template use",
            "Compare cache to source when online",
            "Stale caches should be detectable.",
            "Tooling **must** compare cached snapshots on every use when online.",
            "Users see update prompts.",
            "Mock HTTP newer version test.",
        ),
        (
            "0010-yanked-template-warning.mdx",
            "Yanked templates warn but may proceed",
            "Warning not hard error",
            "Yanked packages need consistent policy.",
            "Yanked templates **must** warn; continue **may** need explicit flag.",
            "Aligns with registry yank semantics.",
            "pckg yank API plus CLI test.",
        ),
    ]
    for i, r in enumerate(rows, 1):
        write_adr(
            feat,
            r[0],
            title=r[1],
            desc=r[2],
            adr_id=f"D-TOOL-SCAFF-{i:04d}",
            adr_date="2026-05-21",
            feature_title=ft,
            feature_href=fh,
            context=r[3],
            decision=r[4],
            consequences=r[5],
            verification=r[6],
        )

    # beskid-new
    feat = "project-scaffolding/beskid-new"
    fh = "/platform-spec/tooling/project-scaffolding/beskid-new/"
    for i, (fn, title, dec, ver) in enumerate(
        [
            (
                "0001-beskid-new-command-name.mdx",
                "Command name beskid new",
                "The scaffold command **must** be **`beskid new`** (not `init` or `create`).",
                "`beskid_cli` command table.",
            ),
            (
                "0002-interactive-and-noninteractive.mdx",
                "Interactive and non-interactive modes",
                "Instantiation **must** support interactive and non-interactive flags.",
                "CLI integration tests for both modes.",
            ),
            (
                "0003-update-check-on-instantiate.mdx",
                "Update check on instantiate",
                "Every instantiate **must** run template update check when online.",
                "Mock registry newer version test.",
            ),
        ],
        1,
    ):
        write_adr(
            feat,
            fn,
            title=title,
            desc=title,
            adr_id=f"D-TOOL-SCAFF-{i:04d}",
            adr_date="2026-05-21",
            feature_title="beskid new",
            feature_href=fh,
            context="See [Project templates](/platform-spec/tooling/project-scaffolding/project-templates/).",
            decision=dec,
            consequences="Documented on feature hub and CLI help.",
            verification=ver,
        )

    # template-packages
    feat = "project-scaffolding/template-packages"
    fh = "/platform-spec/tooling/project-scaffolding/template-packages/"
    for i, (fn, title, dec) in enumerate(
        [
            (
                "0001-explicit-package-kind.mdx",
                "Explicit packageKind field",
                "Artifacts **must** carry explicit **`packageKind`** on `beskid.package.v1`.",
            ),
            (
                "0002-template-registry-ui-mode.mdx",
                "Template registry pages hide API docs",
                "pckg detail **must** use template page mode without API documentation tabs.",
            ),
            (
                "0003-no-api-json-for-templates.mdx",
                "api.json not required for templates",
                "`.bpk` with **`packageKind: template`** **must not** require `api.json`.",
            ),
        ],
        1,
    ):
        write_adr(
            feat,
            fn,
            title=title,
            desc=title,
            adr_id=f"D-TOOL-SCAFF-{i:04d}",
            adr_date="2026-05-21",
            feature_title="Template packages",
            feature_href=fh,
            context="See [Package kinds](/platform-spec/tooling/registry-client/package-kinds/).",
            decision=dec,
            consequences="Validator and UI branch on `packageKind`.",
            verification="`PackageArtifactValidator.cs` template profile.",
        )

    # extension-surface
    feat = "vscode-extension/extension-surface"
    fh = "/platform-spec/tooling/vscode-extension/extension-surface/"
    for i, (fn, title, dec) in enumerate(
        [
            ("0001-four-activity-bar-views.mdx", "Four activity-bar views", "present **Workspaces**, **Project**, **Outline**, and **Packages** under one container"),
            ("0002-focused-project-uri.mdx", "Single focusedProjectUri", "drive outline, packages, and LSP ordering from **`focusedProjectUri`**"),
            ("0003-pckg-client-only-http.mdx", "Registry HTTP via pckgClient", "route all registry HTTP through **`pckgClient`** only"),
            ("0004-lsp-graph-data-only.mdx", "Graph data via LSP only", "obtain workspace graphs via LSP executeCommand only (no TS manifest parsers)"),
            ("0005-shared-status-controller.mdx", "Shared status bar controller", "use one status controller for LSP, pckg, and CLI phases"),
        ],
        1,
    ):
        write_adr(
            feat,
            fn,
            title=title,
            desc=title,
            adr_id=f"D-TOOL-VSC-{i:04d}",
            adr_date="2026-05-05",
            feature_title="Extension surface",
            feature_href=fh,
            context="Cross-cutting VS Code extension contract.",
            decision=f"The extension **must** {dec}.",
            consequences="See extension-surface articles and `beskid_vscode` runtime.",
            verification="`beskid_vscode/package.json`; `BeskidExtensionRuntime.ts`.",
        )

    # package-manager-panel
    feat = "vscode-extension/package-manager-panel"
    fh = "/platform-spec/tooling/vscode-extension/package-manager-panel/"
    write_adr(
        feat,
        "0001-single-pckg-client-boundary.mdx",
        title="Single pckgClient boundary",
        desc="All registry HTTP through one module",
        adr_id="D-TOOL-VSC-0001",
        adr_date="2026-05-20",
        feature_title="Package manager panel",
        feature_href=fh,
        context="Scattered HTTP complicates auth.",
        decision="Registry HTTP **must** use `beskid_vscode/src/packages/pckgClient.ts` with caching and SecretStorage.",
        consequences="View actions share one client.",
        verification="No raw fetch outside pckgClient under packages/.",
    )
    write_adr(
        feat,
        "0002-cli-for-lock-mutations.mdx",
        title="CLI for fetch and lock",
        desc="Lock mutations via Beskid CLI",
        adr_id="D-TOOL-VSC-0002",
        adr_date="2026-05-20",
        feature_title="Package manager panel",
        feature_href=fh,
        context="Lock integrity requires CLI resolver.",
        decision="Fetch and lock **must** use Beskid CLI via `beskidCliRunner`, not extension HTTP.",
        consequences="Errors surface in Beskid output channel.",
        verification="Panel invokes `beskid fetch` / `beskid lock`.",
    )

    # workspace-project-explorer
    feat = "vscode-extension/workspace-project-explorer"
    fh = "/platform-spec/tooling/vscode-extension/workspace-project-explorer/"
    write_adr(
        feat,
        "0001-lsp-backed-graph.mdx",
        title="LSP-backed explorer graph",
        desc="Tree data from beskid_lsp",
        adr_id="D-TOOL-VSC-0001",
        adr_date="2026-05-21",
        feature_title="Workspace and project explorer",
        feature_href=fh,
        context="Duplicate parsers drift from analysis.",
        decision="Graph and lock data **must** come from LSP executeCommand, not TS manifest parsers.",
        consequences="Thin `LspProjectApi` wrappers only.",
        verification="`beskid_lsp` executeCommand handlers.",
    )
    write_adr(
        feat,
        "0002-focus-without-lsp-restart.mdx",
        title="Focus without LSP restart",
        desc="didChangeConfiguration for focus",
        adr_id="D-TOOL-VSC-0002",
        adr_date="2026-05-21",
        feature_title="Workspace and project explorer",
        feature_href=fh,
        context="LSP restart on focus harms UX.",
        decision="Focus **must** use `didChangeConfiguration` with `beskid.project.focusedProjectUri`; **must not** restart LSP for focus alone.",
        consequences="Path changes still restart LSP.",
        verification="Extension focus handler; LSP session invalidation.",
    )

    # CLI
    feat = "cli/build-analyze-run-contract"
    fh = "/platform-spec/tooling/cli/build-analyze-run-contract/"
    write_adr(
        feat,
        "0001-hub-authority.mdx",
        title="Hub owns build/analyze/run contract",
        desc="Articles defer to hub",
        adr_id="D-TOOL-CLI-0001",
        adr_date="2026-05-05",
        feature_title="Build, analyze, and run contract",
        feature_href=fh,
        context="Split authority causes drift.",
        decision="This hub owns normative MUST/SHOULD; articles **must not** redefine hub requirements.",
        consequences="Articles link here.",
        verification="trudoc content checks.",
    )
    write_adr(
        feat,
        "0002-shared-analysis-pipeline.mdx",
        title="Shared analysis pipeline with LSP",
        desc="beskid_analysis for CLI and LSP",
        adr_id="D-TOOL-CLI-0002",
        adr_date="2026-05-05",
        feature_title="Build, analyze, and run contract",
        feature_href=fh,
        context="CLI-only analysis diverges from IDE.",
        decision="`build`, `analyze`, and `run` **must** use `beskid_analysis` aligned with LSP refresh.",
        consequences="Diagnostics parity with compiler build-pipeline.",
        verification="`beskid_cli/src/commands/`; pipeline tests.",
    )

    feat = "cli/api-json-contract"
    fh = "/platform-spec/tooling/cli/api-json-contract/"
    write_adr(
        feat,
        "0001-api-json-primary-contract.mdx",
        title="api.json primary docs contract",
        desc="Structured graph for registry UI",
        adr_id="D-TOOL-CLI-0001",
        adr_date="2026-05-20",
        feature_title="api.json contract",
        feature_href=fh,
        context="Ad-hoc grouping breaks pckg docs UI.",
        decision="`api.json` is the **primary** structured contract for library packages under `.beskid/docs/`.",
        consequences="Templates exempt per SCAFF ADRs.",
        verification="`beskid_analysis/src/doc/`; pckg PackageDocs.",
    )
    write_adr(
        feat,
        "0002-hub-authority.mdx",
        title="Hub authority for api.json",
        desc="Spec over informal notes",
        adr_id="D-TOOL-CLI-0002",
        adr_date="2026-05-20",
        feature_title="api.json contract",
        feature_href=fh,
        context="Implementation notes must not override spec.",
        decision="Hub and ADRs supersede informal crate notes until superseded.",
        consequences="Spec leads code.",
        verification="Platform-spec verify on hub.",
    )

    # LSP
    feat = "lsp/snapshot-and-refresh-contract"
    fh = "/platform-spec/tooling/lsp/snapshot-and-refresh-contract/"
    write_adr(
        feat,
        "0001-hub-authority.mdx",
        title="Hub owns snapshot contract",
        desc="LSP refresh normative text",
        adr_id="D-TOOL-LSP-0001",
        adr_date="2026-05-05",
        feature_title="Snapshot and refresh contract",
        feature_href=fh,
        context="Refresh semantics need one authority.",
        decision="This hub owns snapshot and refresh MUST/SHOULD.",
        consequences="Extension observes same refresh as CLI.",
        verification="`beskid_lsp` diagnostics tests.",
    )
    write_adr(
        feat,
        "0002-invalidation-on-focus-and-manifest.mdx",
        title="Invalidate on focus and manifest",
        desc="CompilationContext cache",
        adr_id="D-TOOL-LSP-0002",
        adr_date="2026-05-05",
        feature_title="Snapshot and refresh contract",
        feature_href=fh,
        context="Stale snapshots mislead IDE users.",
        decision="Invalidate `CompilationContext` on focus, manifest, or lock changes; debounce file watchers.",
        consequences="Extension uses configuration notification for focus.",
        verification="`beskid_lsp/src/session/`; resolve tests.",
    )

    # PCKG
    feat = "registry-client/package-kinds"
    fh = "/platform-spec/tooling/registry-client/package-kinds/"
    for i, (fn, title, dec) in enumerate(
        [
            ("0001-explicit-package-kind-field.mdx", "Explicit packageKind field", "Publish **`packageKind`** explicitly on `beskid.package.v1`."),
            ("0002-tool-kind-reserved.mdx", "tool kind reserved", "Reserve **`tool`** without v1 normative body."),
            ("0003-beskid-templates-prefix.mdx", "beskid.templates.* prefix", "First-party templates **must** use **`beskid.templates.*`** id prefix."),
        ],
        1,
    ):
        write_adr(
            feat,
            fn,
            title=title,
            desc=title,
            adr_id=f"D-TOOL-PCKG-{i:04d}",
            adr_date="2026-05-20",
            feature_title="Package kinds",
            feature_href=fh,
            context="Registry taxonomy drives validators.",
            decision=dec,
            consequences="pckg routing keyed on packageKind.",
            verification="PackageArtifactValidator; detail routing tests.",
        )

    feat = "registry-client/pckg-client-contract"
    fh = "/platform-spec/tooling/registry-client/pckg-client-contract/"
    write_adr(
        feat,
        "0001-hub-authority.mdx",
        title="Hub owns pckg client contract",
        desc="HTTP and auth on hub",
        adr_id="D-TOOL-PCKG-0001",
        adr_date="2026-05-09",
        feature_title="pckg client contract",
        feature_href=fh,
        context="CLI and extension need one registry story.",
        decision="Normative registry HTTP and auth on this hub; VS Code defers to package manager panel.",
        consequences="pckgClient in extension; beskid_pckg in CLI.",
        verification="beskid_pckg; pckgClient.ts.",
    )
    write_adr(
        feat,
        "0002-registry-assigned-versions.mdx",
        title="Registry-assigned versions",
        desc="Publish semver from registry",
        adr_id="D-TOOL-PCKG-0002",
        adr_date="2026-05-09",
        feature_title="pckg client contract",
        feature_href=fh,
        context="Manual publisher versions caused drift.",
        decision="Routine publish **must** use registry-assigned versions.",
        consequences="Detail pages show server version.",
        verification="pckg publish API tests.",
    )

    # MAN
    feat = "manifests-and-lockfiles/project-manifest-contract"
    fh = "/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/"
    write_adr(
        feat,
        "0001-hub-authority.mdx",
        title="Hub owns project manifest",
        desc="Project.proj contract",
        adr_id="D-TOOL-MAN-0001",
        adr_date="2026-05-20",
        feature_title="Project manifest contract",
        feature_href=fh,
        context="CLI, LSP, and pckg consume manifests.",
        decision="This hub owns `Project.proj` normative contract.",
        consequences="Mod and Template types on hub.",
        verification="beskid_analysis manifest tests.",
    )
    write_adr(
        feat,
        "0002-mod-and-template-project-types.mdx",
        title="Mod and Template project types",
        desc="project.type discrimination",
        adr_id="D-TOOL-MAN-0002",
        adr_date="2026-05-20",
        feature_title="Project manifest contract",
        feature_href=fh,
        context="Mods and templates need explicit types.",
        decision="Manifests **may** use **`type: Mod`** or **`type: Template`**; hosts follow Host rules with implicit corelib.",
        consequences="Links to compiler-mods and scaffolding.",
        verification="Project fixtures in beskid_tests.",
    )

    feat = "manifests-and-lockfiles/workspace-and-lock-contracts"
    fh = "/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/"
    write_adr(
        feat,
        "0001-hub-authority.mdx",
        title="Hub owns workspace and lock",
        desc="Workspace.proj and Project.lock",
        adr_id="D-TOOL-MAN-0001",
        adr_date="2026-05-05",
        feature_title="Workspace and lock contracts",
        feature_href=fh,
        context="Lock semantics align CLI and IDE.",
        decision="This hub owns workspace and lock normative rules.",
        consequences="Fetch/lock defer here.",
        verification="beskid_analysis resolution tests.",
    )
    write_adr(
        feat,
        "0002-lock-mutations-via-cli.mdx",
        title="Lock mutations via CLI",
        desc="Shared resolver for lock",
        adr_id="D-TOOL-MAN-0002",
        adr_date="2026-05-05",
        feature_title="Workspace and lock contracts",
        feature_href=fh,
        context="Ad-hoc lock edits bypass resolver.",
        decision="Materialize deps and update locks **must** use `beskid fetch` / `beskid lock`.",
        consequences="Matches package panel ADR.",
        verification="CLI integration; extension invokes CLI.",
    )

    # FLI
    feat = "foreign-library-import"
    fh = "/platform-spec/tooling/foreign-library-import/"
    write_adr(
        feat,
        "0001-link-time-ffi-v03.mdx",
        title="Link-time FFI v0.3",
        desc="Extern to linker inputs",
        adr_id="D-TOOL-FLI-0001",
        adr_date="2026-05-20",
        feature_title="Foreign library import",
        feature_href=fh,
        context="Dynamic loading deferred.",
        decision="v0.3 maps `Extern` libraries to **link-time** inputs via `ExternalLibrary` providers.",
        consequences="See C ABI profile.",
        verification="Planned import lib command tests.",
    )
    write_adr(
        feat,
        "0002-closed-provider-registry.mdx",
        title="Closed provider registry",
        desc="No plugins in v0.3",
        adr_id="D-TOOL-FLI-0002",
        adr_date="2026-05-20",
        feature_title="Foreign library import",
        feature_href=fh,
        context="Plugin providers need security review.",
        decision="v0.3 CLI ships a **closed** provider registry; third-party plugins deferred.",
        consequences="C/POSIX tier-1 hosts in scope table.",
        verification="Provider list in CLI module.",
    )

    count = len(list(ROOT.rglob("adr/*.mdx")))
    print(f"Created/updated {count} ADR files under tooling")


if __name__ == "__main__":
    main()
