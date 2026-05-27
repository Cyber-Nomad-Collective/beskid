# Coolify: beskid site

Application: **beskid site** (`Cyber-Nomad-Collective/beskid`, branch `main`, base directory `/site`).

## Compose entry

Use [`site/docker-compose.yml`](docker-compose.yml) or [`site/infra/docker-compose.yml`](infra/docker-compose.yml) (equivalent build; context is the superrepo root).

## Submodules and build context

The docs image **requires** the `beskid_web_common` submodule (`packages/trudoc`, `packages/beskid-ui`) at build time. The Dockerfile copies `beskid_web_common/` and runs `bun install` from the root workspace lockfile.

Recommended Coolify settings:

1. **Recursive submodules** are OK: root [`.gitmodules`](../.gitmodules) sets `active = false` on every submodule except **`beskid_web_common`**, so Coolify’s default `git clone --recurse-submodules --shallow-submodules` only fetches what the docs image needs.
2. Prefer a **non-shallow** superrepo clone when platform-spec git-meta needs full history (GitHub Actions uses `fetch-depth: 0`).
3. Set **`NODE_AUTH_TOKEN`** (GitHub Packages read) as a build secret when registry fallback is needed without a populated submodule.
4. After bumping the `beskid_web_common` pointer on `main`, push that submodule repo before deploying.

If clone still fails with `not our ref` on **pckg** or **compiler**, Coolify is ignoring `submodule.active` (older Git) or using a custom clone command—disable recursive submodules and run `git submodule update --init --depth 1 beskid_web_common` after checkout instead.

**Do not** rely on shallow recursive clone for apps that need **pckg** at a feature-branch SHA; init those submodules explicitly in CI or use a non-shallow fetch (see [beskid_nexus/COOLIFY.md](../beskid_nexus/COOLIFY.md)).

## Runtime 404s

Legacy `/execution/` and `/corelib/` URLs are handled by Astro redirects plus nginx fallbacks in [`site/website/nginx/default.conf`](website/nginx/default.conf). Unmapped paths redirect to [/platform-spec/legacy-spec-mapping/](https://beskid-lang.org/platform-spec/legacy-spec-mapping/).

## Health

Container healthcheck: `wget -q --spider http://127.0.0.1/`. Public URL: `https://beskid-lang.org`.

## Related applications

- [Beskid auth hub](auth/COOLIFY.md) — combined GitHub OAuth for Tracker, Nexus, and pckg (`/site/auth`, port 8090)
- [Beskid Tracker](../beskid_tracker/COOLIFY.md) — separate app (`/beskid_tracker`, port 3000). Deploy the docs site first so `/generated/platform-spec-catalog.json` is available for tracker docs management.
