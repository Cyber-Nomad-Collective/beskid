# Beskid site (`site/`)

Public web surface: documentation ([`website/`](website/)), auth hub ([`auth/`](auth/)),
learn lane ([`learn/`](learn/)), and Docker Compose for Coolify.

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
| Learn lane | [`learn/docker-compose.yml`](learn/docker-compose.yml) | [`learn/docker-compose.build.yml`](learn/docker-compose.build.yml) |

## Run the public site locally

Run the source-build stack from `site/`:

```bash
docker compose -f docker-compose.build.yml up --build
```

Open `http://localhost:4321` for Beskid Docs and `http://localhost:4322` for
Learn. Use `docker compose down` to stop the stack.

Build context for `*.build.yml` files is the **superrepo root** (required for `site/website/Dockerfile`).

Production operator notes: [`../beskid_sites/deploy/README.md`](../beskid_sites/deploy/README.md).
