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
├── astro.config.mjs       # Starlight site config and sidebar
└── package.json
```

## Commands

Run from `site/website`:

| Command       | Action                                  |
| :------------ | :-------------------------------------- |
| `bun install` | Install dependencies                    |
| `bun dev`     | Start local dev server (`localhost:4321`) |
| `bun build`   | Build static site into `dist/`          |
| `bun preview` | Preview built site                      |

`bun dev` / `bun build` run `scripts/sync-cli-version.mjs` first (via `predev` / `prebuild`), which writes gitignored `src/data/cli-version.json` from the rolling GitHub release when reachable, otherwise from `../../compiler/crates/beskid_cli/Cargo.toml` in a full superrepo checkout.

## Deployment

Coolify deployment uses:

- Compose file: `site/infra/docker-compose.yml`
- Website image build: `site/website/Dockerfile`

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
