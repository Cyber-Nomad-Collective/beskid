# trudoc

Extractable **documentation framework** pieces from the Beskid Starlight site: layout-tree validation (Zod + `layout.json`), optional **Astro integration** (remark slot + post-build HTML data attributes), and a **verify CLI** preset for CI.

## Contributor setup

From the **superrepo root** (Bun workspaces link `site/website`, `packages/trudoc`, and `packages/beskid-docs-ui`):

```bash
bun install
cd site/website && bun run verify:trudoc --preset ci
```

## Site root for CI / Docker / other repos

- **`BESKID_WEBSITE_ROOT`** — Absolute path to the Starlight site root (`src/content` lives underneath). Used by [`scripts/lib/website-root.mjs`](scripts/lib/website-root.mjs) and by **`resolveSiteRoot`** in [`src/layout/scan.ts`](src/layout/scan.ts).

- **`--site-root <path>`** or **`--site-root=<path>`** on [`src/cli/verify.ts`](src/cli/verify.ts) and [`src/cli/layout-verify.ts`](src/cli/layout-verify.ts) sets that env and uses the path as **`cwd`** for all verify steps.

Examples:

```bash
# From repo root (monorepo)
bunx tsx packages/trudoc/src/cli/verify.ts --site-root "$(pwd)/site/website" --preset ci

# Docker: any workdir, pass explicit root
docker run ... bunx tsx packages/trudoc/src/cli/verify.ts --site-root /repo/site/website --preset ci

# After workspace install, published bins resolve `tsx` from hoisted node_modules:
node packages/trudoc/bin/trudoc.mjs --site-root "$(pwd)/site/website" --preset ci
node packages/trudoc/bin/trudoc-layout.mjs --site-root "$(pwd)/site/website"
```

`package.json` exposes **`trudoc`** and **`trudoc-layout`** on `PATH` when the package is linked (for example `bun install` in a workspace that depends on `trudoc`). Docker and CI notes: [docs/DOCKER.md](./docs/DOCKER.md).

To work on `trudoc` alone you can still `cd packages/trudoc && bun install`, but CI and the docs site assume a **root** `bun install`.

Astro config:

```js
import trudoc from 'trudoc/integration';

export default defineConfig({
	integrations: [
		trudoc({
			htmlDataAttrs: {
				htmlSubdir: 'platform-spec',
				docAttr: 'data-platform-spec',
				mapIndexHtmlRel: 'platform-spec/index.html',
				mapAttr: 'data-platform-spec-map',
			},
			remarkPlugins: [],
		}),
		starlight({ /* … */ }),
	],
});
```

## Layout engine

Import validators and scanner from `trudoc/layout` (same public API as the former `platform-spec-layout` module).

## Starlight frontmatter extension

```ts
import { platformSpecExtend } from 'trudoc/schema/content';
import { docsSchema } from '@astrojs/starlight/schema';

schema: docsSchema({ extend: platformSpecExtend }),
```

## CSS layers (Beskid site)

Platform-spec and Starlight shell styles live in **`packages/beskid-docs-ui/src/styles/`** (imported via `@beskid/docs-ui/shell-css` in `site/website/astro.config.mjs`). The same filenames are mirrored under `packages/trudoc/css/` for third-party consumers who do not use `@beskid/docs-ui`.

## See also

- [docs/MARKDOWN-FIRST.md](./docs/MARKDOWN-FIRST.md) — migration strategy for native Markdown.
- [site/website/docs/trudoc-audit.md](../../site/website/docs/trudoc-audit.md) — inventory of Beskid-specific vs generic pieces.
