# Beskid site (`site/`)

Public web surface: documentation ([`website/`](website/)), auth hub ([`auth/`](auth/)), and Docker Compose for Coolify.

## First-time setup

From the **superrepo root**:

```bash
just setup
```

The interactive wizard installs toolchain pieces (optional), syncs submodules, copies `.env` examples, and runs `bun install`. Profiles cover docs-only, full developer, and infra operator workflows.

Non-interactive equivalent:

```bash
./site/setup-wizard.sh --profile docs
./scripts/setup-environment.sh --submodules beskid_web_common
```

## Docker Compose

| Service | Image deploy (Coolify / GHCR) | Local build |
|---------|--------------------------------|-------------|
| Docs site | [`docker-compose.yml`](docker-compose.yml) | [`docker-compose.build.yml`](docker-compose.build.yml) |
| Auth hub | [`auth/docker-compose.yml`](auth/docker-compose.yml) | [`auth/docker-compose.build.yml`](auth/docker-compose.build.yml) |

Build context for `*.build.yml` files is the **superrepo root** (required for `site/website/Dockerfile` and platform-spec git meta).

Operator notes: [`COOLIFY.md`](COOLIFY.md), [`auth/COOLIFY.md`](auth/COOLIFY.md).
