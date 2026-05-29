# Coolify: beskid site

The documentation site runs as the **`site`** service in the production Coolify compose stack.

## Delivery model (GHCR + Compose)

| Layer | Responsibility |
|-------|----------------|
| **GitHub Actions** (`.github/workflows/container-images.yml`) | Build and push `ghcr.io/cyber-nomad-collective/beskid-site` |
| **beskid_infra** | [`compose/production/docker-compose.yml`](../beskid_infra/compose/production/docker-compose.yml) on Coolify |
| **OpenBao** | Optional keys under `secret/beskid/production/site` |

Operator guide: [beskid_infra/docs/deploy-compose.md](../beskid_infra/docs/deploy-compose.md).

## Compose entry

| Mode | File |
|------|------|
| **Platform stack (production)** | [`beskid_infra/compose/production/docker-compose.yml`](../beskid_infra/compose/production/docker-compose.yml) |
| **Single-service reference** | [`docker-compose.yml`](docker-compose.yml) |
| **Local build** | [`docker-compose.build.yml`](docker-compose.build.yml) |

## Domain

Production: `https://beskid-lang.org` (Coolify **Domains** on the `site` compose service).

## Related

- [Beskid auth hub](auth/COOLIFY.md)
- [beskid_infra](../beskid_infra/README.md)
