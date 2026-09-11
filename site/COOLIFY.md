# Production: beskid site

The documentation site runs as the **`website`** service in the standalone production Compose stack.

## Delivery model

| Layer | Responsibility |
|-------|----------------|
| **Woodpecker** (`publish`) | Build and push `cr.beskid-lang.org/beskid/site` |
| **Watchtower runtime** | [`beskid_sites/deploy/docker-compose.yml`](../beskid_sites/deploy/docker-compose.yml) |
| **OpenBao** | Optional keys under `secret/beskid/production/site` |

Operator guide: [`beskid_sites/deploy/README.md`](../beskid_sites/deploy/README.md).

## Compose entry

| Mode | File |
|------|------|
| **Platform stack (production)** | [`beskid_sites/deploy/docker-compose.yml`](../beskid_sites/deploy/docker-compose.yml) |
| **Single-service reference** | [`docker-compose.yml`](docker-compose.yml) |
| **Local build** | [`docker-compose.build.yml`](docker-compose.build.yml) |

## Domain

Production: `https://beskid-lang.org` through the shared host edge.

## Related

- [Beskid auth hub](auth/COOLIFY.md)
- [Production deployment](../beskid_sites/deploy/README.md)
