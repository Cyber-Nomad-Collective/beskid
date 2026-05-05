# Running trudoc verification in Docker

CI and local prebuild use the same entry points as the Starlight site. The goal is a **reproducible environment** (fixed Bun version, clean `node_modules`) and an explicit **site root** so the working directory inside the container does not matter.

## What to run (CI-equivalent)

From the **monorepo root** after `bun install`:

```bash
bun --cwd site/website run verify:trudoc --preset ci
```

Full prebuild doc gate (matches `prebuild` minus `sync:cli-version` and `generate:platform-spec-git-meta`):

```bash
bun --cwd site/website run verify:trudoc --preset beskid-prebuild
```

## Site root without relying on cwd

Set an absolute path for the Starlight package (directory that contains `src/content`):

```bash
export BESKID_WEBSITE_ROOT=/work/repo/site/website
bun --cwd site/website run verify:trudoc --preset ci
```

Or pass the flag consumed by the trudoc CLIs (also sets `BESKID_WEBSITE_ROOT` for spawned `.mjs` validators):

```bash
bunx tsx packages/trudoc/src/cli/verify.ts --site-root /work/repo/site/website --preset ci
```

## Published `bin` (after `bun install` links `node_modules/.bin`)

From anywhere:

```bash
node node_modules/trudoc/bin/trudoc.mjs --site-root /work/repo/site/website --preset ci
node node_modules/trudoc/bin/trudoc-layout.mjs --site-root /work/repo/site/website
```

`trudoc` and `trudoc-layout` resolve the `tsx` CLI by walking up from the trudoc package toward the workspace root (hoisted installs).

## Example image

See [`Dockerfile`](../Dockerfile) in this package for a minimal **verify-only** image: it copies the workspace slices needed for `bun install` and runs the `ci` preset. Adjust `COPY` lines if your fork adds workspace packages the site depends on.

For day-to-day Beskid development, running from the superrepo with `bun install` at the root is simpler than maintaining a separate image.
