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

Submodule init only — gates and publish lanes run via Dagger ([`beskid_infra/dagger/README.md`](../beskid_infra/dagger/README.md)).

| Script | Used by |
|--------|---------|
| [`init-submodules.sh`](ci/init-submodules.sh) | GHCR / release / Open VSX / platform matrix checkouts |
| [`init-compiler-submodule.sh`](ci/init-compiler-submodule.sh) | Compiler + corelib (tags for semver) |
| [`init-beskid-infra-submodule.sh`](ci/init-beskid-infra-submodule.sh) | Workflows that invoke `beskid_infra/dagger` |
| [`resolve-coolify-project-uuid.sh`](ci/resolve-coolify-project-uuid.sh) | Operator: resolve **Beskid** Coolify project UUID |

Coolify compose deploy: [`beskid_infra/scripts/`](../beskid_infra/scripts/README.md).

## Lazygit

[`lazygit/config.yml`](lazygit/config.yml) — recursive commit/push via [`git-commit-push-recursive.sh`](git-commit-push-recursive.sh) (lazygit only; not a standalone workflow).

## Local web CI

[`../validate-ci-local.sh`](../validate-ci-local.sh) — `dagger call platform-smoke` (see [`beskid_infra/dagger/README.md`](../beskid_infra/dagger/README.md)).

## Interactive setup

[`../site/setup-wizard.sh`](../site/setup-wizard.sh) — `just setup` from repo root.
