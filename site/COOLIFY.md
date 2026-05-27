# Coolify: beskid site

Application: **beskid site** (`Cyber-Nomad-Collective/beskid`).

## Delivery model (GHCR + GitHub Actions + OpenTofu)

| Layer | Responsibility |
|-------|----------------|
| **GitHub Actions** (`.github/workflows/container-images.yml`) | Push `main`/`staging`: build and push `ghcr.io/cyber-nomad-collective/beskid-site` |
| **GHCR** | Immutable images tagged `main`, `staging`, `sha-<commit>` |
| **beskid_infra** | [OpenTofu](https://github.com/Cyber-Nomad-Collective/beskid_infra) configures Coolify image apps and env/project resources; secrets from OpenBao |
| **Coolify** | Pull image only — **no** Git build-pack on the server |

Deploy matrix and operator steps: [beskid_infra/docs/deploy-matrix.md](https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/main/docs/deploy-matrix.md).
Bootstrap guide: [beskid_infra/docs/bootstrap.md](https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/main/docs/bootstrap.md).

Tracker catalog task: `coolify-multi-service-deploy-matrix` (v0.4).

## Compose entry

| Mode | File |
|------|------|
| **Production/staging (image)** | [`docker-compose.yml`](docker-compose.yml) — defaults to `IMAGE_TAG=main` |
| **Local build** | [`docker-compose.build.yml`](docker-compose.build.yml) |

```yaml
image: ghcr.io/cyber-nomad-collective/beskid-site:${IMAGE_TAG}
```

## Submodule / build context (legacy build path)

If you still build on Coolify from Git (not recommended after cutover), the docs image requires `beskid_web_common` at build time. Prefer **GitHub Actions → GHCR** instead.

1. Submodule pointers on `main` must be shallow-reachable for any Git-based build.
2. Docs build needs `beskid_web_common` checked out.
3. Prefer **non-shallow** clone when platform-spec git-meta needs full history (`fetch-depth: 0` in workflow).
4. **`NODE_AUTH_TOKEN`** for GitHub Actions builds — not Coolify build secrets after migration.

## Runtime 404s

Legacy `/execution/` and `/corelib/` URLs are handled by Astro redirects plus nginx fallbacks in [`site/website/nginx/default.conf`](website/nginx/default.conf). Unmapped paths redirect to [/platform-spec/legacy-spec-mapping/](https://beskid-lang.org/platform-spec/legacy-spec-mapping/).

## Health

Container healthcheck: `wget -q --spider http://127.0.0.1/`. Public URL: `https://beskid-lang.org`.

## Related applications

- [Beskid auth hub](auth/COOLIFY.md) — combined GitHub OAuth for Tracker, Nexus, and pckg
- [Beskid Tracker](../beskid_tracker/COOLIFY.md)
- [beskid_infra](https://github.com/Cyber-Nomad-Collective/beskid_infra) — OpenTofu + OpenBao layout
