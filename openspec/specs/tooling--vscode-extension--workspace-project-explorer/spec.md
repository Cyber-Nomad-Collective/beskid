<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Workspace and project explorer Specification

## Purpose

VS Code tree views for Workspace.proj discovery, member navigation, and focused Project.proj context.

## Requirements

### Requirement: LSP graph: Decision [D-TOOL-VSC-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Graph via LSP executeCommand.

**Stable ID:** `BSP-REQ-3922DA5525FC`  
**Legacy source:** `site/spec-content/platform-spec/tooling/vscode-extension/workspace-project-explorer/adr/0001-lsp-backed-graph/content.md`  
**Source SHA-256:** `0500b30e8213bd7ee0faba09224d7444bf8f989b085fcc2a27ced743887e233d`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Focus without restart: Decision [D-TOOL-VSC-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> didChangeConfiguration for focus; no LSP restart.

**Stable ID:** `BSP-REQ-D96A3F00CFAA`  
**Legacy source:** `site/spec-content/platform-spec/tooling/vscode-extension/workspace-project-explorer/adr/0002-focus-without-lsp-restart/content.md`  
**Source SHA-256:** `a62fe67d1043355b36fa9b648571da025b20e9a11bf00331d2715be8ff89326e`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Workspace and project explorer

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/workspace-project-explorer/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/workspace-project-explorer/content.md`  
**SHA-256:** `a1c896abb3c19e61d73a4dafd99446ec01e6e653444079fb831e624520a57cee`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
Tree views and focus coordination for Beskid workspaces and the active `Project.proj`, backed by LSP executeCommands.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `beskid_vscode/src/workspace/WorkspaceTreeProvider.ts`, `ProjectTreeProvider.ts`, `FocusCoordinator.ts`
- `beskid_vscode/src/workspace/lspProjectApi.ts`
- `compiler/crates/beskid_lsp/src/workspace_scan.rs` — workspace resolution and project graph data
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
The **workspace and project explorer** exposes two Beskid activity-bar tree views. **Workspaces** lists every `Workspace.proj` under open VS Code folders and their declared members. **Project** shows the **focused** `Project.proj` (targets, dependencies, source folders) using LSP graph data—never duplicate manifest parsing in TypeScript.
</SpecSection>

<SpecSection title="Inputs and outputs" id="inputs-and-outputs">
| Input | Source |
| --- | --- |
| VS Code workspace folders | Editor |
| Focused project URI | `beskid.project.autoSelectFromEditor`, tree selection, or `beskid.selectProject` |
| LSP executeCommands | `beskid.listWorkspaces`, `beskid.getWorkspaceSummary`, `beskid.getGraph`, `beskid.getProjectDependencies` |

| Output | Consumer |
| --- | --- |
| Focus change | LSP `focusedProjectUri` via init options + `workspace/didChangeConfiguration` |
| Tree labels / commands | VS Code UI |
</SpecSection>

<SpecSection title="State model" id="state-model">
- **Focused project** — canonical `file://` URI of a `Project.proj`; persisted in workspace state as `beskid.focusedProjectUri` (legacy `beskid.selectedProjectUri` alias for one release).
- **Workspace cache** — refreshed on `beskid.refreshWorkspace` and file watchers for `*.proj`, `Project.lock`, `workspace.package.json`.
</SpecSection>

<SpecSection title="Algorithms and flow" id="algorithms-and-flow">
1. Extension activates → start LSP with `initializationOptions.focusedProjectUri`.
2. **Workspaces** view calls `beskid.listWorkspaces` → render members; member click runs `beskid.focusProject`.
3. **Project** view reads focused URI → `beskid.getProjectDependencies` / `beskid.getGraph` metadata for children; full graph exploration uses the Graph Explorer panel.
4. Optional **auto-select**: active editor path → nearest `Project.proj` when `beskid.project.autoSelectFromEditor` is true.
5. Focus change updates configuration **without** full LSP restart unless server binary settings change.
</SpecSection>

<SpecSection title="Decisions" id="decisions">
No open decisions. **`D-TOOL-VSC-0001`** (LSP-backed graph), **`0002`** (focus without LSP restart)—see **`adr/`** and the **ADRs** tab.
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-TOOL-VSC-0001` … `D-TOOL-VSC-0002`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Decisions record (legacy index)](./articles/decisions-record/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: LSP graph

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/workspace-project-explorer/adr/0001-lsp-backed-graph/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/workspace-project-explorer/adr/0001-lsp-backed-graph/content.md`  
**SHA-256:** `0500b30e8213bd7ee0faba09224d7444bf8f989b085fcc2a27ced743887e233d`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Parser drift.

## Decision

Graph via LSP executeCommand.

## Consequences

Thin wrappers.

## Verification anchors

beskid_lsp handlers.
``````

</details>

### Source Record: Focus without restart

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/workspace-project-explorer/adr/0002-focus-without-lsp-restart/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/workspace-project-explorer/adr/0002-focus-without-lsp-restart/content.md`  
**SHA-256:** `a62fe67d1043355b36fa9b648571da025b20e9a11bf00331d2715be8ff89326e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

UX on focus.

## Decision

didChangeConfiguration for focus; no LSP restart.

## Consequences

Fast focus switch.

## Verification anchors

Session invalidation.
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/workspace-project-explorer/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/workspace-project-explorer/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `d976ce782dd99a3aeb1ae5614ed1d8b24bf13847ef5694d3b6bdf5512b6c82ce`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Normative **LSP `workspace/executeCommand`** payloads and **`focusedProjectUri`** configuration. All URIs **must** be `file://` URIs normalized per LSP URI rules.

## focusedProjectUri

| Rule ID | Rule |
| --- | --- |
| F-01 | On language client start, extension **must** send `initializationOptions.focusedProjectUri` when a project is focused. |
| F-02 | LSP **must** accept deprecated `initializationOptions.selectedProjectUri` as an alias when `focusedProjectUri` is absent. |
| F-03 | On focus change without client restart, extension **must** notify via `workspace/didChangeConfiguration` with settings object `{ "beskid": { "focusedProjectUri": "<uri>" } }` **or** the `beskid.project` configuration section equivalent documented in extension settings. |
| F-04 | When `focusedProjectUri` is set, LSP **should** prefer that manifest for workspace scan ordering and `cached_compilation_context` selection; when unset, behavior **must** match pre-explorer semantics (all roots). |
| F-05 | Extension **must not** restart the language client solely because `focusedProjectUri` changed. |

## Command transport

All commands below use LSP method **`workspace/executeCommand`** with:

- `command`: string identifier
- `arguments`: JSON array; first element **must** be the args object when args are required

Errors **must** use LSP error codes; clients **must** surface `message` in a notification.

## `beskid.refreshWorkspace`

| Field | Value |
| --- | --- |
| **Purpose** | Trigger workspace rescan and diagnostic refresh (existing contract). |
| **Arguments** | `[]` (empty) |
| **Result** | `null` |

Extension **must** invoke after manifest/lock watcher debounce and from command `beskid.refreshWorkspace`.

## `beskid.listWorkspaces`

Discover every **`Workspace.proj`** under current LSP workspace roots (respecting scan skip dirs).

**Arguments** (optional object):

```json
{
  "roots": ["file:///path/to/folder"]
}
```

When `roots` is omitted, LSP **must** use initialized workspace folders.

**Result:**

```json
{
  "workspaces": [
    {
      "uri": "file:///…/Workspace.proj",
      "name": "corelib",
      "members": [
        {
          "id": "collections",
          "uri": "file:///…/packages/collections/Project.proj",
          "name": "collections"
        }
      ]
    }
  ]
}
```

| Field | Required | Type | Meaning |
| --- | --- | --- | --- |
| `workspaces` | yes | array | One entry per discovered workspace manifest |
| `workspaces[].uri` | yes | string | `Workspace.proj` file URI |
| `workspaces[].name` | yes | string | Workspace name from manifest |
| `workspaces[].members` | yes | array | Parsed workspace members |
| `members[].id` | yes | string | Member id from `Workspace.proj` |
| `members[].uri` | yes | string | Member `Project.proj` URI |
| `members[].name` | no | string | Display name; defaults to `id` when omitted |

## `beskid.getWorkspaceSummary`

**Arguments:**

```json
{
  "workspaceUri": "file:///…/Workspace.proj"
}
```

**Result:**

```json
{
  "workspaceUri": "file:///…/Workspace.proj",
  "name": "corelib",
  "members": [
    {
      "id": "collections",
      "uri": "file:///…/Project.proj",
      "name": "collections",
      "projectName": "collections"
    }
  ],
  "registries": [
    {
      "alias": "default",
      "url": "https://registry.example/"
    }
  ]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `registries` | yes | Effective registry URLs from workspace resolution rules (see compiler workspace contracts); used by package panel for default registry base |
| `members[].projectName` | no | Parsed `project.name` when available |

## `beskid.getGraph` (tree navigation)

The Projects tree **must** call `beskid.getGraph` with `kind=projectDeps` and read `metadata.nodes` for Targets and Dependencies sections. See [Graph visualization contracts](/platform-spec/tooling/graph-visualization/contracts-and-edge-cases) for the full payload.

| `metadata.nodes[].kind` | Tree section |
| --- | --- |
| `root` | Targets |
| `path`, `git`, `registry` | Dependencies |
| *(warnings with code `unresolved`)* | Dependencies (unresolved) |

## `beskid.getProjectDependencies`

Merged view of manifest declarations and lock lines for one project.

**Arguments:**

```json
{
  "projectUri": "file:///…/Project.proj"
}
```

**Result:**

```json
{
  "projectUri": "file:///…/Project.proj",
  "declared": [
    {
      "name": "corelib",
      "version": null,
      "source": "registry",
      "registry": "default",
      "descriptor": "corelib"
    }
  ],
  "locked": [
    {
      "name": "corelib",
      "resolvedVersion": "1.2.0",
      "registry": "default",
      "checksum": "sha256:…",
      "materializedRoot": "file:///…/.beskid/packages/corelib/1.2.0"
    }
  ],
  "unresolved": []
}
```

| Array | Meaning |
| --- | --- |
| `declared` | Entries from `Project.proj` dependency tables |
| `locked` | Entries from `Project.lock` when present; empty when lock missing |
| `unresolved` | Declared deps that could not be resolved or locked |

`locked[].resolvedVersion` **must** match lockfile semantics in [workspace and lock contracts](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/).

## Explorer-specific rules

| ID | Rule |
| --- | --- |
| E-W01 | `beskid.listWorkspaces` **must** complete in O(roots × files) with scan skip dirs; **must not** build full compile graphs. |
| E-W02 | `beskid.getGraph` (`projectDeps`) **must** route through `beskid_queries::graph_mermaid`; cycles **must** surface as warnings without infinite tree expansion. |
| E-W03 | When `projectUri` is outside workspace roots, LSP **must** return error `InvalidParams` with a clear message. |
| E-W04 | Extension command `beskid.focusProject` **must** set `focusedProjectUri`; `beskid.clearFocus` **must** clear it and notify LSP. |

## Related topics

- [Extension surface contracts](../extension-surface/contracts-and-edge-cases/) — view IDs and cross-feature settings
- [Snapshot and refresh](/platform-spec/tooling/lsp/snapshot-and-refresh-contract/) — interaction with `beskid.refreshWorkspace`
``````

</details>

### Source Record: Decisions record (legacy index)

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/workspace-project-explorer/articles/decisions-record/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/workspace-project-explorer/articles/decisions-record/content.md`  
**SHA-256:** `23f323c6ba045f5408f8eea1f25dc0834d1f38db824a6244f20b77e0fc732881`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Legacy URL. Normative text is in **`adr/`** and the hub **ADRs** tab.

| adrId | Title |
| --- | --- |
| D-TOOL-VSC-0001 | [LSP-backed graph](./adr/0001-lsp-backed-graph/) |
| D-TOOL-VSC-0002 | [Focus without LSP restart](./adr/0002-focus-without-lsp-restart/) |
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/workspace-project-explorer/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/workspace-project-explorer/articles/design-model/content.md`  
**SHA-256:** `db3d4a5abebeb1dafc0c166fb517690c2aa4383818966ca9924b3929ef6ec72a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

This article defines the **data and UI model** for **Workspaces** (`beskidWorkspaceView`) and **Project** (`beskidProjectView`) tree views, **`FocusedProjectState`**, and how they connect to LSP payloads.

## Focused project state

| Field | Type | Meaning |
| --- | --- | --- |
| `focusedProjectUri` | `string` (file URI) | Canonical `Project.proj` URI driving outline, packages “This project”, and LSP ordering |
| `workspaceUri` | `string` \| null | Parent `Workspace.proj` URI when the focused project is a workspace member |
| `memberId` | `string` \| null | Workspace member id from `Workspace.proj` when applicable |

The extension **must** persist `focusedProjectUri` in `ExtensionContext.workspaceState` under key `beskid.focusedProjectUri` and **must** push the same value to the LSP on change (see [contracts](./contracts-and-edge-cases/#focused-project-uri)).

## Workspaces tree shape

```arch
flowchart TB
  subgraph workspacesView [beskidWorkspaceView]
    W1[Workspace root]
    W1 --> M1[Member: Project.proj]
    W1 --> M2[Member: ...]
    W1 --> WP[workspace.package.json hint]
  end
```

| Node kind | Children source | Default action on click |
| --- | --- | --- |
| **Workspace root** | `beskid.listWorkspaces` → one entry per `Workspace.proj` | Expand/collapse |
| **Member** | `members[]` on workspace entry | Set focus to member `uri`; refresh project/outline/packages views |
| **Registry hint** | Static label when `workspace.package.json` exists beside `Workspace.proj` | Open file in editor |

Icons: workspace root **`root-folder`**; member **`folder-library`**; registry hint **`package`**.

## Project tree shape

Root **must** be the focused `Project.proj` node. Children **must** be built from `beskid.getGraph` (`kind=projectDeps`) `metadata.nodes` and **must** include:

| Child section | Source | Notes |
| --- | --- | --- |
| **Targets** | `metadata.nodes[]` where `kind === "root"` | One node for the root project |
| **Dependencies** | `metadata.nodes[]` where `kind` is `path`, `git`, or `registry` | Opens manifest URI when present; warning icon when `unresolved` |
| **Source folders** | Workspace file discovery under project root | Opens folder on click |
| **Unresolved** | `warnings[]` with code `unresolved` plus nodes with `unresolved: true` | Warning icon; label from warning message or node label |

## Multi-root labeling

When `vscode.workspace.workspaceFolders.length > 1`, any label that could collide across folders **must** use the format:

`{workspaceFolderName} / {localLabel}`

where `workspaceFolderName` is the VS Code folder name, not the on-disk path.

## Auto-select from editor

When setting `beskid.project.autoSelectFromEditor` is true (default **true**), the extension **must** on `onDidChangeActiveTextEditor`:

1. Map the editor file path to a containing directory.
2. Walk upward to find `Project.proj` (same discovery rules as CLI/LSP `discover_project_file`).
3. If the project is a workspace member, set `workspaceUri` and `memberId` from `beskid.getWorkspaceSummary` when needed.
4. Update `focusedProjectUri` without user confirmation unless the new project differs from focus and `beskid.project.confirmAutoFocus` is true (optional setting; default **false**).

## File watchers

The extension **must** register watchers (debounced, ≥300ms) for:

- `**/*.{bd,proj}`
- `**/Project.lock`
- `**/workspace.package.json`

On fire: debounced `beskid.refreshWorkspace`, then refresh both tree providers.

## Canonical references

- Parent hub: [Workspace and project explorer](../)
- LSP JSON contracts: [Contracts and edge cases](./contracts-and-edge-cases/)
- Manifest semantics: [Workspace and lock contracts](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/)
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/workspace-project-explorer/articles/examples/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/workspace-project-explorer/articles/examples/content.md`  
**SHA-256:** `ee376b21a6c1663d7885bdd16ec36e40ea7b7a3290249328dfc4136d281ae7de`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Representative explorer behavior for the **corelib** workspace and a **single-app** folder opened without a workspace manifest.

## Corelib workspace

**Setup:** Open folder `compiler/corelib/` containing `Workspace.proj` named `corelib` with multiple members under `packages/`.

**Expected Workspaces view:**

- One workspace root labeled `corelib` (or `corelib / corelib` when multi-root).
- Member children for each `Workspace.proj` entry (for example `collections`, `query`, `system`).
- Optional node `workspace.package.json` when present at workspace root.

**User action:** Click member `collections`.

**Expected:**

- `focusedProjectUri` → `file://…/packages/collections/Project.proj`
- Project view root shows `collections` targets and dependencies from `beskid.getGraph` metadata
- `beskid.getProjectDependencies` returns locked versions after `beskid lock` has been run in that workspace

**Smoke checklist:**

1. All members listed match `Workspace.proj` without manual refresh.
2. Editing `Project.lock` triggers debounced refresh; locked versions update in Project tree tooltips.
3. `beskid.refreshWorkspace` from palette completes without LSP restart.

## Single-application project

**Setup:** Open folder containing only `Project.proj` (no parent `Workspace.proj`), e.g. a console app template output.

**Expected Workspaces view:**

- Empty state: “No Beskid workspaces found” (or equivalent localized string).
- User **may** still focus via Project picker or auto-select.

**Expected Project view:**

- Root = the lone `Project.proj`
- Dependencies from `getGraph` metadata; unresolved registry deps show warning icon until `beskid fetch`

**Auto-select:** Opening `Src/Main.bd` sets focus to the containing `Project.proj` when `beskid.project.autoSelectFromEditor` is true.

## Multi-root VS Code workspace

**Setup:** VS Code workspace with folders `corelib/` and `my-app/` side by side.

**Expected labeling:**

- `corelib / collections` vs `my-app / my-app` member labels to disambiguate.

**Focus:** Switching editors between folders updates focus per auto-select rules without mixing dependency graphs.

## Related topics

- [Extension surface examples](../extension-surface/examples/)
- [Workspace and lock contracts](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/)
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/workspace-project-explorer/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/workspace-project-explorer/articles/flow-and-algorithm/content.md`  
**SHA-256:** `6b07701690d98914fd48137a23b02e885521e2c4691386c2905797c324896235`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

End-to-end sequences from extension activation through tree population and focus synchronization.

## Activation and LSP start

```arch
sequenceDiagram
  participant VS as VS Code
  participant Ext as Extension
  participant LSP as beskid_lsp
  VS->>Ext: activate
  Ext->>Ext: read workspaceState.focusedProjectUri
  Ext->>LSP: start LanguageClient (initializationOptions.focusedProjectUri)
  LSP-->>Ext: initialized
  Ext->>LSP: executeCommand beskid.listWorkspaces
  LSP-->>Ext: workspaces[]
  Ext->>Ext: populate WorkspaceTreeProvider
  alt focusedProjectUri set
    Ext->>LSP: executeCommand beskid.getGraph (projectDeps)
    LSP-->>Ext: GraphPayload metadata.nodes
    Ext->>Ext: populate ProjectTreeProvider
  end
```

1. Extension **must** start the language client before populating trees (commands are server-backed).
2. If no focus is stored, extension **may** defer Project view population until auto-select or user picks a member.

## Member selection flow

1. User activates a **member** node in `beskidWorkspaceView`.
2. Extension sets `focusedProjectUri = member.uri`.
3. Extension persists workspace state and sends configuration notification to LSP (no restart).
4. Extension refreshes project tree sections, outline, and package panel (parallel `getGraph` + `getProjectDependencies`).
5. Status bar **may** show project name briefly (non-blocking).

## Auto-select from editor

1. `onDidChangeActiveTextEditor` fires with document URI.
2. If `beskid.project.autoSelectFromEditor` is false, stop.
3. Resolve `Project.proj` for editor path; if none, stop.
4. If resolved URI equals current focus, stop.
5. Set focus and run member selection steps 3–4.

## Debounced workspace refresh

1. File watcher fires (manifest, lock, `.bd`, or `workspace.package.json`).
2. Extension debounces (≥300ms coalescing).
3. `executeCommand('beskid.refreshWorkspace')`.
4. Re-fetch `beskid.listWorkspaces`; if focus still valid, re-fetch graph and dependencies.
5. Fire `onDidChangeTreeData` on both providers.

## Reveal in tree

| Command | Behavior |
| --- | --- |
| `beskid.revealInWorkspaceTree` | Expand workspace containing focus; reveal member or workspace root |
| `beskid.revealInProjectTree` | Reveal focused `Project.proj` root and scroll to dependency/target node when `arg` node id provided |

Both **must** be available from editor title/context when a Beskid file is active.

## Verification notes

- Flow tests **should** mock LSP executeCommand and assert ordering: `listWorkspaces` before `getGraph` on cold start.
- Changing `focusedProjectUri` **must not** appear in logs as a full language-client restart.

## Related topics

- [Design model](./design-model/)
- [Examples](./examples/)
``````

</details>
