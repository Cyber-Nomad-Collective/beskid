# Superrepo scripts

## Toolchain

[`install-deps.sh`](install-deps.sh) reads [`repo-deps.json`](../repo-deps.json) and installs/checks CLIs (groups: `infra`, `beskid`, `ops`). Libraries: [`lib/`](lib/).

```bash
./scripts/install-deps.sh --check
./scripts/install-deps.sh --install -y --group beskid
```

## Checkout

[`setup-environment.sh`](setup-environment.sh) — submodules + root `bun install` (see [`../README.md`](../README.md)).

## CI (`scripts/ci/`)

| Script | Used by |
|--------|---------|
| [`resolve-coolify-project-uuid.sh`](ci/resolve-coolify-project-uuid.sh) | Resolve **Beskid** Coolify project UUID |
| [`init-submodules.sh`](ci/init-submodules.sh) | GHCR / release matrix checkouts |
| [`open-vsx-publish.sh`](ci/open-vsx-publish.sh) | VS Code extension publish |

Coolify compose deploy: [`beskid_infra/scripts/`](../beskid_infra/scripts/README.md).

## Lazygit

[`lazygit/config.yml`](lazygit/config.yml) — recursive commit/push via [`git-commit-push-recursive.sh`](git-commit-push-recursive.sh) (lazygit only; not a standalone workflow).

## Local web CI

[`../validate-ci-local.sh`](../validate-ci-local.sh) — submodule init, site prebuild, platform-spec git-meta verify.

## Interactive setup

[`../site/setup-wizard.sh`](../site/setup-wizard.sh) — `just setup` from repo root.
