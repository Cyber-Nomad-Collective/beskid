# Service: site/website

> Original research for migrating `site/website/` (Astro + Starlight book/landing
> site) into the `beskid_sites/` standalone pnpm workspace as a TanStack Start
> (React + Nitro) app reusing the shell template and the canonical
> `@cyber-nomad-collective/beskid-ui-react` library. The research below
> informed the migration; the migration is **DONE** — see Current Status.

## Current Status

**Migration: DONE.** `apps/website/` is a live TanStack Start app deployed at
`beskid-lang.org` behind the Coolify proxy with Caddy labels.

- **Deployed:** yes — `beskid-lang.org` (production), via Coolify proxy +
  Caddy labels. Image built from `beskid_sites/apps/website/`.
- **What's working:**
  - 227 MDX files carried (Beskid Book + blog + landing + downloads).
  - Starlight docs shell reimplemented in React; sidebar (driven by
    `nav.order.json`), right-side ToC, theme select, edit-on-GitHub link,
    Giscus via `@giscus/react`, Pagefind search.
  - Remark pipeline + Beskid Shiki grammar preserved (`remark-beskid-directives`,
    trudoc remark scripts, OpenSpec catalog hard-fail gate).
  - `trailingSlash: 'always'` and legacy redirects (`/platform-spec`,
    `/overview`, `/guides`, `/execution`, `/corelib`, `/api`, `/packages`)
    preserved.
  - API routes `releases` / `version` ported to TanStack Start server
    routes (GitHub fetch + fallback + `Cache-Control`).
  - Book image-tag invariant preserved (remote HTTPS URLs in
    `book/00-why-beskid-exists/` are not auto-rewritten).
  - Static-hosting contract re-expressed for the new build (JSON endpoints
    prerendered; website root pinned).
- **Pending:**
  - Auth: edit surfaces run with `SHELL_AUTH_MODE=mock` until Authelia is
    live (master Plan Phase 1). Most of the website is public; auth only
    gates the edit/Giscus-comment surfaces.
  - Cutover from Coolify to the standalone Caddy compose (master Plan
    Phase 3).
  - CI/CD migration to `cr.beskid-lang.org` + SSH deploy (master Plan
    Phase 6).
- **Human steps needed:** none specific to this service beyond the
  cross-phase steps in the master Plan (DNS, OpenBao, OAuth callback).

The phased approach and risks documented below were the planning basis; the
implementation is complete modulo the pending infra phases.

---

Research-only plan for migrating `site/website/` (Astro + Starlight book/landing site) into the
`beskid_sites/` standalone pnpm workspace as a TanStack Start (React + Nitro) app reusing the
shell template and the canonical `@cyber-nomad-collective/beskid-ui-react` library.

## Current architecture (concise)

- **Framework:** Astro `6.4.6` with `@astrojs/react 6.0.1` (React renderer) and `@astrojs/starlight ^0.38.4`
  as the docs shell (`site/website/package.json:24-37`, `site/website/astro.config.mjs:147-192`).
  Additional integrations: `astro-embed` (LinkPreview disabled, YouTube used), `astro-mermaid`,
  and `trudoc/integration` (Astro integration from the `trudoc` package).
- **Content pipeline:** a single Starlight `docs` collection defined in `src/content.config.ts:6-16`
  via `docsLoader()` + `docsSchema()` extended with `blogStatus`, `date`, `release`. Content lives
  canonically under `src/content/docs/` — the Beskid Book (22 chapters + `reference/` + appendix),
  a blog (~52 posts under `blog/`), a `packages/` tree, a `downloads.mdx`, and an `index.mdx` landing.
  Roughly 250+ Markdown/MDX files. Book sidebar order is driven by
  `src/content/docs/book/nav.order.json` (tutorial + reference + appendix groups).
- **MDX usage:** MDX files import Astro-only components: `Aside` from `@astrojs/starlight/components`
  (≈18 chapter index/section pages), `YouTube` from `astro-embed` (1 file:
  `book/00-why-beskid-exists/trauma-by-developers-for-developers.mdx:7`), and local `.astro`
  components — `LandingTemplate`, `DownloadsPage`, `ReleaseBlogIndex`, `LinkedAstFactsShell`,
  `PackageRegistryConsole`.
