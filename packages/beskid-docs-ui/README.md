# @beskid/docs-ui

Starlight shell overrides, platform-spec reader chrome (Astro components), client scripts for the map and architecture graphs, and related CSS.

- **Peer deps:** `astro`, `@astrojs/starlight`.
- **Depends on:** `trudoc` (shared types, git-meta loader, related-topics HTML helpers, layout report reader).

The Beskid docs app (`site/website`) imports:

- `@beskid/docs-ui/shell-css` — absolute paths for Starlight `customCss`
- `@beskid/docs-ui/starlight/{Header,Footer,ThemeSelect}.astro`
- MDX imports `@beskid/docs-ui/platform-spec/*.astro`

Install from the superrepo root with `bun install` so workspaces link correctly.
