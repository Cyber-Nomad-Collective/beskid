# Workflows in this repository

This repo is an **aggregate** (submodules and shared web tooling). CI is centralized here and runs on **Blacksmith / GitHub-hosted runners via `scripts/ci/*.sh`** — Dagger is no longer in the gate or publish paths.

## Active workflows (`.github/workflows/`)

| Workflow | Purpose |
|----------|---------|
| `beskid-platform.yml` | Native platform smoke + GHCR builds + Coolify compose deploy on `main` |
| `container-images.yml` | Build and push platform images to GHCR (native site gates + lockfile checks) |
| `coolify-compose-deploy.yml` | Sync OpenBao → Coolify compose service (production) |
| `corelib.yml` | Corelib quality + test (native) + pckg publish |
| `compiler.yml` | Compiler Rust gate, LSP contract, CLI/LSP releases (native per-OS matrix) |
| `publish-open-vsx.yml` | VS Code extension to Open VSX (native OS-runner matrix) |
| `compiler-gate-testbox.yml` | Compiler gate on a Blacksmith Testbox (`workflow_dispatch` / PR) |
| `normative-spec.yml` | Normative spec workspace validation |
| `release.yml` | Versioned GHCR release tags + Coolify compose deploy |

Replacement validation is **script-first** — see [`scripts/ci/`](../scripts/ci/) and [`scripts/README.md`](../scripts/README.md).

**Compiler releases:** set repo secret `COMPILER_RELEASE_TOKEN` (or reuse `COMPILER_SUBMODULE_TOKEN`) with `contents: write` on `beskid_compiler`. The docs site prebuild runs `sync:cli-version` against the rolling `cli-latest` release (see `site/website` / trudoc).

## Local validation

- **Web / docs (aggregate):** `./validate-ci-local.sh`
- **Gates:** the `scripts/ci/*-gate.sh` scripts run anywhere the toolchain is installed (run directly or on a Testbox)
- **Compose:** `cd beskid_infra && just compose-config`
