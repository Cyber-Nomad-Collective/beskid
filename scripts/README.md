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
runners (the compiler gate is also Testbox-compatible). Dagger is retired.

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
| [`build-release-manifest.sh`](ci/build-release-manifest.sh) | Aggregate immutable OCI image records into a release manifest |
| [`validate-release-manifest.sh`](ci/validate-release-manifest.sh) | Enforce digest, SBOM, provenance, and source-commit policy |
| [`render-release-compose.sh`](ci/render-release-compose.sh) | Replace Beskid Compose image tags with exact manifest digests |
| [`deploy-release-manifest.sh`](ci/deploy-release-manifest.sh) | Plan/apply Coolify promotion with polling and rollback |
| [`post-deploy-smoke.sh`](ci/post-deploy-smoke.sh) | Trace-correlated lane health checks |
| [`sign-image.sh`](ci/sign-image.sh) | Required keyless cosign signing for promotable images |
| [`prepare-secure-dockerfile.sh`](ci/prepare-secure-dockerfile.sh) | Convert package-token ARGs to BuildKit secret mounts at build time |
| [`sync-runtime-env.sh`](ci/sync-runtime-env.sh) | Fail-closed OpenBao KV v2 → Coolify lane env synchronization |
| [`openspec-gate.sh`](ci/openspec-gate.sh) | Strict OpenSpec authority validation |
| [`conformance-gate.sh`](ci/conformance-gate.sh) | Requirement/provenance conformance validation |
| [`platform-integration-gate.sh`](ci/platform-integration-gate.sh) | Cross-site delivery integration contract |
| [`security-policy-gate.sh`](ci/security-policy-gate.sh) | Offline workflow and supply-chain policy |

Coolify lane configuration: [`beskid_infra/`](../beskid_infra/README.md).

## Lazygit

[`lazygit/config.yml`](lazygit/config.yml) — recursive commit/push via [`git-commit-push-recursive.sh`](git-commit-push-recursive.sh) (lazygit only; not a standalone workflow).

## Local CI

[`../validate-ci-local.sh`](../validate-ci-local.sh) runs the same integration,
OpenSpec, conformance, and supply-chain policy used by platform delivery.

Replacement delivery contracts run without external state changes:

```bash
bash scripts/ci/test/run-cicd-foundation-tests.sh
```

## Interactive setup

[`../site/setup-wizard.sh`](../site/setup-wizard.sh) — `just setup` from repo root.
