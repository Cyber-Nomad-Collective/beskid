<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Package manager panel Specification

## Purpose

VS Code Packages view — local project dependencies and registry search via pckg HTTP and CLI mutations.

## Requirements

### Requirement: pckgClient boundary: Decision [D-TOOL-VSC-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> HTTP via pckgClient.ts only.

**Stable ID:** `BSP-REQ-2FDD261EF9D4`  
**Legacy source:** `site/spec-content/platform-spec/tooling/vscode-extension/package-manager-panel/adr/0001-single-pckg-client-boundary/content.md`  
**Source SHA-256:** `1ac2c6e51a22e15258f76f49814ae689d9580b8d4d0ae9301f191878a129f6fa`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: CLI for lock: Decision [D-TOOL-VSC-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Use beskid fetch/lock via CLI.

**Stable ID:** `BSP-REQ-A626F4317E12`  
**Legacy source:** `site/spec-content/platform-spec/tooling/vscode-extension/package-manager-panel/adr/0002-cli-for-lock-mutations/content.md`  
**Source SHA-256:** `c8eea5ca7263d7073414caf1faba17a395b08f16485e9b2c2383ac3d59bd0172`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Package manager panel

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/package-manager-panel/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/package-manager-panel/content.md`  
**SHA-256:** `6b41bd529b527e1f2ff2a61db879a28d90c5fee8fce527cd8524d7d0fa8678c6`

<details>
<summary>Migrated source text</summary>

``````markdown
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

### Source Record: pckgClient boundary

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/package-manager-panel/adr/0001-single-pckg-client-boundary/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/package-manager-panel/adr/0001-single-pckg-client-boundary/content.md`  
**SHA-256:** `1ac2c6e51a22e15258f76f49814ae689d9580b8d4d0ae9301f191878a129f6fa`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

HTTP scatter.

## Decision

HTTP via pckgClient.ts only.

## Consequences

Shared auth.

## Verification anchors

Grep fetch in packages/.
``````

</details>

### Source Record: CLI for lock

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/package-manager-panel/adr/0002-cli-for-lock-mutations/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/package-manager-panel/adr/0002-cli-for-lock-mutations/content.md`  
**SHA-256:** `c8eea5ca7263d7073414caf1faba17a395b08f16485e9b2c2383ac3d59bd0172`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Lock integrity.

## Decision

Use beskid fetch/lock via CLI.

## Consequences

Shared resolver.

## Verification anchors

Panel CLI invocations.
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/package-manager-panel/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/package-manager-panel/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `2bae5c3fe1fa6844c506f9ccb55e2b533eabe54287c82b8ced36aaaa07acdd34`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Testable rules for **`pckgClient`**, registry auth, CLI mutations, and Packages view commands.

## Settings

| Setting | Type | Default | Rule |
| --- | --- | --- | --- |
| `beskid.pckg.baseUrl` | string | `https://pckg.beskid-lang.org` | **Must** be absolute HTTP(S) URL without trailing slash normalization issues |
| `beskid.pckg.apiKey` | string (secret) | empty | Stored via `SecretStorage`; **must not** sync to global settings |

## Authentication

| ID | Rule |
| --- | --- |
| A-01 | When `beskid.pckg.apiKey` is set, `createPckgFetch` **must** send `Authorization: Bearer <token>` on every registry request. |
| A-02 | Auth scheme **must** match pckg `ApiKeyAuthentication` (Bearer). |
| A-03 | On HTTP 401/403 **for a request that requires auth** (private package or publisher action), UI **must** show actionable error (“Configure API key…”). Public search/details **must not** prompt for a key when anonymous access succeeds. |
| A-04 | Missing API key **must not** block public catalog browse; connection label **should** read “Public catalog · {url}” when anonymous probe succeeds. |
| A-05 | Command `beskid.packages.configureApiKey` **must** prompt for a key and persist it via `SecretStorage` (`beskid.pckg.apiKey` secret id). |
| A-06 | Registry connection state **must** be read from LSP `beskid.pckg.getConnectionStatus` first; the client passes `authConfigured` (boolean only). API keys **must not** be stored or logged by the language server. |
| A-07 | After storing an API key, `beskid.packages.configureApiKey` **must** call LSP `beskid.pckg.validateConnection` with the key in command args (one-shot); secrets remain in VS Code `SecretStorage`. |

## LSP registry commands

| Command | Arguments (JSON object) | Response |
| --- | --- | --- |
| `beskid.pckg.getConnectionStatus` | `{ workspaceUri?: string, authConfigured: boolean }` | `{ baseUrl, registryName?, workspaceDefaultRegistryUrl?, workspaceDefaultRegistryName?, authConfigured, validation: { status, message? }, connected }` |
| `beskid.pckg.setRegistry` | `{ baseUrl: string, registryName?: string }` | none |
| `beskid.pckg.validateConnection` | `{ baseUrl?: string, workspaceUri?: string, apiKey?: string }` | `{ ok, error?, validation: { status, message? } }` — `apiKey` is never echoed or logged |

`status` is `unknown`, `ok`, or `error`. `connected` is `true` when validation is `ok` and auth requirements are satisfied (`authConfigured` when the registry returns 401/403 without a key).

## searchPackages

| ID | Rule |
| --- | --- |
| S-01 | **Must** call `GET /api/search` with `limit` (default 20, max 50); `q` optional (empty loads browse catalog). |
| S-02 | **Must** return typed `PackageSearchResponse[]` (array of hits). |
| S-03 | **Must** cache responses ~30 seconds per `(registryBaseUrl, q, limit)`. |
| S-04 | **Must** debounce user input ≥300ms before network. |

## listPackages

| ID | Rule |
| --- | --- |
| B-01 | **Must** call `GET /api/packages` (or search with empty `q`) for initial document panel load. |
| B-02 | **Must** work without API key for public packages. |
| B-03 | **Must** cache ~30 seconds per `(registryBaseUrl, limit)`. |

## getPackageDetails

| ID | Rule |
| --- | --- |
| D-01 | **Must** call `GET /api/packages/{name}` where `{name}` is URL-encoded package id. |
| D-02 | **Must** map `versions[]`, `dependencies[]`, `readme`, `health`, `latestVersion` from response. |
| D-03 | Yanked versions (`isYanked: true`) **must** render with warning in tree. |

## Local project section

| ID | Rule |
| --- | --- |
| L-01 | **ThisProject** children **must** come only from `beskid.getProjectDependencies` for `focusedProjectUri`. |
| L-02 | Each row **must** show `name`, effective version (`locked.resolvedVersion` or declared descriptor), `source`, `registry`. |
| L-03 | Tooltip **should** include `materializedRoot` when present in locked entries. |
| L-04 | Context menu: Open manifest, Open materialized folder, Copy `name@version`. |

## Mutation commands

| Command | Rule |
| --- | --- |
| `beskid.packages.fetch` | **Must** run `beskid fetch` with `cwd` = focused project directory via shared CLI runner |
| `beskid.packages.lock` | **Must** run `beskid lock` likewise |
| `beskid.packages.addDependency` | **Must** prompt for name and version; apply via CLI subcommand when available, else structured `Project.proj` dependency entry + `refreshWorkspace` |
| `beskid.packages.refresh` | **Must** clear `pckgClient` caches and refresh tree |
| `beskid.packages.configureApiKey` | **Must** prompt, store registry API key in `SecretStorage`, validate via `beskid.pckg.validateConnection`, then refresh; subsequent search/details **must** use Bearer auth |
| `beskid.packages.open` | **Must** open/focus registry document WebviewPanel |
| `beskid.packages.openRegistryUri` | **Must** open browser URL from `buildRegistryPackageUrl` |
| `beskid.packages.openManifest` | **Must** open focused `Project.proj` for a local dependency row |
| `beskid.packages.openMaterializedFolder` | **Must** reveal materialized package path when `materializedPath` is present |
| `beskid.packages.copyDependencyLabel` | **Must** copy `name@version` label for local dependency rows |

## Edge cases

| Scenario | Expected behavior |
| --- | --- |
| Offline / DNS failure | Registry section error node; retry action |
| Empty search query | Document panel shows browse catalog from `listPackages` |
| No `Project.lock` | **ThisProject** shows declared only; badge “not locked” on rows |
| Focus cleared | **ThisProject** shows select-project message |
| Concurrent fetch + search | Status bar shows dominant phase; both complete independently |

## Related topics

- [Workspace explorer contracts](../workspace-project-explorer/contracts-and-edge-cases/#beskidgetprojectdependencies)
- Server contracts: `pckg/src/Server/Features/Packages/Contracts.cs`
``````

</details>

### Source Record: Decisions record (legacy index)

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/package-manager-panel/articles/decisions-record/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/package-manager-panel/articles/decisions-record/content.md`  
**SHA-256:** `bcd215a130320172d9328dbd3257cfeaa4a5d2503df7de676619b53457039477`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

Legacy URL. See **`adr/`** and the hub **ADRs** tab for normative text.

| adrId | Title |
| --- | --- |
| D-TOOL-VSC-0001 | [pckgClient boundary](./adr/0001-single-pckg-client-boundary/) |
| D-TOOL-VSC-0002 | [CLI for fetch and lock](./adr/0002-cli-for-lock-mutations/) |
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/package-manager-panel/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/package-manager-panel/articles/design-model/content.md`  
**SHA-256:** `ded5850b63dec9404a5ec0d3c646983a8be5f7962885a5da2651f45cbfc8ad61`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

**`pckgClient`** TypeScript contract, sidebar **This project** deps, and **registry document panel** (WebviewPanel) for browse/search/details. Status-bar activity phases shared with LSP and CLI.

## View layout

Sidebar **`beskidPackagesView`** shows **This project** only (declared + locked deps from LSP).

Registry browse uses **`PackageRegistryPanel`** (editor-area WebviewPanel, command `beskid.packages.open`):

```arch
flowchart LR
  subgraph sidebar [beskidPackagesView]
    TP[ThisProject]
    TP --> D1[Declared/Locked rows]
  end
  subgraph docPanel [PackageRegistryPanel]
    LIST[Package list]
    DET[Detail pane]
    LIST --> DET
  end
  docPanel --> BROWSER[Open in browser]
```

On open, the document panel **must** load the public catalog via `GET /api/packages` or `GET /api/search?limit=…` without requiring an API key.

## packageKind UI routing

Branch detail actions on `package.packageKind` (see [package kinds](/platform-spec/tooling/registry-client/package-kinds/)):

| Kind | Show | Primary actions |
| --- | --- | --- |
| `library` | readme, versions, deps | Add dependency, fetch, lock |
| `template` | shortName, tags.type, readme | `beskid new install`, `beskid new <shortName>` |
| `tool` | install card, readme | download snippet |

## PackageTreeItem kinds (sidebar)

| `section` | `kind` | Children |
| --- | --- | --- |
| `ThisProject` | `section` | Dependency rows from LSP |
| `ThisProject` | `dependency` | Optional context actions only |

Icons: dependency **`package`**; unresolved **`warning`**.

## pckgClient functions (normative)

| Function | HTTP | Cache key |
| --- | --- | --- |
| `listPackages({ limit, registryBaseUrl })` | `GET {base}/api/packages` or search with empty `q` | `list:{base}:{limit}` ~30s TTL |
| `searchPackages({ q, limit, registryBaseUrl })` | `GET {base}/api/search?q=…&limit=…` | `search:{base}:{q}:{limit}` ~30s TTL |
| `getPackageDetails({ name, registryBaseUrl })` | `GET {base}/api/packages/{name}` | `details:{base}:{name}` |
| `buildRegistryPackageUrl({ name, registryBaseUrl })` | — | Opens `{base}/packages/{name}` in browser |
| `createPckgFetch(context)` | — | Optional Bearer from settings or SecretStorage |

All functions **must** use `createPckgFetch` for transport. Public catalog endpoints **must** work with an empty API key.

## Response typing (camelCase)

Align TypeScript types with pckg records:

- **`PackageSummary`**: includes `packageKind` (`library` | `template` | `tool`), optional template fields (`shortName`, `tags`)
- **`PackageDetailsResponse`**: `{ package, versions, dependencies, dependentsCount, readme, health, … }`
- **`PackageDependencyResponse`**: `{ name, version, source, registry }`

## Registry base URL resolution

1. If focused project belongs to a workspace, use `registries` entry with `alias: "default"` from `beskid.getWorkspaceSummary`.
2. Else `vscode.workspace.getConfiguration('beskid.pckg').get('baseUrl')`.
3. Else `https://pckg.beskid-lang.org`.

## Status-bar phases

Extend shared `PckgActivityPhase` (and CLI phases) with:

| Phase | When |
| --- | --- |
| `search` | Registry search in flight |
| `details` | Package details fetch |
| `fetch` | `beskid fetch` running |
| `lock` | `beskid lock` running |

LSP scan phases remain separate on the same status controller.

## View title and welcome actions

| Action | Command |
| --- | --- |
| Open registry | `beskid.packages.open` |
| Search | `beskid.packages.search` |
| Refresh | `beskid.packages.refresh` |
| Fetch | `beskid.packages.fetch` |
| Lock | `beskid.packages.lock` |

Sidebar welcome **should** offer “Browse registry…” linking to `beskid.packages.open`.

## Related topics

- [Contracts](./contracts-and-edge-cases/) — auth and endpoint tables
- [pckg client contract](/platform-spec/tooling/registry-client/pckg-client-contract/)
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/package-manager-panel/articles/examples/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/package-manager-panel/articles/examples/content.md`  
**SHA-256:** `1f3938567c3a5184a404e8cb04afda5a470a76c4b430395c831b67fb0ad0ac2a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Worked examples for local and registry sections of the package panel.

## Corelib — This project

**Precondition:** `compiler/corelib` open; member `collections` focused; `Project.lock` present.

**Steps:**

1. Open **Packages** view.
2. Expand **This project**.

**Expected rows:** Dependencies such as `corelib` with `resolvedVersion` from lock, `registry: default`, tooltip showing materialized path under `.beskid/packages/`.

**Fetch/Lock:** View title **Lock** runs `beskid lock` at `packages/collections/`; status bar shows `lock` phase; on success, locked versions refresh without restarting LSP.

## Registry search — `corelib`

**Precondition:** Registry reachable at resolved base URL (workspace default or localhost).

**Steps:**

1. View title **Search** → query `corelib`.
2. Expand hit `corelib`.

**Expected:** Versions list from `PackageDetailsResponse.versions`; latest non-yanked version highlighted; dependencies under expanded version match `PackageDependencyResponse` shapes.

**Actions:**

- **Open in browser** uses `buildRegistryPackageUrl`.
- **Add dependency** prompts version; after apply, user runs **Fetch** from view title.

## Private registry with API key

**Precondition:** Registry requires authentication; package `my.internal.lib` not visible anonymously.

**Steps:**

1. Command palette → configure **Beskid: Set Package Registry API Key** (stores secret).
2. Search `my.internal.lib`.

**Expected:** Authenticated search returns hits; without key, 401 error node with configuration hint.

## Related topics

- [Workspace explorer examples](../workspace-project-explorer/examples/)
- [FAQ](../extension-surface/faq-and-troubleshooting/)
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/vscode-extension/package-manager-panel/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/tooling/vscode-extension/package-manager-panel/articles/flow-and-algorithm/content.md`  
**SHA-256:** `e69db618b996b79242ed61df33601afe75d43ce1b95f6f66bf6806c731629bbc`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose and scope

Operational sequences for registry browse and project mutation from the Packages view.

## Panel refresh on focus change

1. Read `focusedProjectUri` from workspace state.
2. If set, `executeCommand('beskid.getProjectDependencies', { projectUri })`.
3. Replace **ThisProject** children; preserve **RegistrySearch** expansion state.
4. Re-resolve registry base URL from workspace summary when workspace membership changes.

## Registry search flow

1. User invokes `beskid.packages.search` or view-title Search.
2. Show `InputBox` for query `q`.
3. Debounce 300ms; set status phase `search`.
4. `searchPackages({ q, registryBaseUrl })` via cache.
5. Populate **RegistrySearch** with `searchResult` nodes (package name + health summary).
6. Clear status phase on completion or error.

## Details expansion

1. User expands a `searchResult` node.
2. If details not cached, set phase `details`, call `getPackageDetails({ name })`.
3. Attach `version` child nodes sorted by semver descending.
4. Expanding a version loads `registryDependency` leaves from `dependencies[]` in details response (no extra HTTP unless stale).

## Fetch and lock

1. User chooses Fetch or Lock from view title (requires focus).
2. CLI runner spawns `beskid` with `cwd` = directory containing focused `Project.proj`.
3. Stream output to **Beskid LSP** output channel; status phase `fetch` or `lock`.
4. On exit code 0: `beskid.packages.refresh` + `beskid.refreshWorkspace` + tree providers update.
5. On non-zero: error notification with last stderr lines.

## Add dependency

1. Prompt package name and version (quick pick optional for known search result).
2. If CLI exposes `beskid add` (or equivalent), invoke via runner.
3. Else insert dependency stanza into `Project.proj` at canonical location; save; trigger LSP refresh.
4. User **should** run Lock after add when lockfile policy requires it.

## Related topics

- [Extension surface flow](../extension-surface/flow-and-algorithm/)
- [Examples](./examples/)
``````

</details>