- **Custom remark pipeline** (`astro.config.mjs:131-146`): `remarkBeskidDirectives`
  (`src/lib/remark-beskid-directives.mjs` — typed embeds `spec`/`book`/`nexus`/`bug`, canonical
  OpenSpec alias rewriting, and the informative-notice injected on every Book page), plus three
  trudoc plugins (`createRemarkArchCodeFence`, `remarkRepoLinkFence`, `remarkInlineRepoPaths`) and
  a registered Beskid Shiki grammar (`trudoc/grammars/load-beskid-grammar.mjs`,
  `trudoc/grammars/beskid.tmLanguage.json`).
- **Routing:** file-based via Starlight; `trailingSlash: 'always'`. Static redirects declared in
  `astro.config.mjs:39-104` (`/platform-spec` → `spec.beskid-lang.org`, `/overview` → `/`,
  `/guides` → `/book/reference`, legacy `/execution` / `/corelib` / `/api` / `/packages` bridges).
  Two JSON API endpoints in `src/pages/api/` (`releases.json.ts`, `version.json.ts`) both with
  `prerender = true` (SSG).
- **Build/deploy:** `astro build` → static `dist/`. `Dockerfile` builds with pnpm from the repo
  root, copies the `beskid_web_common` submodule (for `file:` links), requires a non-empty
  `openspec/catalog.json` (`BESKID_REQUIRE_OPENSPEC_CATALOG=1`), runs `sync:release-version`, then
  serves `dist/` via `nginx:1.27-alpine` using `nginx/default.conf` (SPA fallback, legacy
  `/corelib` `/execution` `/platform-spec/` redirects, `.txt` SPA routing). View Transitions via
  `ClientRouter` `fallback="animate"` (per `README.md:67`). Giscus comments configured via
  `PUBLIC_GISCUS_*` env vars (`.env.example`).
- **Tests:** `node --test` over `src/lib/*.test.mjs`/`.ts` — `remark-beskid-directives`,
  `blog`, `tracker-provenance`, `static-hosting-contract` (the latter asserts the trudoc import
  name, the React renderer registration, `client:only="react"` on DownloadsSection, the pinned
  website root in the Dockerfile, and `prerender = true` on the JSON endpoints). `prebuild` runs
  `test:docs-links`.

## Coupling to beskid packages

`site/website/package.json:25-29` uses `file:` links into `../../beskid_web_common/packages/*`:
- `trudoc` (`file:../../beskid_web_common/packages/trudoc`) — consumed as Astro integration
  (`trudoc()`), remark scripts (`trudoc/scripts/remark-*.mjs`), and the Beskid grammar
  (`trudoc/grammars/beskid.tmLanguage.json`, `trudoc/grammars/load-beskid-grammar.mjs`).
- `@beskid/beskid-ui` (`file:../../beskid_web_common/packages/beskid-ui`) — npm alias of
  `@cyber-nomad-collective/beskid-ui`. Used for: `docsShellCustomCss` from `shell-css`
  (`astro.config.mjs:10,188`), and **8 Starlight component overrides** under the `starlight/`
  export (`Head`, `Header`, `Footer`, `ThemeSelect`, `Sidebar`, `Banner`, `Page.astro`,
  `GiscusComments.astro`) wired in `astro.config.mjs:179-187`. Also `beskidUiSrcUrl()` in
  `src/lib/beskid-ui-root.mjs` resolves package-relative asset paths (e.g.
  `styles/landing.css`, `styles/downloads.css`) for Vite `<link>`/`<style>` injection.
