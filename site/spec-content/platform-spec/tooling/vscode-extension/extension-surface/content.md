---
title: Extension surface
description: VS Code extension views, focus model, LSP initialization,
  status-bar phases, and cross-feature command wiring.
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
