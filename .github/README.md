# Workflows in this repository

This repo is an **aggregate** (submodules and shared web tooling). CI is centralized in this directory and implemented through **Dagger** ([`beskid_infra/dagger/README.md`](../beskid_infra/dagger/README.md)).

## Active workflows (`.github/workflows/`)

| Workflow | Purpose |
|----------|---------|
| `beskid-platform.yml` | Dagger platform smoke + GHCR builds + Coolify compose deploy on `main` |
| `container-images.yml` | Build and push platform images to GHCR |
| `coolify-compose-deploy.yml` | Sync OpenBao → Coolify compose service (production) |
| `corelib.yml` | Corelib quality + test + pckg publish (Dagger) |
| `compiler.yml` | Compiler Rust gate, LSP contract, CLI/LSP releases (Dagger) |
| `publish-open-vsx.yml` | VS Code extension to Open VSX (Dagger) |

Replacement validation is **Dagger-first** — see [beskid_infra/dagger/README.md](../beskid_infra/dagger/README.md).

**Compiler releases:** set repo secret `COMPILER_RELEASE_TOKEN` (or reuse `COMPILER_SUBMODULE_TOKEN`) with `contents: write` on `beskid_compiler`. The docs site prebuild runs `sync:cli-version` against the rolling `cli-latest` release (see `site/website` / trudoc).

## Local validation

- **Web / docs (aggregate):** `./validate-ci-local.sh` — Dagger `platform-smoke`
- **Dagger lanes:** `dagger -m beskid_infra/dagger call <function> --source=.` (see [beskid_infra/dagger/README.md](../beskid_infra/dagger/README.md))
- **Compose:** `cd beskid_infra && just compose-config`