- `@beskid/ui-react` (`file:../../beskid_web_common/packages/beskid-ui-react`) — npm alias of
  `@cyber-nomad-collective/beskid-ui-react`. Used by:
  - `src/components/DownloadsPage.astro:6` → `DownloadsSection` from `@beskid/ui-react/downloads`
    (mounted with `client:only="react"`).
  - `src/components/BlogShareMenu.tsx:1-6` → `DropdownMenu*` from `@beskid/ui-react/ui/dropdown-menu`
    (the only true React island in blog posts; mounted via `client:load` in
    `BlogAwarePageTitle.astro:24`).
  - `src/components/LinkedAstFactsShell.astro:41-44` → `LinkedAstFactsView`, `sampleAst`,
    `sampleFacts` from `@beskid/ui-react/graph` (manual `createRoot` mount, used by
    `book/14-from-source-to-runs/ast-facts-graph.mdx:7`).
- Vite config (`astro.config.mjs:110-126`): `dedupe: ['react','react-dom']`, `ssr.noExternal`
  for `@beskid/beskid-ui`, `@beskid/ui-react`, `trudoc`, and `server.fs.allow` for the repo root
  and `beskidUiRoot` (so Vite can serve package-internal `src/` assets).
- `env.d.ts:3-25` declares ambient modules for `@beskid/beskid-ui/shell-css` and the trudoc
  remark/grammar entry points (TypeScript has no types for them).

Per `beskid_sites/DECISIONS.md`, the target workspace ships **only** `beskid-ui-react` (the pure
React shadcn library) as `packages/beskid-ui-react`; the Astro/React-mixed `beskid-ui` package is
**not** copied. Its React parts (`BeskidHub.tsx`, `LinkedAstFactsPanel.tsx`, hub icons,
`beskid-services` data) are already canonicalized inside `beskid-ui-react`. That means every
`@beskid/beskid-ui/starlight/*` Astro override and `@beskid/beskid-ui/shell-css`/`styles/*` asset
path used by `site/website` has **no direct equivalent** in the target workspace and must be
reimplemented or sourced elsewhere.

## What moves cleanly (minimal change)

These are framework-neutral or already React, and lift into the new workspace almost verbatim:

- **`src/components/BlogShareMenu.tsx`** — already a React component using
  `@beskid/ui-react/ui/dropdown-menu`. The dropdown primitives already exist in
  `beskid_sites/packages/beskid-ui-react`. Becomes a direct import from
  `@cyber-nomad-collective/beskid-ui-react` with no API change.
- **`DownloadsSection`** from `@beskid/ui-react/downloads` — already React; already present in
  the new lib. `src/components/DownloadsPage.astro` becomes a thin React route that renders
  `<DownloadsSection>` directly (dropping the `client:only="react"` island wrapper and the
  manual CSS injection).
- **`LinkedAstFactsView` + `sampleAst` + `sampleFacts`** from `@beskid/ui-react/graph` — already
  in the new lib. `LinkedAstFactsShell.astro`'s manual `createRoot` mount collapses into a
  direct component import inside an MDX page.
- **Plain-TS data files** under `src/data/` — `landing-code-tabs.ts`, `landing-tile-sections.ts`,
  `landing-dotnet-bullets.ts`, `landing-sources.ts` — pure typed data with no Astro imports;
  reusable as-is by React landing components.
- **`src/lib/blog.ts`** — pure sort/split/label helpers over a `BlogEntry` shape; reusable
  unchanged by a React blog index route.
- **`src/lib/tracker-delivery.ts`** and **`src/lib/load-download-versions.ts`** — pure Node
  logic (file reads, GitHub release fetch, semver check). Portable to Nitro server routes /
  server functions with no logic change (`load-download-versions.ts`'s `resolveWebsiteRoot()`
  heuristic simplifies once the app root is fixed).
- **`src/pages/api/releases.json.ts`** and **`src/pages/api/version.json.ts`** — both are plain
  `export async function GET({ url })` handlers with `prerender = true`. They port to TanStack
  Start server routes (`api/releases` / `api/version`) by dropping the `prerender = true` line
  and adjusting the import signature; the GitHub fetch + fallback logic is unchanged. The
  `Cache-Control` headers carry over.
