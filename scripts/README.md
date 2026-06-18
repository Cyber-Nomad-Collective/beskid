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

Submodule init + native gates/publish lanes that run directly on Blacksmith
runners (the compiler gate is also Testbox-compatible). Dagger is only used for
the beskid_infra compose/deploy tooling, not for gates.

| Script | Used by |
|--------|---------|
| [`init-submodules.sh`](ci/init-submodules.sh) | GHCR / release / Open VSX / platform matrix checkouts |
| [`init-compiler-submodule.sh`](ci/init-compiler-submodule.sh) | Compiler + corelib (tags for semver) |
| [`compiler-rust-gate.sh`](ci/compiler-rust-gate.sh) | Compiler Rust gate (clippy + workspace tests) |
| [`lsp-command-contract-gate.sh`](ci/lsp-command-contract-gate.sh) | LSP + VS Code command-contract gate |
| [`corelib-gate.sh`](ci/corelib-gate.sh) | Corelib quality + `beskid test` |
| [`platform-smoke.sh`](ci/platform-smoke.sh) | Aggregate web-workspace smoke |
| [`site-build-gate.sh`](ci/site-build-gate.sh) | Auth / platform-spec build gate |
| [`vscode-gate.sh`](ci/vscode-gate.sh) | VS Code extension `bun test` |
| [`verify-frozen-lockfile.sh`](ci/verify-frozen-lockfile.sh) | Per-directory `bun install --frozen-lockfile` |
| [`compute-cli-version.sh`](ci/compute-cli-version.sh) | Rolling CLI/LSP semver |
| [`build-release-artifact.sh`](ci/build-release-artifact.sh) | Native CLI/LSP release build |
| [`publish-release-stream.sh`](ci/publish-release-stream.sh) | `gh release` for `cli-*` / `lsp-*` streams |
| [`corelib-publish.sh`](ci/corelib-publish.sh) | Corelib workspace → pckg |
| [`open-vsx-publish.sh`](ci/open-vsx-publish.sh) | Open VSX publish (native) |
| [`resolve-coolify-project-uuid.sh`](ci/resolve-coolify-project-uuid.sh) | Operator: resolve **Beskid** Coolify project UUID |

Coolify compose deploy: [`beskid_infra/scripts/`](../beskid_infra/scripts/README.md).

## Lazygit

[`lazygit/config.yml`](lazygit/config.yml) — recursive commit/push via [`git-commit-push-recursive.sh`](git-commit-push-recursive.sh) (lazygit only; not a standalone workflow).

## Local web CI

[`../validate-ci-local.sh`](../validate-ci-local.sh) — `dagger call platform-smoke` (see [`beskid_infra/dagger/README.md`](../beskid_infra/dagger/README.md)).

## Interactive setup

[`../site/setup-wizard.sh`](../site/setup-wizard.sh) — `just setup` from repo root.
