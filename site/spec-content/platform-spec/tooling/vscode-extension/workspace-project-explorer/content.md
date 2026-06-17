---
title: Workspace and project explorer
description: VS Code tree views for Workspace.proj discovery, member navigation,
  and focused Project.proj context.
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
