# Coolify: beskid site

Application: **beskid site** (`Cyber-Nomad-Collective/beskid`, branch `main`, base directory `/site`).

## Compose entry

Use [`site/docker-compose.yml`](docker-compose.yml) or [`site/infra/docker-compose.yml`](infra/docker-compose.yml) (equivalent build; context is the superrepo root).

## Submodules and build context

The docs image **requires** the `beskid_web_common` submodule (`packages/trudoc`, `packages/beskid-ui`) at build time. The Dockerfile copies `beskid_web_common/` and runs `bun install` from the root workspace lockfile.

Recommended Coolify settings:

1. **Submodule pointers on `main` must be shallow-reachable.** Coolify runs `git clone --recurse-submodules --shallow-submodules` and shallow-fetches **every** gitlinked submodule (including `pckg` and `compiler`), even when [`.gitmodules`](../.gitmodules) marks them `active = false`. A pin to a feature-branch-only commit fails with `upload-pack: not our ref` (for example `pckg` at `cbe9d2c` before `e2810c8`).
2. **Docs build only needs `beskid_web_common` checked out.** `active = false` on other submodules limits later `git submodule update --init --recursive` to active paths only; it does not skip the initial shallow clone of inactive gitlinks. To avoid cloning `pckg`/`compiler` entirely, turn off recursive submodules in Coolify and run `git submodule update --init --depth 1 beskid_web_common` after checkout, or use `git clone --recurse-submodules=beskid_web_common` if your Git/Coolify version supports a pathspec.
3. Prefer a **non-shallow** superrepo clone when platform-spec git-meta needs full history (GitHub Actions uses `fetch-depth: 0`).
4. Set **`NODE_AUTH_TOKEN`** (GitHub Packages read) as a build secret when registry fallback is needed without a populated submodule.
5. After bumping the `beskid_web_common` pointer on `main`, push that submodule repo before deploying.

For apps that intentionally pin **pckg** or **compiler** to unreachable SHAs, use a non-shallow fetch or init those submodules explicitly in CI (see [beskid_nexus/COOLIFY.md](../beskid_nexus/COOLIFY.md)).

## Runtime 404s

Legacy `/execution/` and `/corelib/` URLs are handled by Astro redirects plus nginx fallbacks in [`site/website/nginx/default.conf`](website/nginx/default.conf). Unmapped paths redirect to [/platform-spec/legacy-spec-mapping/](https://beskid-lang.org/platform-spec/legacy-spec-mapping/).

## Health

Container healthcheck: `wget -q --spider http://127.0.0.1/`. Public URL: `https://beskid-lang.org`.

## Related applications

- [Beskid auth hub](auth/COOLIFY.md) — combined GitHub OAuth for Tracker, Nexus, and pckg (`/site/auth`, port 8090)
- [Beskid Tracker](../beskid_tracker/COOLIFY.md) — separate app (`/beskid_tracker`, port 3000). Deploy the docs site first so `/generated/platform-spec-catalog.json` is available for tracker docs management.
