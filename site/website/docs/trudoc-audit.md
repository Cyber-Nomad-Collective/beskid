# Trudoc audit: Beskid Starlight / platform-spec baseline

This document inventories custom behavior on top of `@astrojs/starlight` for the Beskid docs site (`site/website`), as a baseline for the **trudoc** extractable framework.

## 1. npm scripts and triggers

| Script | Role | Typical trigger |
|--------|------|-----------------|
| `sync:cli-version` | Beskid-specific CLI version sync | `prebuild`, `predev` |
| `generate:platform-spec-git-meta` | Writes generated git meta for spec pages | `prebuild`, `predev` |
| `verify:platform-spec-git-meta` | Validates generated git meta | `prebuild` |
| `verify:platform-spec` | Frontmatter rules (standalone) | manual |
| `verify:platform-spec-layout` | Layout tree + completeness + MDX hub props | via CI / `verify:platform-spec-ci` |
| `verify:platform-spec-ci` | Orchestrates frontmatter + layout (PR gate) | `prebuild`, CI |
| `verify:graphs` | Architecture / graph frontmatter | `prebuild` |
| `verify:language-meta-related-links` | Cross-link rules | `prebuild` |
| `verify:last-reviewed` | Policy check | manual (not in `prebuild` today) |
| `verify:diagnostics-spec-sync` | Compiler diagnostics ↔ docs | manual |
| `bootstrap:platform-spec-layout` | Layout.json scaffolding | manual |

**`prebuild` chain (today):** `sync:cli-version` → `generate:platform-spec-git-meta` → `verify:trudoc --preset beskid-prebuild` (frontmatter + layout + graphs + language-meta links + git-meta verify).

## 2. GitHub Actions path filters

Workflow: [`.github/workflows/platform-spec-contracts.yml`](../../.github/workflows/platform-spec-contracts.yml) (repo root).

Observed paths: `site/website/src/content/docs/platform-spec/**`, `packages/trudoc/**`, `packages/beskid-docs-ui/**`, root `package.json` / `bun.lock`, `site/website/package.json`, `site/website/astro.config.mjs`, workflow self.

Validators and generators live under **`packages/trudoc/scripts/`** (invoked from `site/website/package.json` via `node ../../packages/trudoc/scripts/…`).

## 3. MDX component usage (platform-spec)

MDX files import shell components from **`@beskid/docs-ui/platform-spec/*.astro`** (workspace package).

Approximate counts (`rg -l '<Name>' src/content/docs/platform-spec --glob '*.mdx' | wc -l`), total **397** `.mdx` files under `platform-spec/` (no `.md` leaves today).

| Component / symbol | Files | Replacement strategy (trudoc roadmap) |
|---------------------|------:|----------------------------------------|
| `SpecPageHeader` | 108 | Frontmatter + injected header shell (remark/rehype or layout wrapper); title from `entry.data.title`. |
| `SpecArticleChrome` | 288 | Article layout preset + auto-wrap (content collection middleware / remark). |
| `SpecSection` | 58 | Markdown `##` + optional directive, or generated from `layout.json` `documentStructure`. |
| `DomainTiles` | 53 | Fenced block or `::: trudoc-hub{type=domainTiles}` processed at build. |
| `DomainOrAreaHub` | 2 | Same as hub widget pipeline. |
| `PlatformSpecGraphShell` | 1 | Map index only; keep as island or dedicated MDX exception. |
| `SpecReaderShell` / `OpenInGraphButton` | 0 in MDX (nested inside `SpecPageHeader`) | Part of header injection. |

Other hub widgets (`SpecCompletenessReport`, `SpecWidgetRenderer`, graphs) appear primarily from **layout.json** → `SpecWidgetRenderer` at build time in Astro components, not always as literal imports in MDX (grep counts may be 0).

## 4. Layout and validation engine

| Module | Path |
|--------|------|
| Zod contracts + presets | [`packages/trudoc/src/layout/schema.ts`](../../../../packages/trudoc/src/layout/schema.ts), [`presets.ts`](../../../../packages/trudoc/src/layout/presets.ts), [`merge.ts`](../../../../packages/trudoc/src/layout/merge.ts) |
| Scanner | [`scan.ts`](../../../../packages/trudoc/src/layout/scan.ts) |
| Completeness / diagnostics | [`completeness.ts`](../../../../packages/trudoc/src/layout/completeness.ts), [`structureAndChildren.ts`](../../../../packages/trudoc/src/layout/structureAndChildren.ts), [`bodyMeta.ts`](../../../../packages/trudoc/src/layout/bodyMeta.ts) |
| MDX hub validation | [`mdxHubComponents.ts`](../../../../packages/trudoc/src/layout/mdxHubComponents.ts) |
| Human layout guide | [`AREA_LAYOUT_RECOMMENDATIONS.md`](../../../../packages/trudoc/src/layout/AREA_LAYOUT_RECOMMENDATIONS.md) |

