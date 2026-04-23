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
