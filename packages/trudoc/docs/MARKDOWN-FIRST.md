# Markdown-first strategy (trudoc)

Goal: authors write **native Markdown** (`.md`) with **YAML frontmatter** and `layout.json`, without hand-importing Astro components in every page.

## Current state (Beskid)

- All `platform-spec` leaves are **`.mdx`** with repeated `SpecPageHeader`, `SpecSection`, `SpecArticleChrome`, `DomainTiles`, etc. (see `site/website/docs/trudoc-audit.md`).
- Starlight **always** emits `PageTitle` (`h1#_top`) in the first `ContentPanel`; Beskid CSS hides it where `SpecPageHeader` supplies the visible chrome.

## Recommended direction

1. **Single source of truth** — Keep normative metadata in frontmatter (`owner`, `submitter`, `status`, `specLevel`, …) from `trudoc/schema/content` + structural widgets in `layout.json` (already validated by `trudoc/layout`).
2. **Inject chrome at build** — Prefer one of:
   - **Remark / rehype** — Map hub presets to static HTML shells (same pattern as the existing `arch` fenced block in `astro.config.mjs`), then hydrate with small client scripts where needed.
   - **Starlight content components** — When the ecosystem exposes a stable wrapper for all docs under a route prefix, move injection there and drop CSS-only title hiding where possible.
3. **Escape hatch** — Keep **MDX** only for true islands (interactive graphs, rare JSX).

## Migration waves

1. Domain and area **hubs** — highest duplication of `DomainTiles` + `SpecPageHeader`; codemod to `.md` + fence or directive first.
2. **Feature** hubs — `SpecReaderShell` / tabs driven by `layout.json` widgets.
3. **Articles** — largest surface (`SpecArticleChrome`); generate wrapper via remark from `specLevel: article`.

## Decisions to lock before mass codemod

| Topic | Options |
|-------|---------|
| Hub syntax | CommonMark **fenced** ` ```trudoc-hub` JSON** vs **MDX directives** (`:::trudoc[...]`) — directives need a remark plugin and are not pure CM. |
| Title visibility | `SpecPageHeader` (or successor) should render `title` from collection entry data so `h1#_top` can remain suppressed. |
| CI | `trudoc verify` presets already gate layout + frontmatter; extend rule packs as new remark transforms land. |

This file is normative for **trudoc** consumers; update it when the first wave lands in Beskid content.
