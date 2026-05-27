# Beskid Website (Astro + Starlight)

This package contains the Beskid landing page and documentation site.

## Canonical docs source

Documentation is authored directly in:

`src/content/docs/`

No external docs sync step is required.

## Structure

```text
website/
├── src/content/docs/      # Beskid docs content (canonical)
├── src/assets/            # Images and static assets used by docs
├── public/                # Static files served as-is
│   └── generated/         # Public JSON APIs (e.g. platform-spec-nav-tree.json for roadmap)
├── astro.config.mjs       # Starlight config (platform-spec + book area nav)
├── src/generated/         # Generated nav trees (platform-spec, book)
└── package.json
```

## Commands

Run from `site/website`:

| Command       | Action                                  |
| :------------ | :-------------------------------------- |
| `bun install` | Install dependencies                    |
| `bun dev`     | Start local dev server (`localhost:4321`) |
| `bun dev:clean` | Remove `.astro` / `dist` / Vite cache, then start dev (use after a bad local image path) |
| `bun build`   | Build static site into `dist/`          |
| `bun preview` | Preview built site                      |

`bun dev` / `bun build` run `predev` / `prebuild`: CLI version sync, platform-spec git meta, `generate:platform-spec-nav-tree`, `generate:platform-spec-catalog`, `generate:book-nav-tree`, `verify:book-images`, `verify:book-layout` (Starlight two-column width guards), and trudoc CI verify (build only).

**Public JSON APIs** (served from `public/generated/` after prebuild, no separate roadmap deploy when spec changes):

| URL | Purpose |
|-----|---------|
| `/generated/platform-spec-nav-tree.json` | Nested platform-spec nav for [beskid_tracker](https://github.com/Cyber-Nomad-Collective/beskid/tree/main/beskid_tracker) spec picker |
| `/generated/platform-spec-catalog.json` | Flat index of all platform-spec documents (includes ADRs omitted from nav tree) |
| `/generated/platform-spec-docs/<slug>.json` | Per-document frontmatter + body bundles for tracker proposal editing |

Consumers (for example [beskid_tracker](https://github.com/Cyber-Nomad-Collective/beskid/tree/main/beskid_tracker)) fetch from `https://beskid-lang.org` after each docs deploy.

In-site navigation uses Astro `ClientRouter` with `fallback="animate"` (View Transitions polyfill on browsers without native support). Directional slide is applied on the Starlight `<main>` pane via [`Page.astro`](https://github.com/Cyber-Nomad-Collective/beskid_web_common/blob/main/packages/beskid-ui/src/starlight/Page.astro) from `@beskid/beskid-ui` (re-diff when upgrading `@astrojs/starlight`).

**Agents:** do not edit book Markdown image tags (`![...](...)`) — especially `src/content/docs/book/00-why-beskid-exists/`. The author uses remote HTTPS URLs on purpose; never replace them with local paths or text. See root `AGENTS.md`. If `verify:book-images` or `ImageNotFound` fails, report to the author; do not rewrite image tags.

Authoring note: co-located images beside `.md` files are allowed where the author placed them; a missing file can brick `astro dev` until you add the asset and run `bun run dev:clean`.

Public documentation is split into **[Platform specification](/platform-spec/)** (normative) and **[The Beskid Book](/book/)** (informative tutorial + reference). Starlight’s default docs sidebar is disabled; each area uses its own navigation rail.

## Deployment

Coolify deployment uses:

- Image deploy: [`site/docker-compose.yml`](../docker-compose.yml)
- Build from Git: [`site/docker-compose.build.yml`](../docker-compose.build.yml) (build context: superrepo root)
- Website image build: `site/website/Dockerfile`
- Operator notes (submodule clone failures, health): [`site/COOLIFY.md`](../COOLIFY.md)

The Docker build context includes `.git` (and the image installs `git`) so prebuild can generate platform-spec revision history. Prefer a non-shallow clone on Coolify when possible for accurate `git log --follow` counts across renames.

The site image installs `trudoc` and `@beskid/beskid-ui` from [GitHub Packages](https://github.com/orgs/Cyber-Nomad-Collective/packages?repo_name=beskid_web_common) (see root `.npmrc`).

If Coolify still runs `git submodule update --recursive`, disable recursive submodules in the application settings or limit init to `compiler` / `pckg` only—the docs site workflow does not require them (CLI version sync falls back to the public `cli-latest` release).

## GitHub-managed comments and edit suggestions

Docs pages can use GitHub-native feedback:

- Starlight `Edit page` links open file edits directly in GitHub.
- giscus embeds page comments using GitHub Discussions.

Configure deployment env vars (see `.env.example`):

- `PUBLIC_GISCUS_REPO`
- `PUBLIC_GISCUS_REPO_ID`
- `PUBLIC_GISCUS_CATEGORY`
- `PUBLIC_GISCUS_CATEGORY_ID`
- `PUBLIC_GISCUS_MAPPING`
- `PUBLIC_GISCUS_STRICT`
- `PUBLIC_GISCUS_REACTIONS_ENABLED`
- `PUBLIC_GISCUS_INPUT_POSITION`
- `PUBLIC_GISCUS_LANG`
- `PUBLIC_GISCUS_EMIT_METADATA`
- `PUBLIC_GISCUS_THEME` (`sync` or e.g. `preferred_color_scheme`)

On platform-spec pages, readers can **select text** and use **Copy quote for discussion** to paste a quoted passage plus link into giscus.
