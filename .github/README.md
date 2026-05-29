# Workflows in this repository

This repo is an **aggregate** (submodules and shared web tooling). CI is centralized in this superrepo and implemented through workflows in this directory plus the shared Dagger module under `beskid_infra/dagger/`.

## Active workflows (`.github/workflows/`)

| Workflow | Purpose |
|----------|---------|
| `beskid-platform.yml` | GHCR builds + Coolify compose deploy on `main` |
| `container-images.yml` | Build and push platform images to GHCR |
| `coolify-compose-deploy.yml` | Sync OpenBao → Coolify compose service (production) |
| `publish-open-vsx.yml` | VS Code extension to Open VSX |

Legacy quality/test/security workflows were intentionally removed. Replacement validation is **Dagger-first** — see [beskid_infra/dagger/README.md](../beskid_infra/dagger/README.md).

## Local validation

- **Web / docs (aggregate):** `./validate-ci-local.sh` — submodule init, `bun install`, site prebuild, platform-spec git-meta verify
- **Dagger lanes:** `cd beskid_infra/dagger && dagger call <function>` (see [beskid_infra/dagger/README.md](../beskid_infra/dagger/README.md))
- **Compose:** `cd beskid_infra && just compose-config`
