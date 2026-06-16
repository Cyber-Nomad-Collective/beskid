---
title: Package manager panel
description: VS Code Packages view — local project dependencies and registry
  search via pckg HTTP and CLI mutations.
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
Packages activity-bar view: local dependency listing and registry browse/search with cached pckg HTTP and CLI fetch/lock.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `beskid_vscode/src/packages/pckgClient.ts`, `PackageManagerProvider.ts`
- `beskid_vscode/src/cli/beskidCliRunner.ts`
- `pckg/src/Server/Features/Packages/Contracts.cs`
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
The **package manager panel** (`beskidPackagesView`) provides two persistent sections: **This project** (declared + `Project.lock` entries from LSP) and **Registry search** (debounced `pckg` HTTP with TTL cache). Lock/fetch mutations run through the **Beskid CLI** (`beskid fetch`, `beskid lock`) with progress on the shared status bar.
</SpecSection>

<SpecSection title="Inputs and outputs" id="inputs-and-outputs">
| API | Endpoint / command |
| --- | --- |
| Search | `GET /api/search?q=&limit=` |
| Details | `GET /api/packages/{name}` |
| Local deps | `beskid.getProjectDependencies` |
| Fetch / lock | `beskid fetch`, `beskid lock` (CLI, `--project` cwd = focused project root) |

Registry base URL resolution order: workspace `default` registry from `beskid.getWorkspaceSummary` → `beskid.pckg.baseUrl` → `https://pckg.beskid-lang.org`.
</SpecSection>

<SpecSection title="Decisions" id="decisions">
No open decisions. **`D-TOOL-VSC-0001`** (pckgClient boundary), **`0002`** (CLI for fetch/lock)—see **`adr/`** and the **ADRs** tab.
</SpecSection>