- **`src/lib/remark-beskid-directives.mjs`** and the trudoc remark scripts
  (`remark-arch-code-fence.mjs`, `remark-repo-link-fence.mjs`, `remark-inline-repo-paths.mjs`)
  plus the Beskid Shiki grammar — all framework-neutral unified/remark plugins. They can be
  wired directly into a Vite MDX pipeline (`@mdx-js/rollup` or `@mdx-js/node-loader`) in the new
  app. The OpenSpec catalog hard-fail gate (`requireOpenSpecCatalog()`) is preserved.
- **`src/lib/landing-highlight.mjs`** — Shiki-based build-time highlighter (dual theme, Beskid
  grammar via `trudoc/grammars/beskid.tmLanguage.json`). Framework-neutral; reusable for
  build-time code highlighting of landing code surfaces.
- **`scripts/sync-release-version.mjs`** and **`scripts/run-trudoc.mjs`** — Node scripts
  independent of Astro; reusable as prebuild steps in the new app's `package.json`.
- **`src/data/cli-version.json`**, **`src/data/vscode-extension.json`**, and the
  `src/data/architecture-graphs/` fixtures — plain JSON, portable as-is.
- **Static assets** — `public/favicon.svg`, `public/install.sh`, `public/install.ps1`,
  `public/book-assets/`, `src/assets/` — served the same way by Nitro's `public/` dir.

## What requires heavy migration (Astro-specific — itemized)

### Starlight docs shell (the largest single piece)
- The whole Book/blog reader chrome is **Starlight**: sidebar, theme select, header/footer,
  banner, page title, pagination, right-side ToC, search (Pagefind via Starlight), edit-on-GitHub
  link, giscus comments. There is no React equivalent in the target workspace. Either:
  (a) the **shell template must grow a "docs mode"** (sidebar from `nav.order.json`, ToC, theme
  select, edit link, giscus, Pagefind search), or
  (b) a React docs framework (Fumadocs, Vocs, Nextra) must be adopted and wired into the
  shell template. Both are significant net-new work.
- The **8 Starlight component overrides** imported from `@beskid/beskid-ui/starlight/*` in
  `astro.config.mjs:179-187` (`Head`, `Header`, `Footer`, `ThemeSelect`, `Sidebar`, `Banner`,
  plus `Page.astro` and `GiscusComments.astro` referenced from `README.md:67`) are `.astro`
  files in the mixed `beskid-ui` package — which the target workspace deliberately does not
  ship. Every one of these needs a React reimplementation in the shell template (or shared lib).

### Astro content collections
- `src/content.config.ts` uses `astro:content` (`docsLoader`, `docsSchema`). TanStack Start has
  no equivalent content layer. A replacement must be built: Vite glob imports of
  `src/content/docs/**/*.{md,mdx}` + a Zod schema mirroring the extended frontmatter
  (`title`, `description`, `template`, `tableOfContents`, `blogStatus`, `date`, `release`),
  exposing a typed collection API to routes. The Book nav must be regenerated from
  `src/content/docs/book/nav.order.json`.

### MDX content (≈250 files)
- ≈18 MDX files import `Aside` from `@astrojs/starlight/components` (every chapter `index.mdx`
  plus several section pages). A codemod must replace these with a React `<Aside>` component
  added to the shared lib (or per-app MDX provider).
- `book/00-why-beskid-exists/trauma-by-developers-for-developers.mdx:7` imports `YouTube` from
  `astro-embed` — replace with a React YouTube embed component.
- `src/content/docs/index.mdx`, `downloads.mdx`, `blog/index.mdx`,
  `packages/index.mdx`, and `book/14-from-source-to-runs/ast-facts-graph.mdx` import local
  `.astro` components (`LandingTemplate`, `DownloadsPage`, `ReleaseBlogIndex`,
  `LinkedAstFactsShell`, `PackageRegistryConsole`) — each must become a React component
  imported from the new app (or shared lib).
- **Book image-tag invariant** (root `AGENTS.md` + `README.md:69`): the author uses remote HTTPS
  URLs on purpose in `src/content/docs/book/00-why-beskid-exists/`; the new pipeline must
  preserve these and never rewrite to local paths. The migration must not introduce a
  "co-located image" auto-transform on Book MDX.

