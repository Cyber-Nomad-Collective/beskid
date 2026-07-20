<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Extension surface Specification

## Purpose

VS Code extension views, focus model, LSP initialization, status-bar phases, and cross-feature command wiring.

## Requirements

### Requirement: Four views: Decision [D-TOOL-VSC-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Four views under one container.

**Stable ID:** `BSP-REQ-833511F9315F`  
**Legacy source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/adr/0001-four-activity-bar-views/content.md`  
**Source SHA-256:** `3b24424f44686df64d26f1aeb0ce92119c4767041510ebf326ae4649b2ee9397`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: focusedProjectUri: Decision [D-TOOL-VSC-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Single focus drives outline and packages.

**Stable ID:** `BSP-REQ-B6E927E45DE8`  
**Legacy source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/adr/0002-focused-project-uri/content.md`  
**Source SHA-256:** `ad8650630141e158600fd649bb54d582c0a7a71803261adc7e40b241fc26dd2c`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: pckgClient only: Decision [D-TOOL-VSC-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Registry HTTP via pckgClient only.

**Stable ID:** `BSP-REQ-E6EBAFC1AA0E`  
**Legacy source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/adr/0003-pckg-client-only-http/content.md`  
**Source SHA-256:** `45e731100bb34f90330db0f8b5c135d2317dc3d51f6e260776fd2aa1da659005`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: LSP graph only: Decision [D-TOOL-VSC-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Graph data via LSP executeCommand only — **superseded in part** by [Graph visualization ADR D-TOOL-GRAPH-0001](/platform-spec/tooling/graph-visualization/adr/0001-mermaid-single-format/).
> 
> LSP **must** remain the authority for graph content. Payloads **may** include Mermaid strings and revision fingerprints from `beskid.getGraph`. The extension **must not** rebuild domain graphs locally.

**Stable ID:** `BSP-REQ-B3C5EDA84410`  
**Legacy source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/adr/0004-lsp-graph-data-only/content.md`  
**Source SHA-256:** `9b201978d6f7193e68bf8f2c54cd847cceadc23e05a672b2e666443f316a2dd0`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Status controller: Decision [D-TOOL-VSC-0005]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> One status bar for LSP, pckg, CLI.

**Stable ID:** `BSP-REQ-0C3586B77412`  
**Legacy source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/adr/0005-shared-status-controller/content.md`  
**Source SHA-256:** `947f443fd014c7f1ad79aa94c6d5a8a6252cdcf5953882e2b346d7f59ea3bf40`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Status bar modal overlay: Decision [D-TOOL-VSC-0006]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> 1. **Remove** `beskidDashboardView` from `contributes.views.beskidViews`.
> 2. Status-bar click runs **`beskid.modal.open`**, which creates or reveals a singleton WebviewPanel with centered card UI (LSP phase, focused project, quick actions).
> 3. Escape, scrim click, or close disposes the panel.
> 4. **`beskid.debug.enabled`** (default `false`) gates the optional Debug tree view.

**Stable ID:** `BSP-REQ-5146E5642AC6`  
**Legacy source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/adr/0006-status-bar-modal-overlay/content.md`  
**Source SHA-256:** `c7286e387bcc118d121ca2e224985bbe66623a06ca182bf35587c80b0f496614`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Extension surface

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/extension-surface/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/content.md`  
**SHA-256:** `d4693c1ba6fc720c121914f3845deec6d288dfb7a7a9b519d66f4b31e28d6c38`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
**Extension surface** is the cross-cutting contract for the Beskid VS Code extension: **four activity-bar views**, the **`focusedProjectUri`** focus model, language-client **initialization** and configuration sync, shared **status-bar phases** (LSP scan, registry, CLI), and palette commands that tie explorers, outline, packages, and tasks together.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `beskid_vscode/package.json` — `contributes.views`, `commands`, `configuration`, `taskDefinitions`
- `beskid_vscode/src/extension.ts`, `runtime/BeskidExtensionRuntime.ts`, `lsp/beskidLanguageClient.ts`
- `beskid_vscode/src/status/beskidStatusController.ts`
- LSP: `compiler/crates/beskid_lsp/src/server/init.rs`, `backend.rs`
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
The extension **must** present **Workspaces**, **Project**, **Outline**, and **Packages** views under a single Beskid view container. **Outline** continues to reflect symbols for the focused project; **Packages** and **Project** **must** share **`focusedProjectUri`**. Registry HTTP **must** use **`pckgClient`** only; workspace graphs **must** use LSP executeCommands documented in [workspace and project explorer](../workspace-project-explorer/contracts-and-edge-cases/).
</SpecSection>

<SpecSection title="Inputs and outputs" id="inputs-and-outputs">
| Input | Output |
| --- | --- |
| VS Code workspace folders | LSP workspace roots; explorer workspace list |
| User focus (tree, auto-select, `beskid.selectProject`) | `focusedProjectUri` → LSP + dependent views |
| Settings (`beskid.cli.path`, `beskid.pckg.*`, `beskid.project.*`) | Client behavior, registry URL, CLI spawn |
| LSP progress / scan | Status bar phases for analysis |
| User package/CLI actions | Status phases `search`, `details`, `fetch`, `lock`, `build`, … |
</SpecSection>

<SpecSection title="State model" id="state-model">
| State | Storage | Consumers |
| --- | --- | --- |
| `focusedProjectUri` | `workspaceState` + LSP server | Project tree, outline, packages ThisProject |
| Language client handle | Extension runtime | All LSP requests |
| Status controller snapshot | In-memory | Single status bar item |
| pckg caches | `pckgClient` | Packages view only |
</SpecSection>

<SpecSection title="Algorithms and flow" id="algorithms-and-flow">
See **[flow and algorithm](./flow-and-algorithm/)** for activation → LSP init → tree refresh → package search.
</SpecSection>

<SpecSection title="Edge cases and errors" id="edge-cases-and-errors">
- **Server path change:** Full language-client restart **required**.
- **Focus-only change:** Configuration notification only (see explorer feature).
- **Offline registry:** Packages registry section errors; LSP/local sections remain usable.
- **Missing `beskid` on PATH:** CLI commands **must** fail with explicit notification referencing `beskid.cli.path`.
</SpecSection>

<SpecSection title="Compatibility and versioning" id="compatibility-and-versioning">
- Extension engine pin and Open VSX platform matrix remain governed by publish workflow (darwin-arm64 / darwin-x64 LSP target pairing).
- The Compiler CI workflow is the sole global distribution-version authority: it **must** mint exactly `0.4.<GITHUB_RUN_NUMBER>` on `main` and emit that value. Open VSX **must** consume the emitted value from the triggering Compiler run; it **must not** derive a version from its own tag, commit, manifest, or workflow run number.
- `selectedProjectUri` deprecated in favor of `focusedProjectUri` for one release cycle.
</SpecSection>

<SpecSection title="Security and performance notes" id="security-and-performance-notes">
- Secrets only in `SecretStorage`.
- Debounce file watchers and registry search.
- Do not restart LSP on focus churn.
</SpecSection>

<SpecSection title="Examples" id="examples">
See **[examples](./examples/)** for corelib workspace and single-app project walkthroughs.
</SpecSection>

<SpecSection title="Verification and traceability" id="verification-and-traceability">
See **[verification and traceability](./verification-and-traceability/)** for CI, unit, and smoke anchors.
</SpecSection>

<SpecSection title="Decisions" id="decisions">
No open decisions. ADRs **`D-TOOL-VSC-0001`** … **`0005`** under **`adr/`**; use the **ADRs** tab. Area index: [decisions record](../decisions-record/).
</SpecSection>

<SpecSection title="Related features" id="related-features">
- **[Workspace and project explorer](../workspace-project-explorer/)**
- **[Package manager panel](../package-manager-panel/)**
- **[Snapshot and refresh contract](/platform-spec/tooling/lsp/snapshot-and-refresh-contract/)**
</SpecSection>

<SpecSection title="Newcomer reading order" id="newcomer-reading-order">
1. [VS Code extension area](../)
2. This hub → [Design model](./design-model/) → [Contracts](./contracts-and-edge-cases/) → [Flow](./flow-and-algorithm/) → [Examples](./examples/) → [Verification](./verification-and-traceability/)
3. Child features [workspace explorer](../workspace-project-explorer/) and [package panel](../package-manager-panel/) for depth
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-TOOL-VSC-0001` … `D-TOOL-VSC-0006`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Four views

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/extension-surface/adr/0001-four-activity-bar-views/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/adr/0001-four-activity-bar-views/content.md`  
**SHA-256:** `3b24424f44686df64d26f1aeb0ce92119c4767041510ebf326ae4649b2ee9397`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Extension UX.

## Decision

Four views under one container.

## Consequences

beskid_vscode runtime.

## Verification anchors

package.json; runtime tests.
``````

</details>

### Source Record: focusedProjectUri

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/extension-surface/adr/0002-focused-project-uri/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/adr/0002-focused-project-uri/content.md`  
**SHA-256:** `ad8650630141e158600fd649bb54d582c0a7a71803261adc7e40b241fc26dd2c`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Extension UX.

## Decision

Single focus drives outline and packages.

## Consequences

beskid_vscode runtime.

## Verification anchors

package.json; runtime tests.
``````

</details>

### Source Record: pckgClient only

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/extension-surface/adr/0003-pckg-client-only-http/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/adr/0003-pckg-client-only-http/content.md`  
**SHA-256:** `45e731100bb34f90330db0f8b5c135d2317dc3d51f6e260776fd2aa1da659005`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Extension UX.

## Decision

Registry HTTP via pckgClient only.

## Consequences

beskid_vscode runtime.

## Verification anchors

package.json; runtime tests.
``````

</details>

### Source Record: LSP graph only

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/extension-surface/adr/0004-lsp-graph-data-only/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/adr/0004-lsp-graph-data-only/content.md`  
**SHA-256:** `9b201978d6f7193e68bf8f2c54cd847cceadc23e05a672b2e666443f316a2dd0`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Extension UX.

## Decision

Graph data via LSP executeCommand only — **superseded in part** by [Graph visualization ADR D-TOOL-GRAPH-0001](/platform-spec/tooling/graph-visualization/adr/0001-mermaid-single-format/).

LSP **must** remain the authority for graph content. Payloads **may** include Mermaid strings and revision fingerprints from `beskid.getGraph`. The extension **must not** rebuild domain graphs locally.

## Consequences

beskid_vscode runtime; Graph Explorer panel renders LSP-supplied Mermaid.

## Verification anchors

package.json; runtime tests.
``````

</details>

### Source Record: Status controller

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/extension-surface/adr/0005-shared-status-controller/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/adr/0005-shared-status-controller/content.md`  
**SHA-256:** `947f443fd014c7f1ad79aa94c6d5a8a6252cdcf5953882e2b346d7f59ea3bf40`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Extension UX.

## Decision

One status bar for LSP, pckg, CLI.

## Consequences

beskid_vscode runtime.

## Verification anchors

package.json; runtime tests.
``````

</details>

### Source Record: Status bar modal overlay

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/extension-surface/adr/0006-status-bar-modal-overlay/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/adr/0006-status-bar-modal-overlay/content.md`  
**SHA-256:** `c7286e387bcc118d121ca2e224985bbe66623a06ca182bf35587c80b0f496614`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

An earlier sidebar **Dashboard** webview (`beskidDashboardView`) occupied the top of the Beskid activity-bar container. Operators expected the Beskid status-bar item to open a lightweight **popover-style** quick panel (runtime snapshot + actions), not a persistent sidebar header.

VS Code extensions have no native floating popover API. A singleton **WebviewPanel** with modal scrim styling is the supported overlay pattern.

## Decision

1. **Remove** `beskidDashboardView` from `contributes.views.beskidViews`.
2. Status-bar click runs **`beskid.modal.open`**, which creates or reveals a singleton WebviewPanel with centered card UI (LSP phase, focused project, quick actions).
3. Escape, scrim click, or close disposes the panel.
4. **`beskid.debug.enabled`** (default `false`) gates the optional Debug tree view.

## Consequences

- Activity bar shows Workspaces, Project, Outline, and Packages (local deps) only.
- Dashboard HTML moves to the modal panel module; no sidebar webview views remain.
- Integration tests assert `beskid.modal.open` instead of `beskidDashboardView.focus`.

## Verification anchors

`beskid_vscode/package.json`; `beskid_vscode/src/dashboard/BeskidModalPanel.ts`; `test/viewsContract.test.ts`.
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/extension-surface/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `91e361ccf5fd1de45cf1b4cdaf01858340c02d39f0e72890628733aa712255fa`

<details>
<summary>Migrated source text</summary>

``````markdown
## focusedProjectUri

| Surface | Key |
| --- | --- |
| LSP initialize | `initializationOptions.focusedProjectUri` |
| Deprecated alias | `initializationOptions.selectedProjectUri` (one release) |
| Configuration | `beskid.project.focusedProjectUri` in `workspace/didChangeConfiguration` |

When unset, LSP scans all workspace roots without prioritizing a single manifest.

## LSP executeCommand payloads

### `beskid.listWorkspaces`

**Arguments:** `[]`  
**Returns:**

```json
{
  "workspaces": [
    {
      "uri": "file:///…/Workspace.proj",
      "name": "corelib",
      "members": [{ "name": "app", "path": "beskid_corelib", "uri": "file:///…/Project.proj" }]
    }
  ]
}
```

### `beskid.getWorkspaceSummary`

**Arguments:** `[workspaceUri: string]`  
**Returns:** `{ workspaceUri, name, resolver, members[], registries: [{ name, url }] }`

### `beskid.getGraph`

**Arguments:** `[{ projectUri, kind, entryUri?, workspaceUri? }]`  
**Returns:** `{ kind, mermaid, revision, warnings[], metadata: { nodes[], focusedProjectUri? } }` — see [Graph visualization](/platform-spec/tooling/graph-visualization/contracts-and-edge-cases).

### `beskid.getProjectDependencies`

**Arguments:** `[projectUri: string]`  
**Returns:** `{ projectUri, declared[], locked[], unresolved[] }` — `locked` entries include `resolvedVersion`, `materializedRoot`, `registry` when present in `Project.lock`.

## Registry auth

- `beskid.pckg.apiKey` setting or SecretStorage `beskid.pckg.apiKey` → `Authorization: Bearer …` on pckg fetch (matches pckg `ApiKeyAuthentication`).
- Private packages: search/details fail without key; UI shows HTTP error nodes, not silent empty lists.

## Offline / unreachable registry

- Cached search TTL ~30s; details ~60s.
- Non-OK HTTP → tree info node; no unbounded refetch on every `getChildren`.
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/extension-surface/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/articles/design-model/content.md`  
**SHA-256:** `d9961eaeb5b0c212d3b5ae1dbf7c48307372567d5d8a7d6daed5ad33ae25b7fe`

<details>
<summary>Migrated source text</summary>

``````markdown
## Activity bar layout

| View ID | Purpose |
| --- | --- |
| `beskidWorkspaceView` | All `Workspace.proj` trees and members |
| `beskidProjectView` | Focused `Project.proj` targets, dependencies, sources |
| `beskidProjectOutlineView` | Document symbols for `.bd` under focused project |
| `beskidPackagesView` | **This project** dependencies only (local lockfile rows) |

Registry browse and package details use a **document WebviewPanel** (`beskid.packages.open`), not the sidebar tree.

## Status bar modal overlay

Clicking the Beskid status-bar item runs **`beskid.modal.open`**, which reveals a singleton WebviewPanel styled as a modal overlay (runtime snapshot, focused project, quick actions). There is **no** sidebar dashboard webview. See [ADR 0006](./adr/0006-status-bar-modal-overlay/).

## Debug view (optional)

`beskidDebugView` is contributed only when **`beskid.debug.enabled`** is `true` (default **false**). Contributors enable it for LSP/runtime inspection.

## Focus model

- **Focused project** — one `Project.proj` URI drives LSP `focusedProjectUri`, CLI cwd, and the **This project** package section.
- **Auto-select** — when `beskid.project.autoSelectFromEditor` is true, the active editor selects the nearest project manifest.
- **Override** — `beskid.selectProject` quick pick remains available.

## Status bar phases

| Phase | Source |
| --- | --- |
| `workspace_scan` | LSP notification `beskid/status` |
| `search` / `details` | pckg HTTP |
| `fetch` / `lock` / `build` / `test` / `analyze` | CLI runner |

Implementation: `beskid_vscode/src/status/beskidStatusController.ts`, `FocusCoordinator`, slim `BeskidExtensionRuntime`.
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/extension-surface/articles/examples/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/articles/examples/content.md`  
**SHA-256:** `9e3b8a9138a284c28ba931092f02d49c5d5594399160964ee7869fca2001815f`

<details>
<summary>Migrated source text</summary>

``````markdown
## corelib workspace

1. Open `compiler/corelib` (or superrepo with corelib submodule) in VS Code.
2. **Workspaces** lists `Workspace.proj` with member packages (for example `beskid_corelib`, console packages).
3. Click a member → focus updates; **Packages → This project** shows locked `corelib` and siblings from `Project.lock`.
4. **Registry search** for `corelib` hits the configured default registry; **Fetch** runs `beskid fetch --project` on the focused root.

## Single-app project

1. Open a folder with only `Project.proj` (no workspace).
2. Auto-select focuses that manifest when editing `.bd` files.
3. **Project** view lists declared path/git/registry deps; unresolved registry deps show warning icons.
4. `beskid lock` from the Packages view title updates `Project.lock` via CLI.
``````

</details>

### Source Record: FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/extension-surface/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `396882e3a376a0704b42dd0e73ccd046b0cc63c094255b3db2cca235cca6ae9d`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Operator and contributor FAQ for the extension surface and linked features.

## Why do Workspaces and Project show different roots?

**Workspaces** lists every `Workspace.proj` under VS Code folders. **Project** shows only the **focused** `Project.proj` DAG. Standalone apps may leave Workspaces empty while Project still works after auto-select.

## The LSP restarted when I clicked a member — is that expected?

**No.** Focus changes **must** use configuration notification only. If a full restart occurs, file a bug against extension runtime wiring.

## Registry search returns 401

**Public packages** (`GET /api/search`, `GET /api/packages`) work without an API key. HTTP 401/403 on search usually means the registry URL is wrong, the server is misconfigured, or you are requesting a **private** package. Configure **Beskid: Configure Package Registry API Key** only when you need private catalog access or publishing. For human browsing, open `{baseUrl}/packages` in a browser.

## How do I open the quick panel?

Click the **Beskid** item in the status bar (or run **Beskid: Open Quick Panel**). This opens the modal overlay; it is not a sidebar view.

## Debug view is missing

Enable **`beskid.debug.enabled`** in settings (default off). The Debug tree appears in the activity bar when enabled.

## Packages show declared but not locked versions

Run **Lock** from the Packages view title or `beskid lock` in the terminal. Ensure `Project.lock` exists beside `Project.proj` per [workspace and lock contracts](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/).

## `beskid` command not found for Fetch/Lock

Set **`beskid.cli.path`** to the absolute CLI binary (for example from [downloads](/docs/downloads/) or `cli-latest` release).

## Offline development

LSP and **This project** work offline. Registry search requires network; cached hits may appear until TTL expiry.

## Where are executeCommand JSON schemas defined?

Canonical schemas live in [workspace and project explorer — contracts](../workspace-project-explorer/contracts-and-edge-cases/). LSP tests should golden-match those shapes.

## Related topics

- [Contracts](./contracts-and-edge-cases/)
- [Verification](./verification-and-traceability/)
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/extension-surface/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/articles/flow-and-algorithm/content.md`  
**SHA-256:** `2788d1e29016f15a7e2f188155d892ec3eeae328e8720c1ebf105d474722569b`

<details>
<summary>Migrated source text</summary>

``````markdown
## Activation sequence

1. `extension.ts` constructs `BeskidExtensionRuntime`.
2. Register tree providers, commands, task providers, file watchers.
3. Start `LanguageClient` with `focusedProjectUri` from workspace state.
4. `initialized` → LSP workspace scan → `beskid/status` progress.
5. `beskid.listWorkspaces` populates **Workspaces** view.

## Package search flow

1. User runs **Search packages** or view welcome link → `InputBox`.
2. Provider debounces 300ms, calls cached `GET /api/search`.
3. Registry rows expand → `GET /api/packages/{name}` for versions/deps.
4. **Fetch** / **Lock** view title → `beskidCliRunner` → refresh **This project** via `beskid.getProjectDependencies`.

## Watchers

Glob: `**/{*.bd,*.proj,Project.lock,workspace.package.json}` → debounced `beskid.refreshWorkspace` + tree refresh.
``````

</details>

### Source Record: Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/extension-surface/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/extension-surface/articles/verification-and-traceability/content.md`  
**SHA-256:** `d8027153c8aa6f5481b7e12e239d158ca8c9bd8c1101359738a5b74e0ea06a1e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

How implementers prove the extension surface matches this spec.

## LSP (compiler)

| Check | Location |
| --- | --- |
| executeCommand JSON golden tests | `compiler/crates/beskid_lsp` (fixtures with `Workspace.proj` + `Project.lock`) |
| `beskid.refreshWorkspace` regression | Existing `backend.rs` handler + snapshot contract tests |

## Extension (beskid_vscode)

| Check | Location |
| --- | --- |
| `pckgClient` cache + auth header | Unit tests with mock `fetch` |
| `autoSelect` path → project URI | Unit tests under `src/workspace/` |
| E2E smoke | `@vscode/test-electron`: activate, mock executeCommand, assert tree labels |
| Lint in CI | `beskid_vscode` `bun run lint` in extension workflow |

## Platform spec

| Check | Command |
| --- | --- |
| trudoc + platform-spec content | `cd site/website && bun run verify:trudoc -- --preset ci` |

## Manual smoke (corelib)

1. Open `compiler/corelib`.
2. Workspaces: all members visible.
3. Packages: locked deps for selected member.
4. Search registry for `corelib`.
5. Fetch/Lock from view title without LSP restart on focus change.

## Traceability matrix

| Spec section | Implementation | Test |
| --- | --- | --- |
| Four views | `package.json` `contributes.views` | E2E view registration |
| `focusedProjectUri` | `focusState.ts`, LSP init | Unit + LSP golden |
| executeCommands | `beskid_lsp` handlers | Rust JSON golden |
| `pckgClient` | `pckgClient.ts` | Unit mock fetch |
| CLI runner | `beskidCliRunner.ts` | Unit argv builder |

## Related topics

- [Workspace explorer hub](../workspace-project-explorer/)
- [Package panel hub](../package-manager-panel/)
``````

</details>
