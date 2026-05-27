# Coolify: beskid site

Application: **beskid site** (`Cyber-Nomad-Collective/beskid`, branch `main`, base directory `/site`).

## Compose entry

Use [`site/docker-compose.yml`](docker-compose.yml) or [`site/infra/docker-compose.yml`](infra/docker-compose.yml) (equivalent build; context is the superrepo root).

## Submodules and build context

The docs image **requires** the `beskid_web_common` submodule (`packages/trudoc`, `packages/beskid-ui`) at build time. The Dockerfile copies `beskid_web_common/` and runs `bun install` from the root workspace lockfile.

Recommended Coolify settings:

1. **Initialize `beskid_web_common`** on clone (recursive submodules is fine; compiler/pckg are not required for this image but may be pulled if recursion is enabled).
2. Prefer a **non-shallow** clone when platform-spec git-meta needs full history (`fetch-depth: 0` in GitHub Actions).
3. Set **`NODE_AUTH_TOKEN`** (GitHub Packages read) as a build secret when registry fallback is needed without a populated submodule.
4. After bumping submodule pointers on `main`, push `beskid_web_common` commits before deploying.

Historical shallow-only failures on **compiler/pckg** submodules do not apply when submodule recursion is disabled; if recursion stays on, see [beskid_nexus/COOLIFY.md](../beskid_nexus/COOLIFY.md) for SHA reachability notes.

## Runtime 404s

Legacy `/execution/` and `/corelib/` URLs are handled by Astro redirects plus nginx fallbacks in [`site/website/nginx/default.conf`](website/nginx/default.conf). Unmapped paths redirect to [/platform-spec/legacy-spec-mapping/](https://beskid-lang.org/platform-spec/legacy-spec-mapping/).

## Health

Container healthcheck: `wget -q --spider http://127.0.0.1/`. Public URL: `https://beskid-lang.org`.

## Related applications

- [Beskid auth hub](auth/COOLIFY.md) — combined GitHub OAuth for Tracker, Nexus, and pckg (`/site/auth`, port 8090)
- [Beskid Tracker](../beskid_tracker/COOLIFY.md) — separate app (`/beskid_tracker`, port 3000). Deploy the docs site first so `/generated/platform-spec-catalog.json` is available for tracker docs management.