### Astro components (must be rewritten in React)
- `src/components/LandingTemplate.astro` (+ `LandingCodeWindow.astro`, `LandingCodePane.astro`,
  `LandingCompareTable.astro`, `LandingDotNetSection.astro`, `LandingDotNetBulletList.astro`,
  `LandingTileSection.astro`) — pure Astro with inline vanilla JS
  (`<script is:inline>` for tab switching, smooth-scroll, platform-aware download href swap,
  dialog portal + `showModal`). Rewrite as React components with state/effects; the inline
  scripts become `useEffect`/event handlers. The build-time Shiki highlighting from
  `landing-highlight.mjs` can stay, invoked at build time.
- `src/components/DownloadsPage.astro` — Astro wrapper that injects `downloads.css` and mounts
  `<DownloadsSection client:only="react">`. Collapses to a React route rendering
  `<DownloadsSection>` directly, with the CSS imported through the shared lib's
  `styles/shadcn-entry.css` / a direct `downloads.css` import.
- `src/components/ReleaseBlogIndex.astro` — iterates `getCollection('docs')` to list blog
  entries. Becomes a React route that reads the content-layer blog index (server loader or
  build-time import) and renders the same featured/archive layout.
- `src/components/starlight/BlogAwarePageTitle.astro` — Starlight `PageTitle` override. Folds
  into the docs route layout (a React component that reads the entry's `blogStatus`/`date`/
  `release` and renders the blog post header, including `<BlogShareMenu>`).
- `src/components/LinkedAstFactsShell.astro` — manual `createRoot` mount with a JSON script
  tag for config. Collapses to a direct `<LinkedAstFactsView>` import in an MDX page (the
  config props become normal React props).
- `src/components/PackageRegistryConsole.astro` — Astro component with inline vanilla JS for
  filtering/review actions/form submit. Rewrite as a React component (the data is hardcoded
  mock data in the frontmatter, so the port is mechanical). It is unrelated to the shared
  `beskid-ui-react` explorer — no shared component to reuse here today.

### Routing, redirects, and deploy
- `astro.config.mjs:39-104` redirects (`/platform-spec`, `/overview`, `/guides`, legacy
  `/execution` / `/corelib` / `/api` / `/packages` bridges, plus alias list) must move to
  TanStack Start / Nitro route rules (or `redirects` in the Nitro config). `nginx/default.conf`
  carries additional SPA fallback + legacy block rules — either keep nginx in front of the
  Nitro server or move all of these into Nitro.