Consumers: [`packages/trudoc/src/cli/layout-verify.ts`](../../../../packages/trudoc/src/cli/layout-verify.ts), [`packages/trudoc/scripts/bootstrap-platform-spec-layout.ts`](../../../../packages/trudoc/scripts/bootstrap-platform-spec-layout.ts), [`SpecWidgetRenderer.astro`](../../../../packages/beskid-docs-ui/src/platform-spec/SpecWidgetRenderer.astro).

## 5. Starlight and HTML hooks

- **Custom Starlight components:** [`packages/beskid-docs-ui/src/starlight/*.astro`](../../../../packages/beskid-docs-ui/src/starlight/) (wired in `astro.config.mjs` via `@beskid/docs-ui/starlight/…`).
- **Custom CSS order:** from `@beskid/docs-ui/shell-css` (`theme.material.css` → `starlight-layout.css` → `platform-spec.css`).
- **Starlight `Page.astro`:** Starlight 0.37 imports `Page` directly; `components.Page` override is **not** applied. First [`ContentPanel`](../../node_modules/@astrojs/starlight/components/Page.astro) wraps [`PageTitle`](../../node_modules/@astrojs/starlight/components/PageTitle.astro) (`h1#_top`); platform-spec hides duplicate title via [`platform-spec.css`](../../../../packages/beskid-docs-ui/src/styles/platform-spec.css).
- **Post-build HTML:** [`platformSpecHtmlDataAttr()`](../astro.config.mjs) adds `data-platform-spec` / `data-platform-spec-map` on built HTML under `dist/platform-spec/**`. **Dev server does not run this hook**; styling that depends on those attributes may differ in `astro dev` unless addressed later.

## 6. Content schema (Starlight extend)

[`src/content.config.ts`](../src/content.config.ts) extends `docsSchema` with `platformSpecExtend` (`specLevel`, `status`, `owner`, `submitter`, `relatedTopics`, `platformGraph`, `architectureGraph`, …). **Should be re-exported from trudoc** to keep parity with Node validators.

## 7. Remark and MD automation

| Piece | Location |
|-------|----------|
| `arch` code fence → graph HTML | [`packages/trudoc/scripts/remark-arch-code-fence.mjs`](../../../../packages/trudoc/scripts/remark-arch-code-fence.mjs) (used from [`astro.config.mjs`](../astro.config.mjs)) |
| Repo link fence | [`packages/trudoc/scripts/remark-repo-link-fence.mjs`](../../../../packages/trudoc/scripts/remark-repo-link-fence.mjs) |
| One-shot MDX injectors | e.g. [`packages/trudoc/scripts/inject-spec-article-chrome.mjs`](../../../../packages/trudoc/scripts/inject-spec-article-chrome.mjs) |

## 8. Client JS widgets

| Script | Role |
|--------|------|
| [`packages/beskid-docs-ui/src/client/platform-spec-graph-client.ts`](../../../../packages/beskid-docs-ui/src/client/platform-spec-graph-client.ts) | Platform map (`vis-network`) |
| [`packages/beskid-docs-ui/src/client/platform-spec-doc-layout.ts`](../../../../packages/beskid-docs-ui/src/client/platform-spec-doc-layout.ts) | Spec reader split layout |
| [`packages/beskid-docs-ui/src/client/platform-spec-map-tour.ts`](../../../../packages/beskid-docs-ui/src/client/platform-spec-map-tour.ts) | Intro tour |
| [`packages/beskid-docs-ui/src/client/architecture-graph-client.ts`](../../../../packages/beskid-docs-ui/src/client/architecture-graph-client.ts) | Architecture graph shell |

## 9. Risk register

| Risk | Mitigation |
|------|------------|
| `data-platform-spec` only on production build | Document; optional Vite middleware for dev; or move to inline script in layout. |
| Remark `updateConfig` merge behavior | Integration exports plugin arrays for explicit spread in `astro.config`. |
| Schema drift (`content.config` vs verify) | Single `trudoc` Zod export consumed by both. |
| Large MDX migration | Phased waves + keep MDX escape hatches for true islands. |

## 10. trudoc package map (target)

| Current location | trudoc destination |
|------------------|-------------------|
| (removed) `site/website/src/lib/platform-spec-layout/*` | `packages/trudoc/src/layout/*` |
| Layout verify script | `packages/trudoc/src/cli/layout-verify.ts` and `trudoc verify` presets |
| `platformSpecHtmlDataAttr` | `packages/trudoc/src/integration/html-data-attrs.ts` |
| Optional remark presets | `packages/trudoc/src/remark/*` |
| This audit | Stays in site or duplicated in trudoc README |

_Last updated as part of the trudoc implementation plan._
