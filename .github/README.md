# Workflows in this repository

This repo is an **aggregate** (submodules and shared web tooling). CI is centralized in this superrepo and implemented through workflows in this directory plus the shared Dagger module under `beskid_infra/dagger/`.

## Active workflows (`.github/workflows/`)

| Workflow | Purpose |
|----------|---------|
| `container-images.yml` | Build and push `beskid-site` and `beskid-auth` images to GHCR on `main` / `staging` |
| `publish-open-vsx.yml` | Build `beskid_lsp`, bundle into `beskid_vscode`, publish VSIX to Open VSX (matrix) via Dagger `open-vsx-publish` ([beskid_infra/dagger/](../beskid_infra/dagger/)) |
| `tofu-plan-apply.yml` | Run OpenTofu plan/apply for `beskid_infra/` environments |

Legacy quality/test/security workflows were intentionally removed. Replacement validation is **Dagger-first** — see [beskid_infra/dagger/README.md](../beskid_infra/dagger/README.md).

## Local validation

- **Web / docs (aggregate):** `./validate-ci-local.sh` — submodule init, `bun install`, site prebuild, platform-spec git-meta verify
- **Dagger lanes:** `cd beskid_infra/dagger && dagger call <function>` (see [beskid_infra/dagger/README.md](../beskid_infra/dagger/README.md))
