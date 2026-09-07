# Service: beskid_nexus / gitnexus-web

> Original research for migrating `beskid_nexus/gitnexus-web` into the
> `beskid_sites/` workspace. The research below informed the migration;
> the **shell-adapted Vite SPA** migration is **DONE** (Phase 1 of the
> research), but the **full TanStack Start conversion + full Authelia
> auth** (Phase 2+) is **PENDING** — see Current Status and master Plan
> Phase 8.

## Current Status

**Migration: PARTIAL — shell-adapted Vite SPA live; full TanStack Start
conversion pending.** `apps/nexus/` is deployed at `nexus.beskid-lang.org`
behind the Coolify proxy with Caddy labels, but it is the Vite SPA shell
adapted to consume `@cyber-nomad-collective/beskid-ui-react` and the shared
shell components — **not** a full TanStack Start app with Nitro server
routes and the shell-template Authelia OIDC flow.

- **Deployed:** yes — `nexus.beskid-lang.org` (production), via Coolify
  proxy + Caddy labels. Image built from `beskid_sites/apps/nexus/`.
- **What's working:**
  - Full copy from `beskid_nexus/gitnexus-web`. The React/Sigma/graphology/
    mermaid explorer surface, `services/backend-client.ts`,
    `services/nexus-api.ts`, `hooks/*`, `lib/*`, `core/*` are intact.
  - Shell components adapted to the shared shell (`nexus-app-shell.tsx`
    reuses BeskidHub, theme toggle, the shell's topbar nav-slot pattern).
  - Imports re-homed: `@beskid/ui-react` →
    `@cyber-nomad-collective/beskid-ui-react`; `@beskid/beskid-ui` (hub
    CSS, BeskidHub) dropped; `@cyber-nomad-collective/trudoc` dropped
    (unused). `gitnexus-shared` vendored into
    `beskid_sites/packages/gitnexus-shared`.
  - `gitnexus` CLI/Express/MCP server unchanged (out of scope for the web
    migration); the SPA is still served from the same origin as `/api`.
- **Pending (master Plan Phase 8):**
  - **Full TanStack Start conversion.** Introduce a real route tree (`/`,
    `/repo/:id`); replace the `ShellPhase` state machine with server
    loaders + route guards. Guard Sigma/Mermaid/syntax-highlighter imports
    with `clientOnly` for SSR. Re-point Playwright e2e to the Start dev
    server.
  - **Serving model decision (blocking, open).** Separate Nitro server vs.
    static bundle hosted by `gitnexus serve`. This gates the auth + data
    layer phases. If the Start build still produces a static bundle that
    `gitnexus serve` hosts (preserving same-origin), the migration is
    much smaller but the "TanStack Start app" goal is only partially met.
  - **`gitnexus-shared` provenance (open).** Currently vendored into
    `beskid_sites/packages/gitnexus-shared`; confirm this is the
    canonical source going forward, or publish to GitHub Packages as
    `@cyber-nomad-collective/beskid-nexus-shared`.
  - **Full Authelia OIDC auth.** The `OAuthSetupWizard` + `fetchAuthMe` /
    `githubLoginUrl` + `setup` phase are still in place; they must be
    replaced with the template's Authelia OIDC integration. Today the
    service runs with `SHELL_AUTH_MODE=mock`.
  - **Explorer consolidation into the shared lib.** Decide
    `FileTreePanel` consolidation (generalize
    `beskid-ui-react/explorer`'s `FileExplorer` to accept `GraphNode[]`,
    or keep nexus's tree app-local); lift `CodeReferencesPanel`'s
    syntax-highlighted file viewer as a `CodeViewer` into the lib (the
    cross-service shared-explorer-dialog surface per AGENTS.md). Decide
    whether the Sigma whole-repo explorer moves into a new
    `beskid-ui-react/graph-sigma` subpath or stays app-local.
  - Cutover from Coolify to the standalone Caddy compose (master Plan
    Phase 3).
  - CI/CD migration to `cr.beskid-lang.org` + SSH deploy (master Plan
    Phase 6).
- **Human steps needed:** none specific to this service beyond the
  cross-phase steps in the master Plan.

The phased approach and risks documented below remain the planning basis
for the pending full conversion.

---

## Current architecture

`beskid_nexus` is a fork of GitNexus (PolyForm-Noncommercial) repackaged as the Beskid compiler knowledge-graph explorer. It is a 3-package pnpm-style workspace rooted at `beskid_nexus/package.json:1` (name `beskid-nexus`) with three sub-builds:

- **`gitnexus/`** (`package.json:1`, name `gitnexus`, v1.6.5) — the Node CLI/server. A 22+ Node program (`engines.node >=22`) built with `node scripts/build.js`. `gitnexus serve` runs an Express REST API + MCP-over-HTTP endpoint on port 8452, hosts the static web UI, and does runtime indexing with tree-sitter (C/C++/C#/Go/Java/JS/PHP/Python/Ruby/Rust/TS + vendored Dart/Proto/Swift) and `@ladybugdb/core` (DuckDB) + `@huggingface/transformers` embeddings. Auth via `@beskid/auth-client` (`file:../../beskid_web_common/packages/beskid-auth-client`). Outputs to `gitnexus/web/` (the served static bundle) and `gitnexus/dist/`.
- **`gitnexus-shared/`** (`package.json:1`, name `gitnexus-shared`) — TypeScript type contracts shared by CLI and web. Exports `.` and `./test-helpers`, built with `tsc`. Source in `src/` (`index.ts`, `graph/`, `integrations/`, `language-detection.ts`, `languages.ts`, `lbug/`, `mro-strategy.ts`, `pipeline.ts`, `scope-resolution/`, `test-helpers.ts`). Defines `GraphNode`, `GraphRelationship`, `NodeLabel`, `PipelineProgress`, `CircuitOpenError`, `ResilientFetchExhaustedError`, `resilientFetch`.
- **`gitnexus-web/`** (`package.json:1`, name `gitnexus`) — the Vite + React 19 SPA. Built with Vite 8 (`vite build`) into `dist/`, served by the CLI server. Scripts: `dev` (vite), `build`, `test` (vitest), `test:e2e` (Playwright), `test:gate` (`pnpm test:unit && pnpm test:e2e`). Node engine `^20.19.0 || >=22.12.0`. Deployed to Vercel as a fallback (`vercel.json:1` rebuilds `gitnexus-shared` then `gitnexus-web`), but the production path is the GHCR image (`Dockerfile:1`) running `gitnexus serve` on port 8452 with the SPA bundled into `gitnexus/web/`.

The web SPA itself (`gitnexus-web/src/`):

- **Entry**: `main.tsx` → `App.tsx` (352 lines). `App` wraps `AppContent` in `AppStateProvider` (`hooks/useAppState.tsx:1`, 645-line React context store). No router — a `ShellPhase` state machine (`boot` / `setup` / `server-down` / `explorer`, `App.tsx:34`) drives boot, OAuth setup wizard, server-down screen, and the explorer. `viewMode` (`loading` / `exploring`) and `progress` drive the in-app loading overlay.
- **Shell**: `components/nexus-app-shell.tsx:1` (89 lines) — bespoke topbar with `Beskid` kicker, repo selector, symbol search slot, `NexusSettingsHeaderButton` (admin only), `Connect MCP` button, `ThemeToggle`, `BeskidHub`. No sidebar; everything is a single header row + full-height content. This is **not** derived from the tracker shell.
- **Explorer layout**: `components/graph-explorer-layout.tsx:1` (208 lines) composes `FileTreePanel` (left, 591 lines, builds a folder/file tree from graph nodes), `GraphCanvas` (centre, 405 lines), `CodeReferencesPanel` (overlay left, 725 lines, syntax-highlighted code via `react-syntax-highlighter` + `readFile` from backend), `NodeDocumentationPanel` (overlay right, inline in `graph-explorer-layout.tsx:24`, renders `codeDoc` + `specLinks` via `MarkdownRenderer` + `StandardLinks`), `StatusBar` (bottom, 69 lines, node/edge counts + language), and a `serverDisconnected` banner. `SymbolSearch` (`graph-explorer-layout.tsx:64`) is a topbar slot.
- **Graph rendering**: `components/GraphCanvas.tsx:1` + `hooks/useSigma.ts:1` (669 lines) render with **Sigma.js 3 + graphology** (`sigma`, `@sigma/edge-curve`, `graphology`, `graphology-layout-forceatlas2`, `graphology-layout-force*, graphology-layout-noverlap`, `graphology-indices`, `graphology-utils`). Layout is ForceAtlas2 (worker) + noverlap. `lib/graph-adapter.ts:1` (401 lines) converts `KnowledgeGraph` → graphology `SigmaNodeAttributes`/`SigmaEdgeAttributes` with community colouring and depth filtering. `useSigma` manages node highlighting (selected / hovered / AI-citation / AI-tool / blast-radius), animated nodes (pulse/ripple/glow), and exposes `focusNode`/`zoomIn`/`zoomOut`/`resetZoom`/`startLayout`/`stopLayout`.
- **Process flows**: `components/ProcessesPanel.tsx:1` (590 lines) + `ProcessFlowModal.tsx:1` (333 lines) render Mermaid flowcharts (`mermaid` 11 + `lib/mermaid-generator.ts:1`, 178 lines, sanitized with `dompurify`) for detected execution processes; clicking a step focuses nodes in the Sigma graph.
- **Data layer**: `services/backend-client.ts:1` (976 lines) — typed HTTP client for the GitNexus backend: `connectToServer` (streaming graph download via `resilientFetch`), `connectHeartbeat`, `probeBackend`, `fetchRepos`, `runQuery`, `search`, `grep`, `readFile`, `startEmbeddings`, `streamEmbeddingProgress`. All graph/edge/embedding/file ops go through this. `services/nexus-api.ts:1` (160 lines) — same-origin session-cookie calls to `/api/admin/*`, `/api/catalog/*`, `/api/auth/me`, `/api/auth/github-login` (Authelia-style hub pairing, not the beskid-auth-client used by the CLI).
- **Catalog bootstrap**: `hooks/useCatalogBootstrap.ts`, `hooks/useServerBootstrap.ts`, `hooks/useBackend.ts`, `hooks/app-state/graph.tsx`, `lib/catalog-match.ts:1`. The catalog (`PublicCatalogEntry`/`CatalogEntry` in `nexus-api.ts:23-47`) drives the repo selector; OpenSpec catalog reconciliation happens server-side via `NEXUS_OPEN_SPEC_CATALOG` (`COOLIFY.md:29`).
- **Build/deploy**: `Dockerfile:1` (92 lines) — multi-stage: builder installs `pnpm@10.17.1` + `bun@1.3.14`, copies `beskid_web_common` via a named BuildKit context (`--build-context web_common=../beskid_web_common`), runs `pnpm install --frozen-lockfile` in each sub-package, builds `gitnexus-shared` → `gitnexus` → `gitnexus-web`, then runs `pnpm --dir gitnexus build` which bundles the SPA into `gitnexus/web/`. Runtime image copies `gitnexus/dist`, `node_modules`, `vendor`, `web`, mounts `openspec/catalog.json` as a read-only BuildKit context, and runs `gitnexus serve` on 8452. Healthcheck: `wget -q --spider http://127.0.0.1:8452/api/health`. Coolify compose at `docker-compose.coolify.yml`; secrets per `COOLIFY.md:20-31` (`SESSION_SECRET`, `AUTH_HUB_PUBLIC_URL`, `NEXUS_SETUP_TOKEN`, `NEXUS_MCP_AUTH_TOKEN`, `GITHUB_WEBHOOK_SECRET`, `OPENROUTER_API_KEY`).
- **Tests**: Vitest unit (`vitest.config.ts`) + Playwright e2e (`playwright.config.ts`, `e2e/`), gate is `pnpm test:gate`. `TESTING.md` documents the suite.

## Coupling to beskid packages (esp. overlap with beskid-ui-react explorer/graph)

Direct `@beskid/*` + `@cyber-nomad-collective/*` imports (from `gitnexus-web/package.json:24-26` as `file:` links to `../../beskid_web_common/packages/*`):

- `@beskid/beskid-ui` — used **only** for `BeskidHub` (`components/nexus-app-shell.tsx:1` `import { BeskidHub } from "@beskid/beskid-ui/react/BeskidHub"`) and the hub CSS / `#beskid-hub-entry` / `#beskid-theme-css` aliases (`vite.resolve-beskid-ui.ts:30-51`, `src/stubs/beskid-hub-entry-stub.ts:1` is the fallback when the package isn't installed). The material-theme CSS is resolved via `@beskid/material-theme` alias (`vite.config.ts:47`). No other JS surface.
- `@beskid/ui-react` — three consumers:
  - `components/theme-toggle.tsx:1` imports `Button` from `@beskid/ui-react`.
  - `components/nexus-settings-dialog.tsx:1` imports `defineSettingsRegistry`, `SettingsDialog` from `@beskid/ui-react/settings` and `Button`/`Input`/`Textarea` from `#/components/ui/*` (the tracker-style `#/` aliases into the installed `@beskid/ui-react/src`, set up by `vite.resolve-beskid-ui.ts:77-91`).
  - `src/styles.css:3,6` does `@source "../node_modules/@beskid/ui-react/src"` and `@import "@beskid/ui-react/styles/shadcn-entry.css"`.
- `@cyber-nomad-collective/trudoc` — declared in `package.json:26` but **not imported** anywhere in `gitnexus-web/src/` (grep finds zero `trudoc` references). Dead dependency.
- `gitnexus-shared` — `file:../gitnexus-shared`, aliased to source in `vite.config.ts:58-61`. The actual data-contract backbone: `GraphNode`, `GraphRelationship`, `NodeLabel`, `PipelineProgress`, `CircuitOpenError`, `resilientFetch`, `getSyntaxLanguageFromFilename` are consumed across `lib/graph-adapter.ts:1`, `core/graph/types.ts:9`, `hooks/useAppState.tsx:1`, `services/backend-client.ts:9`, `components/CodeReferencesPanel.tsx:1`, `components/graph-explorer-layout.tsx:1`, `components/GraphCanvas.tsx:1`.
- `@beskid/auth-client` — used by the **CLI/server** (`gitnexus/package.json:55`), not by the web SPA.

**Overlap with `@cyber-nomad-collective/beskid-ui-react` `explorer/` and `graph/`** (already in the canonical lib at `beskid_sites/packages/beskid-ui-react/src/`):

- `explorer/` ships `RepoExplorerDialog` + `FileExplorer` (`src/explorer/RepoExplorerDialog.tsx:1`, `FileExplorer.tsx:1`, `index.ts:1`, `types.ts`) — a generic repo-path picker dialog with lazy `listChildren`, `RepoEntry`/`FileEntry` contracts, `openInEditorUrl`. Nexus's `FileTreePanel.tsx:1` (591 lines) is a **bespoke** folder/file tree that builds from `GraphNode[]` (not `RepoEntry[]`) and is tightly coupled to `useAppState` (`graph`, `onFocusNode`, `visibleLabels`, `ALL_EDGE_TYPES`, `EDGE_INFO`, `FILTERABLE_LABELS`, `NODE_COLORS` from `lib/constants.ts:1`). Different data shape, different purpose: the lib explorer browses a repo path tree; the nexus panel browses the *knowledge graph's* file/folder nodes with label filters and graph focus. **They are not interchangeable as-is** — but the lib `FileExplorer` rendering (chevrons, file icons, keyboard nav, active-path highlight) is the pattern nexus should adopt once the data adapter (`GraphNode[]` → `RepoEntry[]`) is added.
- `graph/` ships `AstTreeView`, `FactsDagView`, `LinkedAstFactsView`, `layout-ast` (d3-hierarchy `tree`), `layout-dag` (dagre), `use-ast-facts-link`, fixtures, and the `AstGraphModel`/`FactsDagModel`/`GraphDataSource` adapter seam (`src/graph/types.ts:1`). All built on **`@xyflow/react`** (ReactFlow 12) + `@dagrejs/dagre` + `d3-hierarchy`. Nexus's `GraphCanvas`/`useSigma`/`graph-adapter` is a **completely different stack**: Sigma.js 3 + graphology + ForceAtlas2, rendering the whole-repo knowledge graph (tens of thousands of nodes/edges with community layout, depth filtering, AI highlights, blast radius). The lib `graph/` renders per-file AST trees and facts DAGs (small, structured, tree/DAG-shaped). **These are complementary, not overlapping** — they answer different questions (whole-repo topology vs. per-file AST/facts). The `GraphDataSource` adapter seam (`graph/types.ts:57-60`) is exactly the shape a future "nexus feeds the shared graph view" integration would use, but nexus's Sigma renderer does not consolidate into the ReactFlow-based `graph/` modules.

## What moves cleanly

- **React 19 UI surface**: `App.tsx`, all `components/*.tsx`, `hooks/useAppState.tsx`, `hooks/app-state/graph.tsx`, `lib/*`, `core/graph/*`, `core/ingestion/*` are plain React + hooks + TypeScript. They port to a TanStack Start app with re-homing of imports (`@beskid/ui-react` → `@cyber-nomad-collective/beskid-ui-react`, `@beskid/beskid-ui` → new lib's hub export) and minimal logic change. The Sigma/graphology/mermaid stack is framework-agnostic and works under Nitro/Start without change.
- **Component-library reuse**: `Button` (`theme-toggle`), `defineSettingsRegistry`/`SettingsDialog`/`Input`/`Textarea` (`nexus-settings-dialog`), `BeskidHub` (from `beskid-ui`) are already consumed from `@beskid/ui-react` / `@beskid/beskid-ui`, so the canonical `@cyber-nomad-collective/beskid-ui-react` (copied from the same source, same exports per `beskid_sites/packages/beskid-ui-react/package.json:22-36`) covers them with no API change. The `#/` alias pattern and `@beskid/ui-react/settings` subpath export already exist in the new lib.
- **Data contracts** (`gitnexus-shared`): `GraphNode`/`GraphRelationship`/`NodeLabel`/`PipelineProgress`/`resilientFetch` are pure TypeScript, buildable with `tsc`, and have no web-specific runtime deps. They move into the new app (or a shared `beskid-nexus-shared` package inside `beskid_sites/packages/`) unchanged. `core/graph/types.ts:12` (the in-memory `KnowledgeGraph` container) and `lib/graph-adapter.ts:1` (graphology conversion + community colouring) move verbatim — they only depend on `graphology` + `gitnexus-shared`.
- **Backend HTTP client** (`services/backend-client.ts:1`, `nexus-api.ts:1`): `fetch`-based, environment-agnostic. Moves verbatim; only the Vite proxy (`vite.config.ts:72-80` `/api` → `127.0.0.1:8452`) becomes a Nitro dev-proxy or a same-origin config in the TanStack Start server.
- **Catalog/auth bootstrap** (`hooks/useCatalogBootstrap.ts`, `hooks/useServerBootstrap.ts`, `useBackend.ts`, `lib/catalog-match.ts:1`, `lib/grounding-patterns.ts:1`): self-contained React hooks/utilities, move cleanly.
- **Settings dialog** (`nexus-settings-dialog.tsx:1`): already built on `@beskid/ui-react/settings` registry, which is in the canonical lib. Moves with import re-homing only.
- **Tests**: Vitest unit + Testing Library + Playwright e2e transfer directly to the TanStack Start app (same Vitest/Playwright config shape).
- **Dockerfile runtime contract** (port 8452, `/api/health`, `GITNEXUS_HOME=/data/gitnexus`, `NEXUS_OPEN_SPEC_CATALOG`): the served backend (`gitnexus serve`) is **out of scope** for the web migration — it stays as the Node/Express/MCP server. Only the *web bundle* moves from "built by Vite, served by gitnexus" to "TanStack Start app, served by Nitro, proxying `/api` to the gitnexus backend." The Dockerfile Rust/CLI stages and the GHCR image for the **server** are unchanged; the **web** image (if decoupled) is new, or the SPA bundle is still produced by the Start build and copied into `gitnexus/web/` for the existing server to host.

## What requires migration / consolidation into the shared lib

- **Vite SPA → TanStack Start (React + Nitro)**: introduce a real route tree. Today the app is a state-machine with no routes (`App.tsx:34` `ShellPhase`). The new app needs at minimum `/` (catalog home / explorer), `/repo/:id` (active graph), and the setup/server-down states as routes or route-level loaders. The `useState` phase machine becomes server loaders + route guards. The Vite plugin chain (`@vitejs/plugin-react`, `@tailwindcss/vite`, `vite.resolve-beskid-ui.ts` aliases) is replaced by the TanStack Start Vite plugin + retained Tailwind/alias setup; the bespoke `vite.resolve-beskid-ui.ts:1` resolver collapses once `@cyber-nomad-collective/beskid-ui-react` is a normal workspace dependency (no `file:` link, no monorepo-src fallback).
- **Shell consolidation onto the template**: `nexus-app-shell.tsx:1` is a bespoke 89-line header with no sidebar. It maps onto the shell template's topbar nav-slot services (left slot: repo selector + symbol search; right slot: settings, Connect MCP, theme toggle, BeskidHub, avatar). The target's "sidebar disabled → topbar avatar dropdown with user data" matches nexus's current no-sidebar layout. The `BeskidHub` import moves from `@beskid/beskid-ui/react/BeskidHub` to the canonical lib's hub export. `ThemeToggle`'s `Button` import re-homes. `NexusServiceUnavailable`/`OAuthSetupWizard`/`LoadingOverlay` stay app-local.
- **Authelia integration**: `nexus-api.ts:5-21` (`SetupStatus`, `AuthUser`, `fetchAuthMe`, `githubLoginUrl`) and the `OAuthSetupWizard` (`components/OAuthSetupWizard.tsx:1`) implement the existing auth-hub pairing flow (`COOLIFY.md:38-43`). The target replaces this with the template's Authelia (GitHub login) + shared Postgres. `fetchAuthMe`/`githubLoginUrl` collapse into template auth calls; `OAuthSetupWizard` and the `setup` shell phase are deleted. The server-side `@beskid/auth-client` on the CLI stays (server-to-hub), but the **web** no longer runs its own setup wizard.
- **Explorer consolidation — the shared-explorer-dialog goal**: today nexus has *two* explorer surfaces that the target wants unified into the shared lib:
  1. `FileTreePanel.tsx:1` (591 lines) — bespoke graph-node file tree, not using `@cyber-nomad-collective/beskid-ui-react/explorer`. To consolidate: add a `GraphNode → RepoEntry` adapter (or generalize the lib's `FileExplorer` to accept a `nodes: GraphNode[]` source alongside `entries: RepoEntry[]`), then render the lib `FileExplorer` inside nexus with `onSelect` → `onFocusNode`. The lib `RepoExplorerDialog` is not the right shell here (nexus embeds the tree inline, not as a modal), but its `FileExplorer` child is.
  2. `CodeReferencesPanel.tsx:1` (725 lines) — file content viewer with syntax highlighting (`react-syntax-highlighter`), not in the shared lib. Candidate to lift as a `CodeViewer`/`FilePreview` component into `@cyber-nomad-collective/beskid-ui-react` (the website, pckg, platform-spec, and tracker all need a code-with-syntax-highlighting viewer; this is the "one explorer dialog across website, pckg, platform-spec, and tracker" surface).
- **Graph consolidation**: the lib's `graph/` (ReactFlow AST/facts) and nexus's `GraphCanvas`/`useSigma` (Sigma whole-repo) are **different problems on different stacks**. They should not be merged into one component. Instead:
  - Lift the Sigma-based whole-repo explorer into the shared lib as a new `@cyber-nomad-collective/beskid-ui-react/graph-sigma` (or `graph-repo`) module — `GraphCanvas.tsx`, `useSigma.ts`, `graph-adapter.ts`, the highlight/animation/blast-radius model, and the `SigmaNodeAttributes`/`SigmaEdgeAttributes` types. This is the "shared AST/DAG explorer UI (ReactFlow/d3)" surface the AGENTS.md facts call out — but note nexus uses Sigma, not ReactFlow/d3; the shared surface is **Sigma-based** here. The lib's existing ReactFlow `graph/` stays for per-file AST/facts (website docs demos, etc.).
  - `ProcessesPanel.tsx:1` + `ProcessFlowModal.tsx:1` (Mermaid flowcharts) and `MermaidDiagram.tsx:1` are candidates to lift if other services need Mermaid process rendering; otherwise they stay app-local.
- **Data layer porting**: `services/backend-client.ts:1` (976 lines) and `nexus-api.ts:1` move as-is, but the streaming graph download (`connectToServer` with progress callbacks, `resilientFetch` from `gitnexus-shared`) must keep working under Nitro's fetch. The `/api` proxy moves from Vite dev-server proxy to Nitro dev-proxy / production same-origin config. `NEXUS_OPEN_SPEC_CATALOG` server-side reconciliation stays in the CLI server.
- **Workspace membership**: `beskid_nexus` is its own git repo (a submodule/sibling, not in the root pnpm workspace). The web app moves to `beskid_sites/apps/nexus` and joins `beskid_sites/pnpm-workspace.yaml:1-4`. `gitnexus-shared` moves to `beskid_sites/packages/beskid-nexus-shared` (or stays a submodule consumed via `file:` — but the target says `beskid_sites` is standalone, not a submodule, so it should be vendored/copied in). The `gitnexus` CLI/server stays in `beskid_nexus/gitnexus/` and is built/deployed from there; only the **web** moves. The `file:../../beskid_web_common/*` links are deleted; `@cyber-nomad-collective/beskid-ui-react` becomes a workspace `catalog:` or `workspace:*` dependency.
- **Dead dependency cleanup**: drop `@cyber-nomad-collective/trudoc` (`package.json:26`, unused), and drop `@beskid/beskid-ui` once `BeskidHub` and the material-theme CSS are confirmed in `@cyber-nomad-collective/beskid-ui-react`.

## Risks & unknowns

- **Sigma.js SSR**: TanStack Start is SSR-capable; Sigma.js and graphology are browser-only (WebGL canvas). `useSigma.ts:1` mounts in `useEffect`/`useRef` today, but the import graph must be guarded with `clientOnly`/dynamic import or SSR will try to load Sigma server-side and break. The current SPA never SSRs — this is a new constraint. Mermaid (`ProcessFlowModal.tsx:7-9`, `MermaidDiagram.tsx`) and `react-syntax-highlighter`/`react-markdown` have the same browser-only profile.
- **Backend coupling / serving model decision**: today `gitnexus serve` hosts the built SPA from `gitnexus/web/` on port 8452, same origin as `/api`. If the new TanStack Start app runs as a **separate** Nitro server (own port), the `/api` proxy and session-cookie auth (same-origin `credentials: "include"` in `nexus-api.ts:49`) need CORS + cookie-domain work. If the Start build still produces a static bundle that `gitnexus serve` hosts (preserving same-origin), the migration is much smaller but the "TanStack Start app" goal is only partially met (no Nitro server routes). **This is the biggest open decision** and it gates the auth + data-layer phases.
- **`gitnexus-shared` provenance**: it is currently a sibling source package built in-place. Moving the web app to `beskid_sites` (standalone, not a submodule) means `gitnexus-shared` either (a) is copied into `beskid_sites/packages/beskid-nexus-shared` and maintained there, (b) is published to GitHub Packages as `@cyber-nomad-collective/beskid-nexus-shared` and consumed via `catalog:`, or (c) stays a `file:` link back to `beskid_nexus/gitnexus-shared` (violates "not a submodule"). Each has a maintenance cost; (b) is the cleanest but requires a publish pipeline that does not exist today.
- **Authelia vs. auth-hub**: `COOLIFY.md:38-43` documents the current Beskid auth-hub pairing (hub admin → pairing code → Nexus setup → GitHub sign-in via hub). The target says "Auth via Authelia (GitHub login)" + "Shared Postgres backs website + Authelia." Whether Authelia replaces the auth-hub for nexus (and the server-side `@beskid/auth-client` on the CLI), or coexists, is an architecture-level decision that must be settled before the web port drops `OAuthSetupWizard` and the `setup` phase. The server currently seals sessions with `SESSION_SECRET` and pairs with `AUTH_HUB_PUBLIC_URL` — those secrets/flows change under Authelia.
- **Shared-explorer-dialog API drift**: lifting `FileTreePanel` into the lib `FileExplorer` requires reconciling `GraphNode` (graph nodes with `label`, `properties.filePath`, `properties.name`) vs. `RepoEntry` (`kind: "file"|"dir"`, `path`, `children`). The lib's `ListChildrenFn` lazy loader does not match nexus's "filter visible labels + focus node in graph" interaction. Either generalize the lib component (breaking risk for website/pckg/platform-spec/tracker consumers) or keep nexus's tree app-local and only lift the `CodeReferencesPanel`/code viewer.
- **Sigma graph consolidation risk**: moving `GraphCanvas`/`useSigma`/`graph-adapter` (≈1500 lines) into the shared lib adds `sigma`, `graphology*`, `@sigma/edge-curve` as lib `dependencies` — heavy peer deps for any consumer that only wants shadcn UI. Decision: ship as a separate subpath export (`@cyber-nomad-collective/beskid-ui-react/graph-sigma`) with its own dep set, or keep app-local. The AGENTS.md fact ("Shared AST/DAG explorer UI (ReactFlow/d3) belongs in common `@beskid` components") says ReactFlow/d3 — nexus is Sigma, so it is arguably a *different* shared surface and may not belong in the same module.
- **Playwright e2e under Start**: the `e2e/` suite assumes the Vite dev server + same-origin `/api` proxy. Under TanStack Start (Nitro) the dev server port and proxy config differ; e2e must be re-pointed and the `/api` mock/real-backend choice for tests re-decided.
- **`NexusServiceUnavailable` / heartbeat**: `App.tsx:217-223` runs a `connectHeartbeat` against the backend while exploring. Under a split Nitro+backend deployment this heartbeat must cross origins; under same-origin bundle hosting it is unchanged.

## Recommended phased approach

1. **Phase 0 — Lib + template readiness (blocking, shared)**: Confirm `@cyber-nomad-collective/beskid-ui-react` exports `Button`, `BeskidHub` (re-homed from `@beskid/beskid-ui`), `SettingsDialog`/`defineSettingsRegistry` (`./settings`), `material-theme` CSS, `hub.css`, `shadcn-entry.css`, and the `#/components/ui/*` alias pattern. Confirm the shell template's Authelia auth + topbar nav-slot (left/right) API and the "no-sidebar avatar dropdown" behaviour. Decide the **serving model** (separate Nitro server vs. static bundle hosted by `gitnexus serve`) and the **`gitnexus-shared` provenance** (publish vs. copy-in vs. `file:`). Do not start the nexus port until these are settled.
2. **Phase 1 — Scaffolding & static port**: Create `beskid_sites/apps/nexus` from the shell template. Vendor or `catalog:`-import `gitnexus-shared` (per Phase 0 decision). Port `core/graph/*`, `lib/*` (incl. `graph-adapter.ts`, `constants.ts`, `mermaid-generator.ts`), `hooks/*` (incl. `useAppState.tsx`, `useSigma.ts`, `app-state/*`), `services/backend-client.ts`, `services/nexus-api.ts`, and the pure-React components (`GraphCanvas`, `graph-explorer-layout`, `FileTreePanel`, `CodeReferencesPanel`, `ProcessesPanel`, `ProcessFlowModal`, `MarkdownRenderer`, `MermaidDiagram`, `StatusBar`, `repo-selector`, `standard-links`, `typed-doc-link`, `EmbeddingStatus`, `LoadingOverlay`, `NexusServiceUnavailable`). Re-home `@beskid/ui-react` → `@cyber-nomad-collective/beskid-ui-react`, drop `@beskid/beskid-ui` once `BeskidHub`/theme CSS are confirmed in the new lib, drop `@cyber-nomad-collective/trudoc` (unused). Introduce a minimal TanStack Start route tree (`/`, `/repo/:id`) replacing the `ShellPhase` machine; keep `setup`/`server-down` as route-level guards for now. Guard Sigma/Mermaid/syntax-highlighter imports with `clientOnly`. Get Vitest green; re-point Playwright to the Start dev server.
3. **Phase 2 — Shell + auth adoption**: Replace the bespoke `nexus-app-shell.tsx` header with the shell template's topbar nav-slot services (left slot: repo selector + `SymbolSearch`; right slot: settings, Connect MCP, theme toggle, `BeskidHub`, avatar). Replace the `OAuthSetupWizard` + `fetchAuthMe`/`githubLoginUrl` + `setup` phase with the template's Authelia (GitHub login) integration; drop `SESSION_SECRET`/`AUTH_HUB_PUBLIC_URL` from the web env (server-side `@beskid/auth-client` on the CLI is a separate decision). Confirm session cookies work under the chosen serving model (Phase 0 decision).
4. **Phase 3 — Explorer consolidation into the shared lib**: Decide `FileTreePanel` consolidation — either generalize `@cyber-nomad-collective/beskid-ui-react/explorer`'s `FileExplorer` to accept a `GraphNode[]` source (add a `nodesToRepoEntries` adapter in the lib), or keep nexus's tree app-local and only lift the code viewer. Lift `CodeReferencesPanel`'s syntax-highlighted file viewer as a `CodeViewer`/`FilePreview` component into the lib (the cross-service shared-explorer-dialog surface). Decide whether the Sigma whole-repo explorer moves into a new `@cyber-nomad-collective/beskid-ui-react/graph-sigma` subpath (with `sigma`/`graphology*` as its own deps) or stays app-local — based on whether website/pckg/platform-spec/tracker actually need whole-repo Sigma rendering.
5. **Phase 4 — Data layer + deploy**: Finalize the `/api` proxy (Nitro dev-proxy + production same-origin or CORS). Verify the streaming `connectToServer` graph download and `connectHeartbeat` survive the new fetch/runtime. Update the Dockerfile: either the Start build produces a static bundle copied into `gitnexus/web/` (minimal server change) or a separate Nitro server image is built and Coolify compose is updated to run both. Update `COOLIFY.md` secrets table (drop `NEXUS_SETUP_TOKEN` if Authelia fully replaces the setup flow; keep `NEXUS_MCP_AUTH_TOKEN`, `GITHUB_WEBHOOK_SECRET`, `OPENROUTER_API_KEY`). Remove the `vercel.json` fallback if the Start app is no longer Vercel-deployable as-is. Remove `beskid_nexus/gitnexus-web` once `beskid_sites/apps/nexus` is the canonical web build.

## Verdict

**PARTIAL — shell-adapted Vite SPA migration done; full TanStack Start
conversion + full Authelia auth pending (master Plan Phase 8).** The entire
React/Sigma/graphology/mermaid explorer surface and the `gitnexus-shared`
data contracts moved cleanly into `beskid_sites/apps/nexus/` with imports
re-homed to `@cyber-nomad-collective/beskid-ui-react` and the shared shell.
The remaining work is gated by two open architecture decisions (serving
model: separate Nitro server vs. bundle hosted by `gitnexus serve`; and
Authelia vs. the existing auth-hub pairing), and the "shared explorer
dialog" goal requires either generalizing the lib `FileExplorer` to accept
graph nodes or lifting a new `CodeViewer` + a Sigma-based `graph-sigma`
module — real lib API work, not just re-homing imports. Tracked in the
master `Plan.md` Phase 8.
