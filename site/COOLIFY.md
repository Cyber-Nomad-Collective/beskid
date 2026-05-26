# Coolify: beskid site

Application: **beskid site** (`Cyber-Nomad-Collective/beskid`, branch `main`, base directory `/site`).

## Compose entry

Use [`site/docker-compose.yml`](docker-compose.yml) or [`site/infra/docker-compose.yml`](infra/docker-compose.yml) (equivalent build; context is the superrepo root).

## Submodule clone failures (historical)

Coolify clones with `--recurse-submodules --shallow-submodules`. That can fail when the superrepo pins a submodule SHA that is not reachable from a depth-1 fetch, for example:

```text
fatal: Fetched in submodule path 'pckg', but it did not contain <sha>
fatal: Fetched in submodule path 'compiler/corelib', but it did not contain <sha>
```

The **docs site image does not need submodules** (only `packages/*`, `site/website`, and `.git` for platform-spec git meta). Recommended Coolify settings:

1. **Disable recursive submodules** for this application, or limit init to none.
2. Prefer a **non-shallow** clone when submodules stay enabled.
3. After bumping submodule pointers on `main`, ensure each submodule commit is pushed to its remote before deploying.

## Runtime 404s

Legacy `/execution/` and `/corelib/` URLs are handled by Astro redirects plus nginx fallbacks in [`site/website/nginx/default.conf`](website/nginx/default.conf). Unmapped paths redirect to [/platform-spec/legacy-spec-mapping/](https://beskid-lang.org/platform-spec/legacy-spec-mapping/).

## Health

Container healthcheck: `wget -q --spider http://127.0.0.1/`. Public URL: `https://beskid-lang.org`.