- **SSG contract:** Astro prerenders everything to static `dist/` served by nginx.
  `src/lib/static-hosting-contract.test.mjs` enforces `prerender = true` on the JSON endpoints
  and the React renderer registration. TanStack Start is SSR-first (Nitro); to preserve static
  hosting, the new app must use TanStack Start's prerender/spa mode (or a Nitro static
  preset). The test contract must be re-expressed for the new build (the React-renderer and
  `client:only` assertions become moot; the "JSON endpoints are prerendered" and "website root
  is pinned" assertions can stay).
- **View Transitions:** Astro `ClientRouter` with `fallback="animate"` + the Starlight
  `<main>` directional slide from `@beskid/beskid-ui/starlight/Page.astro`
  (`README.md:67`). Replace with TanStack Router's view-transition API or a React transition
  library — and reimplement the Page.astro slide in the docs layout.
- **Giscus** (`GiscusComments.astro` from `beskid-ui/starlight`, configured via
  `PUBLIC_GISCUS_*` env vars) must be reimplemented as a React giscus widget (`@giscus/react`)
  inside the docs layout, preserving the `pathname` mapping so existing discussion threads
  stay attached.
- **trudoc integration:** `trudoc()` is an Astro integration (`astro.config.mjs:157-164`)
  configuring `htmlDataAttrs` (the `data-book` attribute on the book subtree). The remark
  scripts and grammar are framework-neutral, but the integration wrapper is not. The new app
  must replace the integration with direct MDX/Vite plugin configuration that preserves the
  `data-book` attribute injection on Book pages (consumed by the Book informative-notice logic
  in `remark-beskid-directives.mjs:136`).
- **Dockerfile:** currently copies the `beskid_web_common` submodule for the `file:` links,
  pins `BESKID_WEBSITE_ROOT`, requires `openspec/catalog.json`, and runs
  `sync:release-version`. The new workspace consumes `@cyber-nomad-collective/beskid-ui-react`
  as `workspace:*` (no `file:` link, no submodule), so the Docker build context and install
  steps must be rewritten — install the `beskid_sites` workspace, copy `openspec/`, run the
  prebuild, and produce static output (or run Nitro).

## Risks & unknowns

- **Docs shell is the biggest unknown.** Starlight gives sidebar, ToC, theme select, search,
  edit link, and giscus for free. The target workspace has no docs shell. Choosing
  "extend the shell template with a docs mode" vs "adopt Fumadocs/Vocs/Nextra" is a design
  decision that gates most of the migration.
- **Search.** Starlight ships Pagefind. TanStack Start has no docs search out of the box — a
  Pagefind integration (or equivalent) must be added to the docs mode.
- **OpenSpec catalog hard-fail.** `remarkBeskidDirectives` throws in CI/production when
  `openspec/catalog.json` is missing or empty (`src/lib/remark-beskid-directives.mjs:32-51`).
  This gate must be preserved in the new MDX pipeline or the Book link rewrite silently breaks.
- **trudoc outside Astro.** The remark scripts and grammar are framework-neutral `.mjs`/JSON,
  but the `trudoc()` Astro integration is not. Need to confirm whether the `data-book` attribute
  injection and any other trudoc integration behavior can be reproduced with plain MDX/Vite
  plugin options. If trudoc ships non-Astro entry points for them, the migration is lighter;
  if not, those features must be reimplemented.
- **Book image-tag invariant.** The new pipeline must not auto-rewrite the remote HTTPS image
  URLs in `src/content/docs/book/00-why-beskid-exists/` to local paths (root `AGENTS.md` +
  `README.md:69`). Any MDX image plugin must be configured to leave remote URLs untouched.
- **URL stability / giscus threads.** `trailingSlash: 'always'` and the pathname-based giscus
  mapping mean existing discussion threads and external links depend on the exact URL shape.
  The new router must preserve trailing slashes and all redirect targets.
- **SSG vs SSR deploy story.** The current image is nginx-served static. Switching to a Nitro
  node server changes the runtime surface (and the Coolify service shape). Keeping SSG
  preserves the deploy story but requires TanStack Start's prerender/spa mode to produce
  equivalent static output — maturity of that path for a docs site of this size is unverified.
- **Content codemod scope.** ≈18 `Aside` imports + 1 `YouTube` import + 5 local `.astro`
  component imports across MDX — a reliable codemod (or careful manual sweep) is needed; missing
  one breaks the build.
- **Inline `<script is:inline>` semantics.** Several Landing components and
  `PackageRegistryConsole.astro` use inline scripts that re-init on `astro:page-load` (View
  Transitions). React effects have different lifecycle semantics; the platform-aware download
  href swap and dialog portal logic need careful porting to avoid stale listeners.
- **`beskid-ui-root.mjs` removal.** It exists only to resolve `@beskid/beskid-ui` package
  internals for Vite asset imports (`styles/landing.css`, `styles/downloads.css`). The new lib
  exposes CSS through package exports (`styles/shadcn-entry.css`, `styles/beskid-tokens.css`,
  `styles/shadcn-theme.css`, `styles/hub.css`); `landing.css` and `downloads.css` are **not**
  in `beskid-ui-react`'s exports today. Those stylesheets must either be added to the shared
  lib or moved into the app.
- **Docker/CI contract tests.** `scripts/ci/test/image-preparation-contract.test.sh` and
  `src/lib/static-hosting-contract.test.mjs` assert Astro-specific shapes (React renderer
  registration, `client:only="react"`, the submodule copy, the pinned website root). These must
  be re-expressed for the new build, not deleted silently.

## Recommended phased approach (ordered, each small)

1. **Foundation & shared lib gaps.** Confirm `beskid_sites/packages/beskid-ui-react` already
   covers `DownloadsSection` (`downloads` export), the dropdown primitives used by
   `BlogShareMenu`, and `LinkedAstFactsView` (`graph` export). Add the missing pieces the
   website needs to the shared lib: a React `<Aside>` component (mirroring Starlight's
   variants), a React `<YouTube>` embed, and decide where `landing.css` / `downloads.css`
   live (add to the lib's `styles/*` exports or keep app-local).
2. **Content layer.** Build a framework-neutral MDX content loader (Vite glob import +
   Zod schema mirroring `src/content.config.ts:6-16`) over `src/content/docs/**`. Generate
   the Book nav tree from `src/content/docs/book/nav.order.json`. Preserve the
   `blogStatus`/`date`/`release` frontmatter. No UI yet.
3. **Remark/grammar pipeline.** Wire `remark-beskid-directives.mjs` and the trudoc remark
   scripts (`remark-arch-code-fence`, `remark-repo-link-fence`,
   `remark-inline-repo-paths`) plus the Beskid Shiki grammar into the MDX pipeline.
   Preserve the OpenSpec catalog hard-fail gate. Reimplement the `data-book` attribute
   injection that the `trudoc()` Astro integration provided.
4. **Docs shell decision + scaffold.** Decide docs-mode-in-shell-template vs. React docs
   framework. Scaffold the chosen shell: sidebar (from the generated nav tree), right-side
   ToC, theme select, edit-on-GitHub link, giscus (`@giscus/react`), Pagefind search. This is
   the largest single step and likely its own sub-project.
5. **Landing + downloads + blog routes.** Port `LandingTemplate` and the `Landing*`
   components to React (inline scripts → effects; build-time Shiki via
   `landing-highlight.mjs`). Port `DownloadsPage` to a React route rendering
   `<DownloadsSection>` directly. Port `ReleaseBlogIndex` to a React route reading the
   content-layer blog index. Port `BlogAwarePageTitle` into the docs route layout
   (including `<BlogShareMenu>`).
6. **API routes + redirects.** Port `src/pages/api/releases.json.ts` and
   `src/pages/api/version.json.ts` to TanStack Start server routes (drop `prerender = true`,
   keep the GitHub fetch + fallback + `Cache-Control`). Move `astro.config.mjs` redirects
   into Nitro route rules. Decide nginx-in-front-of-Nitro vs. Nitro-only and port
   `nginx/default.conf` legacy rules accordingly.
7. **Content codemod.** Replace `Aside` (≈18 files) and `YouTube` (1 file) imports with the
   new React MDX components. Replace the 5 local `.astro` component imports in MDX with the
   new React components. Verify the Book image-tag invariant (remote HTTPS URLs preserved)
   and run `verify:book-images` / `verify:book-layout` equivalents.
8. **Build/deploy + tests.** Decide SSG vs SSR. Update the Dockerfile to install the
   `beskid_sites` workspace (no `beskid_web_common` submodule copy), copy `openspec/`, run
   `sync:release-version`, and produce the chosen output. Re-express
   `static-hosting-contract.test.mjs` and `image-preparation-contract.test.sh` for the new
   build. Preserve `trailingSlash: 'always'` and all redirect targets.
9. **Cutover.** Flip the Coolify service to the new image; keep `site/website` redirect-
   compatible during a soak period. Remove `site/website` once the new app is stable and the
   legacy redirects are covered by Nitro/nginx.

## Verdict

**DONE — Heavy migration completed.** Starlight (docs shell, 8 Astro
overrides, Pagefind search, giscus, view transitions) + Astro content
collections + ≈250 MDX files importing Astro-only components + the
SSG/nginx static-hosting contract were all framework-specific and had no
counterpart in the target workspace; only a handful of React islands
(`BlogShareMenu`, `DownloadsSection`, `LinkedAstFactsView`) and the
plain-TS data/lib files lifted cleanly. All of it was reimplemented in
React under TanStack Start. Remaining work (Authelia cutover, Caddy
cutover, registry migration) is infra-phase work tracked in the master
`Plan.md`, not website work.
